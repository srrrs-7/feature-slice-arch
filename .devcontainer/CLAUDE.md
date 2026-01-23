# Dev Container Configuration

このドキュメントでは、プロジェクトのDev Container設定について詳細に説明します。

## 概要

このプロジェクトは**Dev Containers**を使用して、一貫した開発環境を提供します。以下のコンポーネントで構成されています：

- **Docker Compose**: マルチコンテナ環境（PostgreSQL、開発コンテナ）
- **Dockerfile**: カスタム開発コンテナイメージ
- **VS Code統合**: devcontainer.jsonによる自動セットアップ

## ファイル構成

```
.devcontainer/
├── CLAUDE.md                    # このファイル
├── Dockerfile                   # 開発コンテナイメージ定義
├── compose.yaml                 # Docker Composeメイン設定
├── compose.override.yaml        # ローカル設定オーバーライド
├── compose.override.yaml.sample # オーバーライド設定サンプル
├── devcontainer.json            # VS Code Dev Container設定
├── setup.sh                     # 初回セットアップスクリプト
├── setup.personal.sh            # 個人用セットアップスクリプト
├── init-firewall.sh             # ファイアウォール設定（オプション）
└── whitelist_domains.conf       # ホワイトリストドメイン
```

---

## 1. Dockerfile

**ファイル:** `.devcontainer/Dockerfile`

### ベースイメージ

```dockerfile
FROM mcr.microsoft.com/devcontainers/typescript-node:1-24-bookworm
```

- **ベース**: Microsoft公式TypeScript/Node.js開発コンテナ
- **Node.js**: v24
- **OS**: Debian Bookworm

### インストール内容

#### Bunランタイム
```bash
curl -fsSL https://bun.sh/install | bash
```
- バージョン: 最新安定版
- インストール先: `/home/vscode/.bun`

#### システムパッケージ
```bash
apt-get install -y --no-install-recommends \
  postgresql-client \
  nftables \
  nano \
  less \
  vim \
  curl
```

- **postgresql-client**: DB接続用CLIツール
- **nftables**: ファイアウォール（オプション機能）
- **nano/vim**: テキストエディタ
- **curl**: HTTP通信ツール

#### Prisma CLI
```bash
bun add -g prisma@latest
```

### カスタマイズ

独自のツールを追加する場合：

```dockerfile
# Dockerfileの最後に追加
RUN bun add -g <package-name>
```

---

## 2. Docker Compose設定

### compose.yaml

**メインサービス定義**

```yaml
services:
  dev:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ../:/workspace/main:cached
      - /var/run/docker.sock:/var/run/docker.sock
    working_dir: /workspace/main
    command: sleep infinity
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:17-alpine
    restart: unless-stopped
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mydb
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

### compose.override.yaml

**ローカル環境専用設定**

このファイルは`.gitignore`に含まれており、個人用設定を保存します。

```yaml
services:
  dev:
    # ポートマッピング（ホストから接続）
    ports:
      - "3000:3000"    # API
      - "5173:5173"    # Vite dev server
      - "5555:5555"    # Prisma Studio
      - "8080:8080"    # Backend
      - "24282:24282"  # Serena

  db:
    # PostgreSQLポート公開
    ports:
      - "5432:5432"
```

**作成方法:**
```bash
cp .devcontainer/compose.override.yaml.sample .devcontainer/compose.override.yaml
# 必要に応じて編集
```

---

## 3. devcontainer.json

**VS Code Dev Container設定**

### Features

自動インストールされる開発ツール：

```json
"features": {
  "ghcr.io/devcontainers/features/git:1": {},
  "ghcr.io/devcontainers/features/github-cli:1": {},
  "ghcr.io/devcontainers/features/node:1": {
    "version": "24"
  },
  "ghcr.io/devcontainers/features/terraform:1": {
    "version": "latest"
  },
  "ghcr.io/devcontainers/features/aws-cli:1": {}
}
```

- **git**: バージョン管理
- **gh**: GitHub CLI
- **node**: Node.js 24
- **terraform**: Infrastructure as Code
- **aws-cli**: AWS管理

### VS Code拡張機能

自動インストールされる拡張：

```json
"extensions": [
  "biomejs.biome",                           // Linter/Formatter
  "Prisma.prisma",                          // Prisma ORM
  "streetsidesoftware.code-spell-checker",  // スペルチェック
  "vitest.explorer",                        // テストエクスプローラー
  "shd101wyy.markdown-preview-enhanced",    // Markdown preview
  "bierner.markdown-mermaid",               // Mermaid図
  "hashicorp.terraform"                     // Terraform
]
```

### エディタ設定

```json
"settings": {
  "eslint.enable": false,           // ESLint無効（Biome使用）
  "biome.enabled": true,            // Biome有効
  "editor.formatOnSave": true,      // 保存時フォーマット
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit",
    "quickfix.biome": "explicit"
  }
}
```

### ポートフォワーディング

```json
"forwardPorts": [
  3000,   // API
  8080,   // Backend
  5432,   // PostgreSQL
  5555,   // Prisma Studio
  24282   // Serena
]
```

### ライフサイクルコマンド

```json
"postCreateCommand": "chmod +x .devcontainer/setup.sh && .devcontainer/setup.sh"
```

コンテナ作成後に自動実行されます。

---

## 4. セットアップスクリプト

### setup.sh

**初回セットアップで実行される共通スクリプト**

```bash
#!/bin/bash
set -e

