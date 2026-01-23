# Development Environment Setup

このドキュメントでは開発環境の構築手順と前提条件を説明します。

## 前提条件

### 必須ソフトウェア

| ソフトウェア | バージョン | 用途 |
|-------------|-----------|------|
| Bun | 1.3.5+ | パッケージマネージャー、ランタイム |
| Docker | 24.0+ | PostgreSQL、開発環境 |
| Docker Compose | v2.20+ | コンテナオーケストレーション |
| Git | 2.40+ | バージョン管理 |

### 推奨エディタ

- **VS Code** with extensions:
  - Svelte for VS Code
  - Prisma
  - Biome
  - Tailwind CSS IntelliSense

## 初期セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd main
```

### 2. 依存関係のインストール

```bash
bun install
```

### 3. 環境変数の設定

```bash
# APIの環境変数
cp apps/api/.env.example apps/api/.env

# Webの環境変数（必要に応じて）
cp apps/web/.env.example apps/web/.env
```

**API環境変数 (`apps/api/.env`):**

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb
# または個別設定
DB_HOST=localhost
DB_PORT=5432
DB_DBNAME=mydb
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# CORS (本番環境用、開発時はデフォルト)
# CORS_ALLOWED_ORIGINS=https://example.com,https://app.example.com

# Timezone
TZ=Asia/Tokyo
```

**Web環境変数 (`apps/web/.env`):**

```bash
VITE_API_URL=http://localhost:3000

# 開発用トークン（本番では使用しない）
VITE_AUTH_TOKEN=dummy-bearer-token-12345
```

### 4. Dockerコンテナの起動

```bash
# PostgreSQLを起動
docker compose up -d db

# または全サービスを起動
docker compose up -d
```

### 5. データベースのセットアップ

```bash
# Prismaクライアント生成
bun run db:generate

# マイグレーション実行
bun run db:migrate:dev

# シードデータ投入（オプション）
bun run db:seed
```

### 6. 開発サーバーの起動

```bash
# API + Web 同時起動
bun run dev

# または個別起動
bun run dev:api    # http://localhost:3000
bun run dev:web    # http://localhost:5173
```

## DevContainer (VS Code)

VS Code DevContainerを使用する場合:

1. VS CodeでRemote - Containers拡張機能をインストール
2. コマンドパレットで "Dev Containers: Reopen in Container" を選択
3. コンテナが起動したら `bun install` を実行

### compose.override.yaml

ローカル環境固有の設定が必要な場合:

```bash
cp .devcontainer/compose.override.yaml.sample .devcontainer/compose.override.yaml
```

## よく使うコマンド

### 開発

```bash
bun run dev          # API + Web 同時起動
bun run dev:api      # API のみ (HMR有効)
bun run dev:web      # Web のみ (HMR有効)
```

### テスト

```bash
bun run test:run     # テスト実行
bun run test:watch   # ウォッチモード
```

### コード品質

```bash
bun run check        # 全チェック（spell, type, biome）
bun run check:type   # 型チェック
bun run check:biome  # Lint + Format
bun run format       # フォーマット
```

### データベース

```bash
bun run db:generate       # Prismaクライアント生成
bun run db:migrate:dev    # マイグレーション作成・適用
bun run db:migrate:deploy # 本番マイグレーション
bun run db:migrate:reset  # データベースリセット
bun run db:studio         # Prisma Studio (GUI)
bun run db:seed           # シードデータ投入
```

### ビルド

```bash
bun run build:api    # API ビルド
bun run build:web    # Web ビルド
```

## ポート設定

| サービス | ポート | 説明 |
|---------|--------|------|
| API | 3000 | Hono REST API |
| Web | 5173 | Vite 開発サーバー |
| PostgreSQL | 5432 | データベース |
| Prisma Studio | 5555 | DB GUI (db:studio実行時) |

## トラブルシューティング

### データベース接続エラー

```bash
# PostgreSQLコンテナの状態確認
docker compose ps

# ログ確認
docker compose logs db

# 再起動
docker compose restart db
```

### Prisma エラー

```bash
# クライアント再生成
bun run db:generate

# マイグレーションリセット（開発時のみ）
bun run db:migrate:reset
```

### 型エラー

```bash
# Prisma型を再生成
bun run db:generate

# 型チェック
bun run check:type
```

### 依存関係エラー

```bash
# node_modules削除して再インストール
rm -rf node_modules apps/*/node_modules
bun install
```

## 開発フロー

### 新機能開発

1. ブランチ作成: `git checkout -b feat/feature-name`
2. 実装（TDDを推奨）
3. テスト: `bun run test:run`
4. チェック: `bun run check`
5. コミット
6. PR作成: `gh pr create`

### データベース変更

1. `schema.prisma` を編集
2. `bun run db:migrate:dev --name migration_name`
3. `bun run db:generate`
4. 必要に応じてファクトリー更新

### コンポーネント追加 (shadcn-svelte)

```bash
cd apps/web
bunx shadcn-svelte@latest add button
```

## セキュリティ注意事項

### 開発環境のみの設定

以下は開発環境専用です。本番では適切な実装が必要:

- **Bearer認証**: `apps/api/src/middleware/bearer.ts` はダミー実装
- **ダミートークン**: `apps/web/src/features/todo-list/api/client.ts` のハードコードトークン
- **CORS**: デフォルトはlocalhost のみ許可

### 本番デプロイ前に必要な対応

1. JWT検証の実装
2. 適切なトークン管理フロー
3. Rate limiting の追加
4. CSRF 保護
5. 環境変数による CORS 設定

詳細は `apps/api/src/middleware/bearer.ts` と `apps/web/src/features/todo-list/api/client.ts` の TODO コメントを参照。
