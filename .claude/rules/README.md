# Rules クイックリファレンス

`.claude/rules/` 配下のルールファイルの要点まとめ。

---

## ファイル一覧

| ファイル | 内容 |
|---------|------|
| `coding-rules.md` | TypeScript/API/Web コーディング規約 |
| `testing.md` | テスト戦略・TDD・パターン |
| `planning.md` | 新機能開発・リファクタリング計画 |
| `github-pr.md` | PR作成・レビュールール |
| `design-guide.md` | UI/UXデザインガイド |
| `security.md` | セキュリティルール |

---

## 重要な原則

### アーキテクチャ

```
Feature-Sliced Architecture

API層: domain → service → repository → handler
Web層: pages → components → api → stores
```

### エラーハンドリング

```typescript
// API: neverthrow (ResultAsync)
taskService.getById(id).match(
  (task) => responseOk(c, { task }),
  (error) => handleError(error)
);

// Web: try-catch
try {
  await tasksStore.create(input);
} catch (err) {
  error.set(err.message);
}
```

### TDD サイクル

```
🔴 Red    → テストを書いて失敗
🟢 Green  → 最小限の実装
🔵 Refactor → コード整理
```

---

## コマンド

```bash
# 開発
bun run dev              # API + Web同時起動

# テスト
bun run test:run         # テスト実行
bun run test:coverage    # カバレッジ付き

# チェック
bun run check            # 全チェック
bun run check:type       # 型チェック
bun run format           # フォーマット

# DB
bun run db:migrate:dev   # マイグレーション
bun run db:seed          # シード
```

---

## API 層の要点

### Domain層

```typescript
// Branded Type
export type TaskId = string & { readonly _brand: unique symbol };

// イミュータブル型
export interface Task {
  readonly id: TaskId;
  readonly title: string;
}

// エラー型（判別可能なユニオン）
export type TaskError =
  | { type: "NOT_FOUND"; taskId: TaskId }
  | { type: "VALIDATION_ERROR"; message: string };
```

### Service層

```typescript
// ResultAsyncを返す
export const getById = (id: string): ResultAsync<Task, TaskError> =>
  liftAsync(parseWith(idSchema, id))
    .andThen(taskRepository.findById);
```

### Handler層

```typescript
// Honoルート + zValidator
export default new Hono()
  .get("/:id", zValidator("param", idSchema), async (c) => {
    return taskService.getById(id).match(
      (task) => responseOk(c, { task }),
      (error) => handleError(error)
    );
  });
```

---

## Web 層の要点

### Svelte 5 Runes

```svelte
<script lang="ts">
  let { task, onEdit } = $props();
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

### Store

```typescript
export const tasks = writable<Task[]>([]);
export const tasksStore = {
  async fetchAll() {
    const data = await api.getTasks();
    tasks.set(data.tasks);
  },
};
```

### API Client (Hono RPC)

```typescript
import { hc } from "hono/client";
import type { AppType } from "@api/index";

const client = hc<AppType>(apiUrl);
const res = await client.api.tasks.$get();
```

---

## テストの要点

### テーブル駆動テスト

```typescript
const testCases = [
  { name: "valid input", input: {...}, expected: 200 },
  { name: "invalid input", input: {...}, expected: 400 },
];

for (const tc of testCases) {
  it(tc.name, async () => { ... });
}
```

### ファクトリー

```typescript
const task = await TaskFactory.create();
const completed = await TaskFactory.use("completed").create();
```

---

## セキュリティの要点

- ✅ 入力値は必ずZodでバリデーション
- ✅ PrismaのパラメータクエリでSQLインジェクション防止
- ✅ 機密情報は環境変数に（ハードコード禁止）
- ✅ エラーメッセージで内部情報を漏洩しない
- ✅ XSS防止: `@html`は信頼できるデータのみ

---

## PR作成の要点

```bash
# ブランチ命名
feat/add-user-management
fix/task-creation-error

# コミットメッセージ
feat: add user management feature

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>

# PR作成
gh pr create --title "feat: ..." --body "..."
```

---

## 詳細

各ファイルに詳細な規約とコード例があります。