echo "🚀 Starting Dev Container setup..."

# 1. 依存関係インストール
echo "📦 Installing dependencies..."
bun ci

# 2. 個人用スクリプト初期化
if [ ! -f ".devcontainer/setup.personal.sh" ]; then
  cat << 'EOF' > .devcontainer/setup.personal.sh
#!/bin/bash
set -e

# Your personal setup steps here
EOF
  chmod +x .devcontainer/setup.personal.sh
fi

# 3. 個人用セットアップ実行
echo "🔧 Running personal setup..."
bash .devcontainer/setup.personal.sh

# 4. シェルエイリアス定義（現在のセッションのみ）
alias b='bun'
alias g='git'
# ... その他のalias

# 5. オプション: ファイアウォール設定
if [ "${ENABLE_FIREWALL:-false}" = "true" ]; then
  echo "🔥 Setting up firewall..."
  if [ -f ".devcontainer/init-firewall.sh" ]; then
    sudo bash .devcontainer/init-firewall.sh
  else
    echo "⚠️ Firewall script not found, skipping..."
  fi
fi

echo "✨ Dev Container setup completed successfully!"
```

**実行タイミング:**
- コンテナ初回作成時（`postCreateCommand`）
- 手動実行: `bash .devcontainer/setup.sh`

### setup.personal.sh

**個人用カスタマイズスクリプト**

```bash
#!/bin/bash
set -e

# Git設定
git config --global user.email "your.email@example.com"
git config --global user.name "Your Name"

# シェルエイリアスを.bashrcに追加
if ! grep -q "# Custom aliases" ~/.bashrc; then
  cat << 'EOF' >> ~/.bashrc

# Custom aliases

# Basic shortcuts
alias b='bun'
alias g='git'
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias c='clear'
alias h='history'
alias ..='cd ..'
alias ...='cd ../..'

# Bun shortcuts
alias bi='bun install'
alias bd='bun run dev'
alias bda='bun run dev:api'
alias bdw='bun run dev:web'
alias bt='bun run test:run'
alias btw='bun run test:watch'
alias bc='bun run check'
alias bf='bun run format'
alias bb='bun run build:api'

# Database shortcuts
alias dbg='bun run db:generate'
alias dbm='bun run db:migrate:dev'
alias dbd='bun run db:migrate:deploy'
alias dbs='bun run db:studio'
alias dbseed='bun run db:seed'
alias dbr='bun run db:migrate:reset'

# Git shortcuts
alias gs='git status'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline --graph --decorate'
alias gco='git checkout'
alias gcb='git checkout -b'
alias gaa='git add --all'
alias gcm='git commit -m'
alias gca='git commit --amend'
alias gst='git stash'
alias gstp='git stash pop'
alias gpl='git pull'
alias gpf='git push --force-with-lease'
alias gd='git diff'
alias gds='git diff --staged'
alias grb='git rebase'
alias grbc='git rebase --continue'
alias grba='git rebase --abort'

# Utilities
alias reload='source ~/.bashrc'
alias path='echo $PATH | tr ":" "\n"'
alias ports='lsof -i -P -n | grep LISTEN'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'
EOF
  echo "✅ Aliases added to ~/.bashrc"
else
  echo "ℹ️  Aliases already exist in ~/.bashrc"
fi
```

**カスタマイズ例:**

```bash
# dotfilesをクローン
git clone https://github.com/yourname/dotfiles.git ~/dotfiles
ln -sf ~/dotfiles/.zshrc ~/.zshrc

# 追加ツールインストール
bun add -g typescript-language-server

