# AWS Infrastructure as Code

このディレクトリには、Todo List アプリケーションのAWSインフラストラクチャ定義が含まれます。

## クイックスタート

```bash
# 1. AWS認証
aws sso login --profile <profile-name>  # SSO使用時
# または
aws configure  # IAM Access Keys使用時

# 2. 認証確認
aws sts get-caller-identity

# 3. Terraformでインフラ構築
cd apps/iac/envs/dev
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# 4. 出力値を確認
terraform output
```

詳細な手順は「デプロイメントフロー」セクションを参照してください。

## アーキテクチャ概要

### 構成要素
- **フロントエンド**: CloudFront + S3 (静的ホスティング)
- **API**: ECS Fargate (コンテナ)
- **ロードバランサー**: Application Load Balancer (ALB)
- **データベース**: Aurora Serverless v2 (PostgreSQL)
- **シークレット管理**: AWS Secrets Manager
- **コンテナレジストリ**: Amazon ECR
- **ネットワーク**: VPC, Subnets, Security Groups
- **ドメイン**: AWS提供のURL（CloudFront、ALB）

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │    CloudFront CDN    │ (xxxxx.cloudfront.net)
              │  - HTTPS termination │
              │  - Caching           │
              └──────┬──────┬────────┘
                     │      │
        ┌────────────┘      └────────────┐
        │                                │
        ▼ (path: /)                     ▼ (path: /api/*)
   ┌─────────┐                   ┌──────────────────┐
   │   S3    │                   │       ALB        │ (xxx.elb.amazonaws.com)
   │ Bucket  │                   │  - Health Check  │
   │ (Web)   │                   │  - TLS/SSL       │
   └─────────┘                   └────────┬─────────┘
                                          │
                                          │ Target Group
                                          ▼
                    ┌──────────────────────────────────────┐
                    │           ECS Cluster                │
                    │  ┌──────────────────────────────┐   │
                    │  │   ECS Service (Fargate)      │   │
                    │  │  ┌────────────────────────┐  │   │
                    │  │  │  ECS Task (API)        │  │   │
                    │  │  │  - Hono API Server     │  │   │
                    │  │  │  - Port: 8080          │  │   │
                    │  │  │  - CPU: 256, Mem: 512  │  │   │
                    │  │  └──────────┬─────────────┘  │   │
                    │  └─────────────┼────────────────┘   │
                    └────────────────┼────────────────────┘
                                     │
                                     │ Private Subnet
                                     ▼
                    ┌──────────────────────────────────────┐
                    │    Aurora Serverless v2 Cluster      │
                    │  ┌──────────────────────────────┐   │
                    │  │  Writer Instance             │   │
                    │  │  - Engine: PostgreSQL 16     │   │
                    │  │  - Min ACU: 0.5              │   │
                    │  │  - Max ACU: 1.0              │   │
                    │  └──────────────────────────────┘   │
                    │  ┌──────────────────────────────┐   │
                    │  │  Secrets Manager             │   │
                    │  │  - DB Password               │   │
                    │  │  - Auto Rotation: 30 days    │   │
                    │  └──────────────────────────────┘   │
                    └──────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Container Registry                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Amazon ECR Repository                                    │  │
│  │  - todo-api:latest                                        │  │
│  │  - Lifecycle Policy: Keep last 10 images                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## ネットワーク構成

### VPC
```
VPC CIDR: 10.0.0.0/16
├── Public Subnet 1:  10.0.1.0/24  (ap-northeast-1a)
├── Public Subnet 2:  10.0.2.0/24  (ap-northeast-1c)
├── Private Subnet 1: 10.0.11.0/24 (ap-northeast-1a) - ECS Tasks
├── Private Subnet 2: 10.0.12.0/24 (ap-northeast-1c) - ECS Tasks
├── DB Subnet 1:      10.0.21.0/24 (ap-northeast-1a) - Aurora
└── DB Subnet 2:      10.0.22.0/24 (ap-northeast-1c) - Aurora
```

### セキュリティグループ

#### ALB Security Group
```yaml
Ingress:
  - Port: 443 (HTTPS)
    Source: CloudFront Managed Prefix List
  - Port: 80 (HTTP)
    Source: 0.0.0.0/0
Egress:
  - All Traffic
    Destination: ECS Security Group
```

#### ECS Security Group
```yaml
Ingress:
  - Port: 8080 (API)
    Source: ALB Security Group
Egress:
  - Port: 5432 (PostgreSQL)
    Destination: RDS Security Group
  - Port: 443 (HTTPS)
    Destination: 0.0.0.0/0  # For Secrets Manager, ECR
```

#### RDS Security Group
```yaml
Ingress:
  - Port: 5432 (PostgreSQL)
    Source: ECS Security Group
Egress:
  - None (default deny)
```

## AWSリソース詳細

### 1. CloudFront Distribution
```yaml
Origins:
  - S3 Bucket (Web static files)
    - Origin Path: /
    - Origin Access Identity: Yes

  - ALB (API)
    - Origin Path: /api
    - Origin Protocol Policy: HTTPS Only
    - Custom Headers:
        X-Forwarded-Host: $host

Behaviors:
  - Path Pattern: /api/*
    Target: ALB Origin
    Viewer Protocol: Redirect HTTP to HTTPS
    Allowed Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
    Cache Policy: Disabled (API)
    Origin Request Policy: All headers, query strings, cookies

  - Path Pattern: /*
    Target: S3 Origin
    Viewer Protocol: Redirect HTTP to HTTPS
    Allowed Methods: GET, HEAD, OPTIONS
    Cache Policy: CachingOptimized
    Compress: Yes

Error Pages:
  - 403, 404 → /index.html (SPA routing)

Settings:
  - Price Class: Use All Edge Locations (PriceClass_All)
  - HTTP Version: HTTP/2 enabled
  - IPv6: Enabled
  - SSL Certificate: CloudFront Default (*.cloudfront.net)
```

### 2. S3 Bucket (Frontend)
```yaml
Bucket Name: todo-app-frontend-${ACCOUNT_ID}
Versioning: Disabled
Public Access: Blocked (CloudFront OAI only)
Static Website Hosting: Disabled (CloudFront handles routing)
Lifecycle Rules:
  - Delete old versions after 7 days
CORS: Not required (CloudFront handles)
```

### 3. Application Load Balancer
```yaml
Type: Application Load Balancer
Scheme: Internet-facing
Subnets: Public Subnet 1, Public Subnet 2
Security Group: ALB Security Group
IP Address Type: IPv4

Listeners:
  - Port: 80 (HTTP)
    Default Action: Redirect to 443

  - Port: 443 (HTTPS)
    SSL Certificate: ACM Certificate (*.elb.amazonaws.com wildcard)
    Default Action: Forward to ECS Target Group

Target Group:
  Name: todo-api-tg
  Protocol: HTTP
  Port: 8080
  Target Type: IP
  Health Check:
    Path: /health
    Interval: 30s
    Timeout: 5s
    Healthy Threshold: 2
    Unhealthy Threshold: 3
    Matcher: 200
  Deregistration Delay: 30s
```

### 4. ECS Cluster & Service
```yaml
Cluster:
  Name: todo-app-cluster
  Capacity Providers: FARGATE, FARGATE_SPOT

Service:
  Name: todo-api-service
  Launch Type: FARGATE
  Desired Count: 2
  Min Healthy Percent: 100
  Max Percent: 200
  Deployment Configuration:
    Type: Rolling Update
  Network Configuration:
    Subnets: Private Subnet 1, Private Subnet 2
    Security Groups: ECS Security Group
    Assign Public IP: Disabled
  Load Balancer:
    Target Group: todo-api-tg
    Container Name: todo-api
    Container Port: 8080
  Service Discovery: Disabled
  Auto Scaling:
    Min Tasks: 1
    Max Tasks: 4
    Target Tracking:
      - CPU Utilization: 70%
      - Memory Utilization: 80%

Task Definition:
  Family: todo-api
  Network Mode: awsvpc
  Requires Compatibilities: FARGATE
  CPU: 256 (.25 vCPU)
  Memory: 512 MB
  Execution Role: ECSTaskExecutionRole
  Task Role: ECSTaskRole

  Container:
    Name: todo-api
    Image: ${ECR_REPO_URL}:latest
    Port Mappings:
      - Container Port: 8080
        Protocol: tcp
    Environment:
      - PORT: 8080
      - NODE_ENV: production
    Secrets:
      - DATABASE_URL:
          ValueFrom: arn:aws:secretsmanager:region:account:secret:todo-db-credentials
      - BEARER_TOKEN:
          ValueFrom: arn:aws:secretsmanager:region:account:secret:todo-api-bearer-token
    Logging:
      LogDriver: awslogs
      Options:
        awslogs-group: /ecs/todo-api
        awslogs-region: ap-northeast-1
        awslogs-stream-prefix: ecs
    Health Check:
      Command: ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
      Interval: 30
      Timeout: 5
      Retries: 3
      StartPeriod: 60
```

### 5. Amazon ECR
```yaml
Repository:
  Name: todo-api
  Image Tag Mutability: MUTABLE
  Scan on Push: Enabled
  Encryption: AES-256

Lifecycle Policy:
  Rules:
    - Priority: 1
      Description: Keep last 10 images
      Selection:
        Tag Status: Any
        Count Type: Image Count
        Count Number: 10
      Action: Expire
```

### 6. Aurora Serverless v2
```yaml
Cluster:
  Engine: aurora-postgresql
  Engine Version: 16.4
  Database Name: todo_db
  Master Username: postgres
  Master Password: Stored in Secrets Manager

  Serverless v2 Scaling:
    Min Capacity: 0.5 ACU
    Max Capacity: 1.0 ACU
    Auto Pause: Disabled (v2 doesn't support pause)

  Network:
    VPC: todo-vpc
    Subnets: DB Subnet Group (DB Subnet 1, 2)
    Security Group: RDS Security Group
    Publicly Accessible: No

  Backup:
    Backup Retention Period: 7 days
    Preferred Backup Window: 03:00-04:00 UTC (12:00-13:00 JST)
    Backup Window: Automated

  Maintenance:
    Preferred Maintenance Window: Mon:04:00-Mon:05:00 UTC

  Encryption:
    Storage Encryption: Enabled (KMS)
    Encryption Key: AWS Managed Key

  Enhanced Monitoring: Enabled (60 seconds)
  Performance Insights: Enabled (7 days retention)

  Deletion Protection: Enabled

DB Instance (Writer):
  Instance Class: db.serverless
  Publicly Accessible: No
```

### 7. AWS Secrets Manager
```yaml
Secrets:
  - Name: todo-db-credentials
    Description: Aurora PostgreSQL credentials
    Secret Type: RDS Database Credentials
    Rotation: Enabled (30 days)
    Rotation Lambda: Auto-created
    Secret Structure:
      username: postgres
      password: <auto-generated>
      engine: postgres
      host: <aurora-endpoint>
      port: 5432
      dbname: todo_db

  - Name: todo-api-bearer-token
    Description: API Bearer Token for authentication
    Secret Type: Other
    Rotation: Disabled (manual)
    Secret Structure:
      token: <generated-token>
```

### 8. IAM Roles & Policies

#### ECS Task Execution Role
```yaml
Role Name: ECSTaskExecutionRole
Managed Policies:
  - AmazonECSTaskExecutionRolePolicy
Custom Policies:
  - GetSecretValue (Secrets Manager)
  - GetAuthorizationToken (ECR)
  - GetDownloadUrlForLayer (ECR)
  - BatchGetImage (ECR)
```

#### ECS Task Role
```yaml
Role Name: ECSTaskRole
Custom Policies:
  - GetSecretValue (Secrets Manager) - for runtime access
  - CloudWatch Logs Write
```

#### CloudFront OAI (Origin Access Identity)
```yaml
Purpose: Allow CloudFront to access S3 bucket
S3 Bucket Policy:
  Principal:
    CanonicalUser: <CloudFront OAI Canonical User ID>
  Action:
    - s3:GetObject
  Resource:
    - arn:aws:s3:::todo-app-frontend-${ACCOUNT_ID}/*
```

## 環境変数

### API (ECS Task)
```bash
# Application
PORT=8080
NODE_ENV=production

# Database (from Secrets Manager)
DATABASE_URL=postgresql://postgres:${password}@${host}:5432/todo_db

# Authentication (from Secrets Manager)
BEARER_TOKEN=${token}

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Timezone
TZ=Asia/Tokyo
```

### Web (Build Time)
```bash
# API Endpoint (CloudFront URL)
VITE_API_URL=https://xxxxx.cloudfront.net

# Auth Token (same as API BEARER_TOKEN)
VITE_AUTH_TOKEN=${token}

# Timezone
VITE_TIMEZONE=Asia/Tokyo
```

## デプロイメントフロー

### 0. AWS認証（前提条件）

インフラ構築の前に、AWS CLIの認証が必要です。

#### Option A: AWS SSO (推奨)

組織でAWS SSOを使用している場合:

```bash
# 1. AWS SSOプロファイルを設定（初回のみ）
aws configure sso
# プロンプトに従って設定:
#   SSO session name: my-sso
#   SSO start URL: https://your-org.awsapps.com/start
#   SSO region: ap-northeast-1
#   SSO registration scopes: sso:account:access

# 2. SSOにログイン
aws sso login --profile <profile-name>
# ブラウザが開くので認証を完了

# 3. 認証確認
aws sts get-caller-identity --profile <profile-name>
# {
#     "UserId": "AROAXXXXXXXXXXXXXXXXX:user@example.com",
#     "Account": "123456789012",
#     "Arn": "arn:aws:sts::123456789012:assumed-role/..."
# }

# 4. デフォルトプロファイルとして設定（オプション）
export AWS_PROFILE=<profile-name>
```

#### Option B: IAM Access Keys

個人アカウントやCI/CDで使用する場合:

```bash
# 1. AWS CLIを設定
aws configure
# プロンプトに入力:
#   AWS Access Key ID: AKIAXXXXXXXXXXXXXXXX
#   AWS Secret Access Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
#   Default region name: ap-northeast-1
#   Default output format: json

# 2. 認証確認
aws sts get-caller-identity
# {
#     "UserId": "AIDAXXXXXXXXXXXXXXXXX",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-username"
# }
```

#### 必要なIAM権限

インフラ構築に必要な主な権限:

| サービス | 権限 | 用途 |
|---------|------|------|
| EC2 | `ec2:*` | VPC, Subnets, Security Groups, NAT Gateway |
| ECS | `ecs:*` | Cluster, Service, Task Definition |
| ELB | `elasticloadbalancing:*` | Application Load Balancer |
| RDS | `rds:*` | Aurora Serverless v2 |
| S3 | `s3:*` | Frontend bucket, Terraform state |
| CloudFront | `cloudfront:*` | CDN Distribution |
| ECR | `ecr:*` | Container Registry |
| Secrets Manager | `secretsmanager:*` | DB credentials, API tokens |
| IAM | `iam:*` | Roles and policies |
| CloudWatch | `logs:*`, `cloudwatch:*` | Logs, Alarms |
| Cognito | `cognito-idp:*` | User Pool, App Client |
| DynamoDB | `dynamodb:*` | Terraform state locking |

開発環境では `AdministratorAccess` ポリシーを使用することも可能です。

### 1. インフラストラクチャ構築
```bash
# AWS認証済みであることを確認
aws sts get-caller-identity

# Terraform でインフラを構築
cd apps/iac/envs/dev  # または prod
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# 出力される値:
# - CloudFront Distribution URL
# - ALB DNS Name
# - ECR Repository URL
# - Aurora Endpoint
# - Secrets ARNs
```

### 1.5. 環境変数ファイル (.env) の生成

Terraformの出力から、APIとWebの`.env`ファイルを自動生成できます。

```bash
# 環境ディレクトリに移動
cd apps/iac/envs/dev  # または prod

# API用の.envファイルを生成
terraform output -raw api_env_config > ../../../api/.env

# Web用の.envファイルを生成
terraform output -raw web_env_config > ../../../web/.env

# データベースパスワードを取得して.envに設定
DB_PASSWORD=$(eval "$(terraform output -raw db_password_retrieval_command)")
sed -i "s/<DB_PASSWORD>/$DB_PASSWORD/" ../../../api/.env

# 確認
cat ../../../api/.env
cat ../../../web/.env
```

#### 生成される.envの内容

**API (.env)**
```bash
# Server
PORT=8080
NODE_ENV=production
TZ=Asia/Tokyo

# Database
DATABASE_URL=postgresql://postgres:<password>@<aurora-endpoint>:5432/todoapp

# Cognito (JWT Authentication)
COGNITO_ISSUER=https://cognito-idp.ap-northeast-1.amazonaws.com/<pool-id>
COGNITO_CLIENT_ID=<client-id>
COGNITO_JWKS_URI=https://cognito-idp.ap-northeast-1.amazonaws.com/<pool-id>/.well-known/jwks.json

# CORS
CORS_ALLOWED_ORIGINS=https://<cloudfront-domain>
```

**Web (.env)**
```bash
# API
VITE_API_URL=https://<cloudfront-domain>
VITE_TIMEZONE=Asia/Tokyo

# Cognito Authentication
VITE_COGNITO_USER_POOL_ID=<pool-id>
VITE_COGNITO_CLIENT_ID=<client-id>
VITE_COGNITO_DOMAIN=<domain>.auth.ap-northeast-1.amazoncognito.com
VITE_COGNITO_REDIRECT_URI=https://<cloudfront-domain>/auth/callback
VITE_COGNITO_LOGOUT_URI=https://<cloudfront-domain>/login
VITE_COGNITO_SCOPE=openid email profile
```

### 2. データベースマイグレーション
```bash
# Prisma migration を実行 (ローカルまたはCI/CD)
# .envファイルが設定済みの場合
cd apps/api
bun run prisma migrate deploy
```

### 3. APIコンテナビルド & プッシュ
```bash
# ECRにログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin ${ECR_URL}

# Docker イメージビルド
cd apps/api
docker build -t todo-api:latest .

# タグ付け
docker tag todo-api:latest ${ECR_URL}/todo-api:latest

# プッシュ
docker push ${ECR_URL}/todo-api:latest
```

### 4. ECS Service更新
```bash
# ECS Task Definition 更新 (新しいイメージ)
aws ecs update-service \
  --cluster todo-app-cluster \
  --service todo-api-service \
  --force-new-deployment

# デプロイ状況確認
aws ecs describe-services \
  --cluster todo-app-cluster \
  --services todo-api-service
```

### 5. フロントエンドビルド & デプロイ
```bash
# ビルド (CloudFront URLを環境変数に設定)
cd apps/web
export VITE_API_URL=https://xxxxx.cloudfront.net
bun run build

# S3にアップロード
aws s3 sync dist/ s3://todo-app-frontend-${ACCOUNT_ID}/ --delete

# CloudFront キャッシュ削除
aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*"
```

## CI/CD パイプライン (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Configure AWS credentials
      - Login to ECR
      - Build Docker image
      - Push to ECR
      - Update ECS service

  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Configure AWS credentials
      - Install dependencies
      - Build web app
      - Sync to S3
      - Invalidate CloudFront cache
```

## コスト見積もり (月額・東京リージョン)

### 前提条件
- リクエスト: 100万リクエスト/月
- データ転送: 10 GB/月
- ECS稼働時間: 24時間/日 × 30日

### 詳細

| サービス | 仕様 | 月額コスト (USD) |
|---------|------|-----------------|
| **CloudFront** | 10 GB転送, 100万リクエスト | $1.50 |
| **S3** | 1 GB保管, GET 100万回 | $0.50 |
| **ALB** | 1台, LCU 5時間相当 | $18.00 |
| **ECS Fargate** | 0.25 vCPU, 0.5GB, 2 Tasks | $15.00 |
| **Aurora Serverless v2** | 0.5-1.0 ACU, 20 GB | $40.00 |
| **Secrets Manager** | 2 secrets | $1.00 |
| **ECR** | 10 GB保管, 1 GB転送 | $1.50 |
| **CloudWatch Logs** | 5 GB, 7日保持 | $3.00 |
| **Data Transfer** | NAT Gateway, 10 GB | $5.00 |
| **その他** | KMS, VPC, etc. | $5.00 |

**合計: 約 $90.50/月 (¥13,575/月)**

### コスト削減オプション
- ECS Task数を1に削減: -$7.50/月
- Aurora Min ACUを0.5に削減 (すでに最小): $0
- Fargate Spotを使用: -30% (約 -$4.50)
- CloudFront Price Classを制限: -20% (約 -$0.30)

**削減後: 約 $78.50/月 (¥11,775/月)**

## セキュリティベストプラクティス

### 1. ネットワーク分離
- ✅ ECS TasksはPrivate Subnetに配置
- ✅ Auroraは専用DB Subnetに配置
- ✅ Security GroupでPort単位の制限
- ✅ NACLsでサブネット単位の制御

### 2. 認証・認可
- ✅ CloudFront → ALB: カスタムヘッダーで検証
- ✅ ALB → ECS: Security Groupで制限
- ✅ ECS → Aurora: Security Groupで制限
- ✅ API: Bearer Token認証

### 3. シークレット管理
- ✅ Secrets Manager でパスワード管理
- ✅ 自動ローテーション (30日)
- ✅ KMS暗号化
- ✅ IAM Role経由でアクセス

### 4. データ保護
- ✅ CloudFront: HTTPS強制
- ✅ ALB: HTTPS強制
- ✅ Aurora: 保存時暗号化 (KMS)
- ✅ Aurora: 転送時暗号化 (SSL/TLS)
- ✅ S3: バージョニング (オプション)

### 5. 監視・ログ
- ✅ CloudWatch Logs: ECSログ収集
- ✅ CloudWatch Metrics: ECS/ALB/Aurora
- ✅ CloudWatch Alarms: 異常検知
- ✅ Performance Insights: Aurora性能分析
- ✅ VPC Flow Logs: ネットワークトラフィック

### 6. バックアップ・DR
- ✅ Aurora: 自動バックアップ 7日
- ✅ Aurora: Point-in-Time Recovery
- ✅ S3: バージョニング (オプション)
- ✅ ECR: イメージ保持ポリシー

## IaCツール選択

このプロジェクトでは以下のツールを推奨します:

### オプション1: **Terraform** (推奨)
```
理由:
✅ AWS公式サポート (AWS Provider)
✅ 宣言的、状態管理が堅牢
✅ モジュール化が容易
✅ コミュニティが大きい
✅ 学習リソースが豊富

ディレクトリ構成:
iac/terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── modules/
│   ├── network/
│   ├── ecs/
│   ├── rds/
│   ├── cloudfront/
│   └── security/
└── environments/
    ├── dev.tfvars
    └── prod.tfvars
```

### オプション2: **AWS CDK** (TypeScript)
```
理由:
✅ TypeScript型安全性
✅ プログラマティックな定義
✅ AWS公式サポート
✅ 既存のTypeScriptプロジェクトと統一
✅ L2/L3 Constructsで簡潔

ディレクトリ構成:
iac/cdk/
├── bin/
│   └── app.ts
├── lib/
│   ├── network-stack.ts
│   ├── ecs-stack.ts
│   ├── rds-stack.ts
│   ├── cloudfront-stack.ts
│   └── security-stack.ts
├── cdk.json
└── package.json
```

### オプション3: **Pulumi** (TypeScript)
```
理由:
✅ TypeScript型安全性
✅ 状態管理がシンプル
✅ プログラマティックな定義
✅ マルチクラウド対応

ディレクトリ構成:
iac/pulumi/
├── index.ts
├── network.ts
├── ecs.ts
├── rds.ts
├── cloudfront.ts
├── Pulumi.yaml
└── Pulumi.dev.yaml
```

## 推奨: Terraform

プロジェクトの規模、チームの習熟度、将来的な拡張性を考慮して **Terraform** を推奨します。

## 次のステップ

1. **IaCツールの決定**
   - Terraform / AWS CDK / Pulumi

2. **インフラコード実装**
   - VPC, Subnets, Security Groups
   - ALB, ECS Cluster, ECS Service
   - Aurora Serverless v2
   - CloudFront, S3
   - ECR, Secrets Manager
   - IAM Roles & Policies

3. **デプロイスクリプト作成**
   - インフラ構築
   - データベースマイグレーション
   - コンテナビルド & プッシュ
   - フロントエンドビルド & デプロイ

4. **CI/CD パイプライン構築**
   - GitHub Actions
   - 自動テスト
   - 自動デプロイ

5. **監視・アラート設定**
   - CloudWatch Alarms
   - SNS通知
   - ログ分析

## 参考リンク

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/intro.html)
- [Aurora Serverless v2](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
- [CloudFront with ALB Origin](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistS3AndCustomOrigins.html)
