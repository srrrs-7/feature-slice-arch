# GitHub PR Rules

このドキュメントではGitHub Pull Request作成のルールを定義します。

## PR作成の基本フロー

### 1. ブランチ作成

```bash
# 機能追加
git checkout -b feat/add-user-management

# バグ修正
git checkout -b fix/task-creation-error

# リファクタリング
git checkout -b refactor/service-layer

# ドキュメント
git checkout -b docs/update-readme
```

**ブランチ命名規則:**
- `feat/`: 新機能
- `fix/`: バグ修正
- `refactor/`: リファクタリング
- `test/`: テスト追加・修正
- `docs/`: ドキュメント
- `chore/`: その他

### 2. 変更の実装

```bash
# 小さくコミット
git add apps/api/src/features/users/domain/user.ts
git commit -m "feat: add User domain types"

git add apps/api/src/features/users/repository/repository.ts
git commit -m "feat: add User repository"

git add apps/api/src/features/users/service/service.ts
git commit -m "feat: add User service"

# Co-Authored-By を含める
git commit -m "feat: add User handler

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### 3. PR作成

```bash
# Pushする
git push origin feat/add-user-management

# gh CLIでPR作成
gh pr create --title "Add User Management Feature" --body "$(cat <<'EOF'
## Summary
- Add User CRUD operations
- Add authentication middleware
- Add user permission checks

## Changes
### API
- `features/users/domain/user.ts` - User domain types and errors
- `features/users/repository/repository.ts` - User data access
- `features/users/service/service.ts` - User business logic
- `features/users/handler.ts` - User HTTP handlers
- `apps/api/src/index.ts` - Mount user routes

### Database
- Add `users` table migration
- Add User factory for testing

### Tests
- Add User service unit tests (8 tests)
- Add User handler E2E tests (15 tests)

## Test Plan
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Manually tested CRUD operations
- [ ] Error handling verified

## Verification
\`\`\`bash
# Run tests
bun run test:run

# Type check
bun run check:type

# Lint
bun run check:biome

# Start API
bun run dev:api

# Test endpoints
curl http://localhost:3000/api/users
\`\`\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## PRの構造

### 1. タイトル

```
<type>: <subject>

Examples:
✅ feat: add User management feature
✅ fix: handle null description in task creation
✅ refactor: extract common error handling
✅ test: add E2E tests for task deletion
✅ docs: update API documentation

❌ Add feature
❌ Fix bug
❌ Update code
```

### 2. 本文テンプレート

```markdown
## Summary
変更内容の概要を3-5個の箇条書きで

- 追加した機能1
- 修正したバグ2
- 改善した点3

## Changes
### API
- `file/path.ts` - 変更内容の説明
- `file/path2.ts` - 変更内容の説明

### Web
- `file/path.svelte` - 変更内容の説明

### Database
- マイグレーションの説明

### Configuration
- 設定変更の説明

### Tests
- テスト追加の説明

## Test Plan
実施したテストのチェックリスト

- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed
- [ ] Error cases verified
- [ ] Performance acceptable

## Breaking Changes
破壊的変更がある場合のみ記載

### API
- `GET /api/tasks` response format changed
  - Before: `{ data: Task[] }`
  - After: `{ tasks: Task[] }`

### Migration Required
```bash
bun run db:migrate:deploy
```

## Verification
レビュアーが動作確認するための手順

\`\`\`bash
# Setup
bun install
bun run db:migrate:dev

# Run tests
bun run test:run

# Start servers
bun run dev

# Test manually
curl http://localhost:3000/api/users
# Expected: { users: [] }
\`\`\`

## Screenshots (if applicable)
UIの変更がある場合はスクリーンショット添付

## Related Issues
関連するIssueがあればリンク

Fixes #123
Closes #456
Related to #789

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## PR作成前のチェックリスト

### コード品質

```bash
# ✅ すべてパスすること
bun run check:type     # 型エラーなし
bun run check:biome    # Lintエラーなし
bun run test:run       # テストすべてパス
```

### ファイル確認

```bash
# ✅ 不要なファイルが含まれていないか確認
git status

# ❌ 以下は含めない
.env                    # 環境変数
.DS_Store              # macOS
node_modules/          # 依存関係
dist/                  # ビルド成果物
*.log                  # ログファイル
.vscode/settings.json  # エディタ設定
```

### コミットメッセージ

```bash
# ✅ 良いコミットメッセージ
feat: add user authentication
fix: handle null task description correctly
refactor: extract validation logic to separate function
test: add E2E tests for task creation