# 環境変数設定
echo 'export MY_VAR=value' >> ~/.bashrc
```

**注意:**
- このファイルは`.gitignore`に含まれています
- チーム共有すべき設定は`setup.sh`に記載してください

---

## 5. シェルエイリアス設定

### エイリアス一覧

`setup.personal.sh`により`.bashrc`に追加されます。

#### 基本ショートカット
```bash
b          # bun
g          # git
ll         # ls -la
la         # ls -A
l          # ls -CF
c          # clear
h          # history
..         # cd ..
...        # cd ../..
```

#### Bunショートカット
```bash
bi         # bun install
bd         # bun run dev
bda        # bun run dev:api
bdw        # bun run dev:web
bt         # bun run test:run
btc        # bun run test:coverage (カバレッジ付きテスト)
btw        # bun run test:watch
bc         # bun run check
bf         # bun run format
bb         # bun run build:api
```

#### データベースショートカット
```bash
dbg        # bun run db:generate
dbm        # bun run db:migrate:dev
dbd        # bun run db:migrate:deploy
dbs        # bun run db:studio
dbseed     # bun run db:seed
dbr        # bun run db:migrate:reset
```

#### Gitショートカット
```bash
gs         # git status
gc         # git commit
gp         # git push
gl         # git log --oneline --graph --decorate
gco        # git checkout
gcb        # git checkout -b
gaa        # git add --all
gcm        # git commit -m
gca        # git commit --amend
gst        # git stash
gstp       # git stash pop
gpl        # git pull
gpf        # git push --force-with-lease
gd         # git diff
gds        # git diff --staged
grb        # git rebase
grbc       # git rebase --continue
grba       # git rebase --abort
```

#### GitHub CLIショートカット
```bash
ghpr       # gh pr create (PR作成)
ghprl      # gh pr list (PR一覧)
ghprv      # gh pr view (PR表示)
ghprc      # gh pr checkout (PRチェックアウト)
ghprm      # gh pr merge (PRマージ)
ghprs      # gh pr status (PRステータス)
ghis       # gh issue create (Issue作成)
ghisl      # gh issue list (Issue一覧)
ghisv      # gh issue view (Issue表示)
ghrv       # gh repo view (リポジトリ表示)
ghrw       # gh repo view --web (ブラウザで開く)
ghas       # gh auth status (認証状態)
ghal       # gh auth login (認証)
```

#### AWSショートカット (apps/iacインフラ用)
```bash
# 基本
awswho     # aws sts get-caller-identity (現在のID確認)
awsprofile # export AWS_PROFILE= (プロファイル切り替え)

# ECS (APIコンテナ)
ecsls      # aws ecs list-clusters (クラスタ一覧)
ecssvc     # aws ecs list-services --cluster (サービス一覧)
ecstask    # aws ecs list-tasks --cluster (タスク一覧)
ecsdesc    # aws ecs describe-tasks --cluster (タスク詳細)
ecsrun     # aws ecs run-task --cluster (タスク実行)
ecsstop    # aws ecs stop-task --cluster (タスク停止)

# ECR (コンテナレジストリ)
ecrls      # aws ecr describe-repositories (リポジトリ一覧)
ecrimg     # aws ecr describe-images --repository-name (イメージ一覧)
ecrlogin   # aws ecr get-login-password | docker login (ECRログイン)

# RDS/Aurora (データベース)
rdsls      # aws rds describe-db-clusters (クラスタ一覧)
rdsinst    # aws rds describe-db-instances (インスタンス一覧)
rdssnap    # aws rds describe-db-cluster-snapshots (スナップショット一覧)
rdsstart   # aws rds start-db-cluster --db-cluster-identifier (起動)
rdsstop    # aws rds stop-db-cluster --db-cluster-identifier (停止)

# CloudFront (CDN)
cflist     # aws cloudfront list-distributions (ディストリビューション一覧)
cfinval    # aws cloudfront create-invalidation --distribution-id (キャッシュ削除)
cfget      # aws cloudfront get-distribution --id (ディストリビューション詳細)

# S3 (静的ホスティング)
s3ls       # aws s3 ls (バケット一覧)
s3sync     # aws s3 sync (同期)
s3cp       # aws s3 cp (コピー)
s3rm       # aws s3 rm (削除)

# CloudWatch Logs (ログ管理)
logtail    # aws logs tail --follow (ログ監視)
loggrp     # aws logs describe-log-groups (ロググループ一覧)
logstream  # aws logs describe-log-streams --log-group-name (ログストリーム一覧)

# Secrets Manager (機密情報)
secget     # aws secretsmanager get-secret-value --secret-id (シークレット取得)
secls      # aws secretsmanager list-secrets (シークレット一覧)

