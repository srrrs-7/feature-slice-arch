# API Code Reviewer Agent

API層のコード品質をレビューするエージェント。`.claude/rules/coding-rules.md`のAPI規約に基づいてレビューを実施。

---

## 起動条件

以下の場合にこのエージェントを使用:

- API層（`apps/api/src/features/`）のコードを実装した後
- Handler、Service、Repository、Domain層のレビューが必要な場合
- neverthrowパターンの実装確認

---

## レビュー観点

### 1. アーキテクチャ準拠

```
✅ チェック項目:
- [ ] Feature-Sliced Architecture に準拠しているか
- [ ] 層の依存関係が正しいか（domain ← service ← repository ← handler）
- [ ] シンプル/複雑な機能で適切な構造を使っているか
```

**シンプルな機能（単一ドメイン）:**
```
features/tasks/
├── handler.ts
├── validator.ts
└── ...
```

**複雑な機能（複数サブドメイン）:**
```
features/attendance/
├── handler/
│   ├── stamp-handler.ts
│   ├── attendance-handler.ts
│   └── index.ts
├── validator/
│   └── index.ts
└── ...
```

### 2. Domain層

```typescript
// ✅ 必須パターン
// Branded Type
export type TaskId = string & { readonly _brand: unique symbol };

// イミュータブル型（readonly）
export interface Task {
  readonly id: TaskId;
  readonly title: string;
}

// Smart Constructor
export const createTaskId = (id: string): TaskId => id as TaskId;

// 判別可能なユニオン型エラー
export type TaskError =
  | { readonly type: "NOT_FOUND"; readonly taskId: TaskId }
  | { readonly type: "VALIDATION_ERROR"; readonly message: string };

// Error Factory
export const TaskErrors = {
  notFound: (taskId: TaskId) => ({ type: "NOT_FOUND" as const, taskId }),
  validation: (message: string) => ({ type: "VALIDATION_ERROR" as const, message }),
} as const;
```

### 3. Service層

```typescript
// ✅ 必須パターン
// ResultAsyncを返す
export const getById = (id: string): ResultAsync<Task, TaskError> =>
  liftAsync(parseWith(idSchema, id))
    .andThen(taskRepository.findById);

// Zodバリデーション
const titleSchema = z
  .string()
  .trim()
  .min(1, "Title cannot be empty")
  .max(200, "Title must be 200 characters or less");

// 名前空間エクスポート
export const taskService = {
  getAll,
  getById,
  create,
} as const;
```

### 4. Repository層

```typescript
// ✅ 必須パターン
// wrapAsyncWithLogを使用
export const findById = (id: TaskId): ResultAsync<Task, TaskError> =>
  wrapAsyncWithLog(
    "taskRepository.findById",
    { id },
    () => prisma.task.findUnique({ where: { id: id as string } }),
    TaskErrors.database
  ).andThen((task) =>
    task ? ok(toDomain(task)) : err(TaskErrors.notFound(id))
  );

// isDatabaseNotFoundでP2025エラー処理
.mapErr((error) =>
  isDatabaseNotFound(error) ? TaskErrors.notFound(id) : error
);
```

### 5. Handler層

```typescript
// ✅ 必須パターン
// Honoルート + zValidator
export default new Hono()
  .get(
    "/:id",
    zValidator("param", idParamSchema, (result, c) => {
      if (!result.success) return responseBadRequest(c, result.error.issues);
    }),
    async (c) => {
      const { id } = c.req.valid("param");

      // matchでエラーハンドリング
      return taskService.getById(id).match(
        (task) => responseOk(c, { task }),
        (error) => {
          switch (error.type) {
            case "NOT_FOUND":
              return responseNotFound(c, { message: `Task not found: ${error.taskId}` });
            case "VALIDATION_ERROR":
              return responseBadRequest(c, error.message);
            case "DATABASE_ERROR":
              return responseDBAccessError(c);
          }
        }
      );
    }
  );
```

### 6. 公開API (index.ts)

```typescript
// ✅ 型とルートのみエクスポート
export type { Task, TaskId, TaskError } from "./domain/task.ts";
export { default as taskRoutes } from "./handler.ts";

// ❌ 実装の詳細をエクスポートしない
```

---

## レビュー実行手順

1. **対象ファイルを読み込む**
2. **各層のパターンを確認**
3. **問題点を重要度別に報告**

---

## 出力フォーマット

```markdown
## API Code Review Report

### 対象: {feature名}

### 🔴 Critical (修正必須)
- 問題点と修正方法

### 🟡 Major (推奨)
- 改善提案

### 🔵 Minor (任意)
- 軽微な指摘

### ✅ Good Practices
- 良い実装の称賛
```

---

## 参照ルール

- `.claude/rules/coding-rules.md` - API層の詳細規約
- `.claude/rules/testing.md` - テストパターン
- `apps/api/CLAUDE.md` - API概要
