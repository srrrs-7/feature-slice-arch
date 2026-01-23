# Project Guidelines

このプロジェクトはBunモノレポで、Feature-Sliced Architectureを採用したAPI(Hono + Prisma 7)とWeb(Svelte 5 + Vite)で構成されています。

## プロジェクト構成

### モノレポ構造
```
/workspace/main/
├── apps/
│   ├── api/         # Hono + Prisma 7 REST API
│   ├── web/         # Svelte 5 + Vite SPA
│   └── iac/         # Infrastructure as Code
└── packages/        # 共有パッケージ (将来用)
```

### ワークスペース
- **API共有ライブラリ**: `@api/lib` (`apps/api/src/lib`)
- **パッケージマネージャー**: Bun 1.3.5

## 技術スタック

### API (`apps/api`)
- **フレームワーク**: Hono 4.11.4
- **データベース**: PostgreSQL (Prisma 7 + @prisma/adapter-pg)
- **バリデーション**: Zod 4.3.6
- **エラーハンドリング**: neverthrow 8.2.0
- **ロガー**: pino 10.2.1
- **時刻処理**: dayjs 1.11.19
- **テスト**: vitest 4.0.18 + @quramy/prisma-fabbrica 2.3.3

### Web (`apps/web`)
- **フレームワーク**: Svelte 5.48.0
- **ビルドツール**: Vite 7.3.1
- **スタイリング**: Tailwind CSS 4.1.18
- **API連携**: Hono RPC Client (型安全)
- **状態管理**: Svelte stores (writable, derived)

## 開発ワークフロー

### 開発サーバーの起動
```bash
# 両方同時起動
bun run dev

# 個別起動
bun run dev:api    # API: http://localhost:3000
bun run dev:web    # Web: http://localhost:5173
```

### データベース操作
```bash
bun run db:generate       # Prismaクライアント生成
bun run db:migrate:dev    # マイグレーション作成・適用
bun run db:migrate:deploy # 本番マイグレーション適用
bun run db:migrate:reset  # データベースリセット
bun run db:studio         # Prisma Studio起動
bun run db:seed           # シードデータ投入
```

### テスト実行
```bash
bun run test:run          # テスト実行
```

### コード品質チェック
```bash
bun run check             # 全チェック実行
bun run check:type        # 型チェック
bun run check:biome       # Biomeリント・フォーマット
bun run check:spell       # スペルチェック
bun run format            # フォーマット実行
```

## 環境変数

### API (`.env`)
```bash
# データベース接続 (いずれか)
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# または個別設定
DB_HOST=localhost
DB_PORT=5432
DB_DBNAME=mydb
DB_USERNAME=postgres
DB_PASSWORD=postgres

# 環境設定
NODE_ENV=development|production|test
PORT=3000
LOG_LEVEL=debug  # silent, error, warn, info, debug

# タイムゾーン (デフォルト: Asia/Tokyo)
TZ=Asia/Tokyo
```

### Web (`.env`)
```bash
VITE_API_URL=http://localhost:3000
```

## インポートエイリアス

### API
```typescript
// アプリ内
import { prisma } from "@api/lib/db";
import { logger } from "@api/lib/logger";
import { Errors } from "@api/lib/error";
```

### Web
```typescript
// アプリ内
import Component from "@/features/todo-list/Component.svelte";

// API型のインポート
import type { AppType } from "@api/index";
import type { Task } from "@api/features/tasks/domain/task";

// shadcn-svelte
import { Button } from "$lib/components/ui/button";
import { cn } from "$lib/utils";
```

## Git規約

### コミットメッセージ
```
<type>: <subject>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types:**
- `feat`: 新機能
- `fix`: バグ修正
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `docs`: ドキュメント
- `chore`: その他

### ブランチ戦略
- **メインブランチ**: `main`
- **PR作成時**: `gh pr create` を使用

## ドキュメント

- **プロジェクト概要**: `/workspace/main/CLAUDE.md`
- **API仕様**: `/workspace/main/apps/api/CLAUDE.md`
- **Web仕様**: `/workspace/main/apps/web/CLAUDE.md`
- **機能デザイン**: `apps/web/src/features/{feature}/.docs/design.md`