# ❌ 悪いコミットメッセージ
fix
update
wip
test commit
```

### テストカバレッジ

```markdown
# ✅ 新規コードはテストでカバー
- [ ] 新しいService関数にunit test追加
- [ ] 新しいHandlerにE2E test追加
- [ ] エッジケースのテスト追加

# ❌ テストなしでマージしない
```

---

## PR作成時の具体例

### 例1: 新機能追加

```bash
# ブランチ作成
git checkout -b feat/add-task-priority

# 実装とコミット
git add apps/api/src/lib/db/prisma/schema.prisma
git commit -m "feat: add priority field to Task model"

git add apps/api/src/features/tasks/domain/task.ts
git commit -m "feat: add TaskPriority type"

git add apps/api/src/features/tasks/repository/repository.ts
git commit -m "feat: handle priority in task repository"

git add apps/api/src/features/tasks/service/service.ts
git commit -m "feat: add priority validation"

git add apps/api/src/features/tasks/handler.ts
git commit -m "feat: add priority to API endpoints"

git add apps/api/src/features/tasks/.test/
git commit -m "test: add tests for task priority"

# PR作成
gh pr create --title "feat: add task priority field" --body "$(cat <<'EOF'
## Summary
- Add priority field to tasks (low, medium, high)
- Add sorting by priority
- Add filtering by priority

## Changes
### API
- `schema.prisma` - Add `priority` column (default: medium)
- `domain/task.ts` - Add `TaskPriority` type
- `repository/repository.ts` - Handle priority in queries
- `service/service.ts` - Add priority validation
- `handler.ts` - Add priority to request/response
- `validator.ts` - Add priority schema

### Database
- Migration: Add `priority` column with default value
- Update existing records to have medium priority

### Tests
- Add priority validation tests (3 tests)
- Add priority filtering tests (4 tests)
- Add priority sorting tests (2 tests)

## Test Plan
- [x] All unit tests pass (72 → 81 tests)
- [x] All E2E tests pass (67 → 76 tests)
- [x] Manually tested priority filtering
- [x] Verified backward compatibility

## Verification
\`\`\`bash
# Migration
bun run db:migrate:dev

# Test
bun run test:run

# Try API
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"High Priority Task","priority":"high"}'

curl "http://localhost:3000/api/tasks?priority=high"
\`\`\`

## Breaking Changes
None. Priority defaults to "medium" for existing tasks.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 例2: バグ修正

```bash
# ブランチ作成
git checkout -b fix/null-description-handling

# 実装とコミット
git add apps/api/src/features/tasks/service/service.ts
git commit -m "fix: properly handle null description in update

The updateDescriptionSchema was converting undefined to null,
causing unintended updates. Now undefined preserves existing value.

Fixes #123"

git add apps/api/src/features/tasks/service/service.test.ts
git commit -m "test: add test for undefined description handling"

# PR作成
gh pr create --title "fix: handle null description in task update" --body "$(cat <<'EOF'
## Summary
- Fix bug where updating task without description sets it to null
- Preserve existing description when undefined in update request

## Changes
### API
- `service/service.ts` - Update `updateDescriptionSchema` to not convert undefined to null
- `service/service.test.ts` - Add test for undefined handling

## Root Cause
The `updateDescriptionSchema` had:
\`\`\`typescript
.transform((val) => val ?? null)
\`\`\`

This converted `undefined` to `null`, causing the description to be cleared
even when not provided in the update request.

## Fix
Changed to:
\`\`\`typescript
.transform((val) => (val.length === 0 ? null : val))
.nullable()
.optional()
// Remove the final transform that converts undefined to null
\`\`\`

Now `undefined` stays `undefined` and won't update the field.

## Test Plan
- [x] Added unit test for undefined description
- [x] Verified PUT without description preserves existing value
- [x] Verified PUT with empty string sets to null
- [x] All existing tests still pass

## Verification
\`\`\`bash
# Create task
curl -X POST http://localhost:3000/api/tasks \
  -d '{"title":"Test","description":"Original"}'

# Update without description (should preserve "Original")
curl -X PUT http://localhost:3000/api/tasks/{id} \
  -d '{"title":"Updated Title"}'

# Check description is still "Original"
curl http://localhost:3000/api/tasks/{id}
\`\`\`

Fixes #123

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 例3: リファクタリング

```bash
# ブランチ作成
git checkout -b refactor/extract-validation-helpers

# 実装とコミット
git add apps/api/src/lib/validation/
git commit -m "refactor: extract common validation helpers"

git add apps/api/src/features/tasks/service/service.ts
git commit -m "refactor: use shared validation helpers in task service"

git add apps/api/src/features/users/service/service.ts
git commit -m "refactor: use shared validation helpers in user service"