# ALB (Application Load Balancer)
albls      # aws elbv2 describe-load-balancers (ALB一覧)
albtg      # aws elbv2 describe-target-groups (ターゲットグループ一覧)
albhealth  # aws elbv2 describe-target-health --target-group-arn (ヘルスチェック)

# VPC (ネットワーク)
vpcls      # aws ec2 describe-vpcs (VPC一覧)
subnetls   # aws ec2 describe-subnets (サブネット一覧)
sgls       # aws ec2 describe-security-groups (セキュリティグループ一覧)
```

#### Terraformショートカット
```bash
tf         # terraform
tfi        # terraform init
tfp        # terraform plan
tfa        # terraform apply
tfd        # terraform destroy
tfv        # terraform validate
tff        # terraform fmt -recursive
tfw        # terraform workspace
tfwl       # terraform workspace list
tfws       # terraform workspace select
tfo        # terraform output
tfs        # terraform show
tfsl       # terraform state list
tfss       # terraform state show
```

#### ユーティリティ
```bash
reload     # source ~/.bashrc
path       # echo $PATH | tr ":" "\n"
ports      # lsof -i -P -n | grep LISTEN
```

### エイリアスの有効化

```bash
# 現在のシェルで有効化
source ~/.bashrc

# または
reload

# 新しいターミナルを開く（自動的に有効）
```

### エイリアスのカスタマイズ

`setup.personal.sh`を編集してエイリアスを追加/変更します：

```bash
# .devcontainer/setup.personal.sh に追加

alias mycommand='long command here'
```

その後、再実行：
```bash
# 既存のalias部分を削除
sed -i '/# Custom aliases/,/alias egrep=/d' ~/.bashrc

# 再適用
bash .devcontainer/setup.personal.sh

# 有効化
reload
```

---

## 6. ファイアウォール設定（オプション）

### 概要

`init-firewall.sh`は、nftablesを使用してネットワークアクセスを制限します。

### 有効化

```yaml
# compose.override.yaml
services:
  dev:
    environment:
      ENABLE_FIREWALL: "true"
    cap_add:
      - NET_ADMIN
```

### ホワイトリスト設定

**ファイル:** `.devcontainer/whitelist_domains.conf`

```
github.com
registry.npmjs.org
registry.yarnpkg.com
packages.cloud.google.com
```

### カスタマイズ

追加のドメインを許可：

```bash
echo "example.com" >> .devcontainer/whitelist_domains.conf
```

その後、ファイアウォールを再起動：

```bash
sudo bash .devcontainer/init-firewall.sh
```

---

## 7. トラブルシューティング

### 問題: エイリアスが有効にならない

**原因:** `.bashrc`が読み込まれていない

**解決策:**
```bash
# 手動で読み込み
source ~/.bashrc

# または新しいターミナルを開く
```

### 問題: PostgreSQLに接続できない

**確認事項:**
1. DBコンテナが起動しているか
   ```bash
   docker ps | grep postgres
   ```

2. ヘルスチェックが通っているか
   ```bash
   docker compose ps
   ```

3. DATABASE_URLが正しいか
   ```bash
   echo $DATABASE_URL
   # 期待値: postgresql://postgres:postgres@db:5432/mydb
   ```

**解決策:**
```bash
# コンテナ再起動
docker compose restart db

# 接続テスト
psql $DATABASE_URL -c "SELECT 1;"
```

### 問題: ポートが既に使用されている

**エラー:**
```
Error: bind: address already in use
```

**解決策:**
```bash
# 使用中のポートを確認
ports

# プロセスを停止
lsof -ti:3000 | xargs kill -9

# またはcompose.override.yamlでポート番号を変更
services:
  dev:
    ports:
      - "3001:3000"  # 3000 → 3001に変更
```

### 問題: Bunコマンドが見つからない

**原因:** PATHが設定されていない

**解決策:**
```bash
# PATHを確認
echo $PATH | grep bun

# なければ追加
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### 問題: Prismaクライアントが生成されない

**原因:** `@prisma/client`が見つからない

**解決策:**
```bash
# Prismaクライアント生成
bun run db:generate

# または
cd apps/api
bunx prisma generate
```

### 問題: コンテナビルドが失敗する

**エラー例:**
```
ERROR: failed to solve: process "/bin/sh -c apt-get update ..." did not complete successfully
```

**解決策:**
```bash
# キャッシュをクリア
docker compose build --no-cache

# 古いイメージを削除
docker system prune -a

# 再ビルド
docker compose up --build
```

---

