# API Docker Image

AWS ECS deployment用のDockerイメージビルド設定。

## Build

```bash
# プロジェクトルートから実行
cd /workspace/main

# イメージビルド
docker build -f apps/api/.image/Dockerfile -t api:latest .

# タグ付け (ECRへpush用)
docker tag api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/api:latest
```

## Local Test

```bash
# ローカルでテスト実行
docker run -d \
  --name api-test \
  -p 8080:8080 \
  -e DATABASE_URL="postgresql://user:pass@host.docker.internal:5432/dbname" \
  -e BEARER_TOKEN="your-token" \
  api:latest

# ヘルスチェック
curl http://localhost:8080/health

# ログ確認
docker logs -f api-test

# 停止・削除
docker stop api-test && docker rm api-test
```

## Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL接続URL | - |
| `DB_HOST` | No* | DBホスト名 | - |
| `DB_PORT` | No* | DBポート | 5432 |
| `DB_DBNAME` | No* | DB名 | - |
| `DB_USERNAME` | No* | DBユーザー名 | - |
| `DB_PASSWORD` | No* | DBパスワード | - |
| `BEARER_TOKEN` | Yes | API認証トークン | - |
| `PORT` | No | 起動ポート | 8080 |
| `NODE_ENV` | No | 環境 | production |
| `LOG_LEVEL` | No | ログレベル | info |
| `TZ` | No | タイムゾーン | UTC |

*`DATABASE_URL`または個別のDB環境変数のいずれかが必要

## ECR Push

```bash
# ECRログイン
aws ecr get-login-password --region <region> | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com

# Push
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/api:latest
```

## ECS Task Definition

```json
{
  "containerDefinitions": [
    {
      "name": "api",
      "image": "<account-id>.dkr.ecr.<region>.amazonaws.com/api:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 10
      },
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "8080" }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:<region>:<account-id>:secret:api/database-url"
        },
        {
          "name": "BEARER_TOKEN",
          "valueFrom": "arn:aws:secretsmanager:<region>:<account-id>:secret:api/bearer-token"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/api",
          "awslogs-region": "<region>",
          "awslogs-stream-prefix": "api"
        }
      }
    }
  ],
  "cpu": "256",
  "memory": "512",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"]
}
```