# PR作成
gh pr create --title "refactor: extract validation helpers" --body "$(cat <<'EOF'
## Summary
- Extract common validation helpers to shared library
- Reduce code duplication across features
- Improve consistency of validation error messages

## Changes
### API
- `lib/validation/index.ts` - New shared validation helpers
  - `parseWith()` - Parse with Zod schema
  - `liftAsync()` - Lift Result to ResultAsync
  - `validateId()` - Common ID validation
- `features/tasks/service/service.ts` - Use shared helpers
- `features/users/service/service.ts` - Use shared helpers

### Benefits
- **Code reduction**: 50 lines removed (duplicated code)
- **Consistency**: All features use same validation pattern
- **Maintainability**: Change validation logic in one place

## Test Plan
- [x] All existing tests pass (no behavior changes)
- [x] Type check passes
- [x] Lint passes

## Breaking Changes
None. This is internal refactoring only.

## Verification
\`\`\`bash
# Run tests
bun run test:run

# Type check
bun run check:type

# Verify no behavior change
bun run dev:api
curl http://localhost:3000/api/tasks
curl http://localhost:3000/api/users
\`\`\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## PRレビューのポイント

### レビュアー向けチェックリスト

#### コードレビュー
- [ ] **アーキテクチャ遵守**: Feature-Sliced Architectureに従っているか
- [ ] **型安全性**: TypeScript型が適切に定義されているか
- [ ] **エラーハンドリング**: ResultAsync/try-catchが適切か
- [ ] **命名規則**: 変数・関数・型の命名が規約に従っているか
- [ ] **コメント**: 必要十分なコメントがあるか
- [ ] **重複コード**: 不要な重複がないか

#### テスト
- [ ] **カバレッジ**: 新規コードにテストがあるか
- [ ] **テストパス**: すべてのテストが通るか
- [ ] **エッジケース**: 境界値・null・エラーケースがテストされているか
- [ ] **テスト品質**: テストケース名が明確か

#### データベース
- [ ] **マイグレーション**: 安全なマイグレーション手順か
- [ ] **後方互換性**: 既存データへの影響を考慮しているか
- [ ] **インデックス**: 必要なインデックスが追加されているか
- [ ] **ロールバック**: ロールバック計画があるか

#### パフォーマンス
- [ ] **N+1問題**: クエリの最適化ができているか
- [ ] **バンドルサイズ**: 不要な依存関係がないか
- [ ] **メモリリーク**: リソースが適切に解放されるか

#### セキュリティ
- [ ] **入力検証**: すべての入力がバリデーションされているか
- [ ] **SQLインジェクション**: Prismaを正しく使用しているか
- [ ] **XSS**: ユーザー入力が適切にエスケープされるか
- [ ] **認証・認可**: 権限チェックが適切か

#### ドキュメント
- [ ] **CLAUDE.md**: 必要に応じて更新されているか
- [ ] **design.md**: 設計ドキュメントがあるか
- [ ] **コメント**: APIの使い方が明確か

---

## マージ前の最終確認

```bash
# ✅ すべてグリーン
bun run check           # すべてのチェックパス
bun run test:run        # すべてのテストパス

# ✅ コンフリクトなし
git fetch origin main
git rebase origin/main

# ✅ 動作確認
bun run dev:api         # API起動確認
bun run dev:web         # Web起動確認
# 手動でCRUD操作テスト

# ✅ PRが承認済み
gh pr status

# ✅ マージ
gh pr merge --squash  # またはGitHub UIで
```

---

## マージ後

```bash
# ローカルをクリーンアップ
git checkout main
git pull origin main
git branch -d feat/add-user-management

# 新しい作業開始
git checkout -b feat/next-feature
```

---

## PRのベストプラクティス

### 1. 小さなPRを心がける
```
❌ BAD: 50ファイル変更、2000行追加の巨大PR
✅ GOOD: 5-10ファイル変更、200-500行追加の適度なPR
```

### 2. 1PR = 1機能/1修正
```
❌ BAD: 新機能追加 + バグ修正 + リファクタリング
✅ GOOD: 新機能追加のみ（バグ修正・リファクタリングは別PR）
```

### 3. 自己レビューしてからPR作成
```
✅ GitHub上でDiffを確認
✅ デバッグコード・console.logを削除
✅ 不要なコメントを削除
✅ フォーマットを統一
```

### 4. レビュアーに優しく
```
✅ わかりやすいタイトル・説明
✅ 変更理由を明記
✅ 動作確認手順を記載
✅ スクリーンショット添付（UI変更時）
```

### 5. 迅速なフィードバック対応
```
✅ レビューコメントに24時間以内に対応
✅ 変更内容を追加コミット
✅ 対応完了したらコメント
✅ Re-review依頼
```