## 8. 開発ワークフロー

### 初回セットアップ

1. **VS Codeでプロジェクトを開く**
   ```
   File > Open Folder > feature-slice-arch
   ```

2. **Dev Containerで再オープン**
   ```
   Command Palette (Cmd+Shift+P)
   > Dev Containers: Reopen in Container
   ```

3. **セットアップ完了を待つ**
   - Dockerイメージビルド
   - `setup.sh`実行
   - 依存関係インストール
   - 拡張機能インストール

4. **データベースマイグレーション**
   ```bash
   dbm  # または bun run db:migrate:dev
   ```

5. **開発サーバー起動**
   ```bash
   bd   # または bun run dev
   ```

### 日常的な開発

```bash
# 朝の作業開始
gpl              # 最新コードを取得
bi               # 依存関係更新（必要に応じて）
dbm              # マイグレーション適用（必要に応じて）
bd               # 開発サーバー起動

# コーディング
# ... 編集作業 ...

# テスト実行
bt               # テスト実行

# コード品質チェック
bc               # 型チェック + Lint

# コミット
gs               # 変更確認
gaa              # すべてステージング
gcm "feat: add feature"  # コミット
gp               # プッシュ

# データベース操作
dbs              # Prisma Studioで確認
dbg              # Prismaクライアント再生成（スキーマ変更時）
```

### 新機能開発

```bash
# ブランチ作成
gcb feat/new-feature

# データベーススキーマ変更
# apps/api/src/lib/db/prisma/schema.prisma を編集
dbm              # マイグレーション作成・適用
dbg              # クライアント再生成

# コード実装
# ... 実装 ...

# テスト
bt               # テスト実行
bc               # 型チェック + Lint

# コミット
gaa
gcm "feat: implement new feature"
gp

# PR作成
gh pr create --title "feat: new feature" --body "..."
```

---

## 9. 高度な設定

### カスタムDockerイメージ

追加パッケージをインストール：

```dockerfile
# .devcontainer/Dockerfile

# 既存の内容の後に追加
RUN apt-get update && apt-get install -y \
    imagemagick \
    ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
```

再ビルド：
```bash
# Dev Containerを閉じる
# Command Palette > Dev Containers: Rebuild Container
```

### 環境変数設定

**方法1: compose.override.yaml**

```yaml
services:
  dev:
    environment:
      MY_SECRET: "secret_value"
      API_KEY: "${API_KEY}"  # ホストの環境変数から
```

**方法2: .envファイル**

```bash
# プロジェクトルートに.envファイル作成
echo "MY_SECRET=secret_value" >> .env
```

Bunが自動的に読み込みます。

### VS Code設定のカスタマイズ

**ユーザー設定を追加:**

```json
// devcontainer.json
"customizations": {
  "vscode": {
    "settings": {
      "terminal.integrated.defaultProfile.linux": "zsh",
      "workbench.colorTheme": "GitHub Dark",
      "editor.fontSize": 14
    }
  }
}
```

### Docker Composeプロファイル

特定の環境のみで有効化するサービス：

```yaml
# compose.yaml
services:
  redis:
    image: redis:alpine
    profiles: ["full"]
```

起動：
```bash
docker compose --profile full up
```

---

## 10. ベストプラクティス

### DO ✅

- **個人設定は`setup.personal.sh`に記載**
  - Git設定、エイリアス、dotfiles

- **共有設定は`setup.sh`に記載**
  - チーム全体で必要なツール

- **compose.override.yamlを使用**
  - ローカル専用設定（ポートマッピングなど）

- **定期的にコンテナを再ビルド**
  - 依存関係の更新を反映

- **エイリアスを活用**
  - 開発効率アップ

### DON'T ❌

- **setup.personal.shをコミットしない**
  - 個人情報が含まれる

- **compose.override.yamlをコミットしない**
  - ローカル環境依存

- **Dockerfileに機密情報を含めない**
  - ビルドログに残る

- **大量のデータをボリュームマウントしない**
  - パフォーマンス低下

- **コンテナ内で直接ファイルを編集しない**
  - ホスト側で編集すること

---

## 11. 参考リンク

- [Dev Containers公式ドキュメント](https://containers.dev/)
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Compose](https://docs.docker.com/compose/)
- [Bun Documentation](https://bun.sh/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## 12. サポート

問題が発生した場合：

1. このドキュメントのトラブルシューティングを確認
2. プロジェクトルートの`CLAUDE.md`を確認
3. GitHubでIssueを作成
4. チームに相談

---

**最終更新:** 2026-01-23
**メンテナー:** Development Team
