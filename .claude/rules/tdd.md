# TDD (Test-Driven Development) Rules

このドキュメントではt_wada (和田卓人)さんのTDD実践方針に基づいた開発規約を定義します。

## TDDの基本サイクル

### Red-Green-Refactor

```
🔴 Red    → テストを書いて失敗させる
🟢 Green  → テストが通る最小限のコードを書く
🔵 Refactor → 重複を排除し、コードを整理する
```

**重要な原則:**
- **テストファーストで書く**: コードより先にテストを書く
- **小さなステップで進む**: 一度に1つのことだけ
- **リファクタリングは必ずグリーン状態で**: テストが通ってから

---

## TDD実践の具体的手順

### Step 1: TODOリスト作成

実装を始める前に、実装すべき機能をTODOリストとして書き出す。

```markdown
## TODO List

### タスク作成機能
- [ ] タイトルを指定してタスクを作成できる
- [ ] 説明を指定してタスクを作成できる
- [ ] 説明なしでタスクを作成できる
- [ ] 空のタイトルでタスク作成はエラー
- [ ] 201文字のタイトルでタスク作成はエラー
- [ ] タイトルの前後の空白は削除される
- [ ] 空の説明はnullに変換される
- [ ] 作成時のステータスはpending
- [ ] createdAtとupdatedAtが自動設定される
- [ ] データベースに保存される

### タスク取得機能
- [ ] IDを指定してタスクを取得できる
- [ ] 存在しないIDでタスク取得は404エラー
- [ ] 空のIDでタスク取得はバリデーションエラー

### ...
```

### Step 2: 最初のテストを書く (Red)

**TODOリストの一番簡単なものから始める。**

```typescript
// features/tasks/service/service.test.ts

import { describe, test, expect, vi } from "vitest";
import { okAsync } from "neverthrow";
import { createMockTask, createTaskId } from "./test-helpers.ts";

// ❌ まだserviceは存在しない
const { taskService } = await import("./service.ts");

describe("taskService.create", () => {
  test("タイトルを指定してタスクを作成できる", async () => {
    // Arrange
    const input = {
      title: "Test Task",
      description: null,
    };

    // Act
    const result = await taskService.create(input);

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.title).toBe("Test Task");
      expect(result.value.status).toBe("pending");
    }
  });
});
```

**この時点でテストは失敗する (🔴 Red):**
```bash
$ bun test
✗ taskService.create > タイトルを指定してタスクを作成できる
  TypeError: taskService is undefined
```

### Step 3: テストを通す最小限のコード (Green)

**テストを通すための最小限の実装を書く。**

```typescript
// features/tasks/service/service.ts

import { ResultAsync, okAsync } from "neverthrow";
import { createTask, createTaskId, type Task, type TaskError } from "../domain/task.ts";

export const create = (input: { title: string; description: string | null }): ResultAsync<Task, TaskError> => {
  // 🟢 テストを通すための最小実装
  const task = createTask({
    id: createTaskId("dummy-id"),
    title: input.title,
    description: input.description,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return okAsync(task);
};

export const taskService = {
  create,
} as const;
```

**テストが通る (🟢 Green):**
```bash
$ bun test
✓ taskService.create > タイトルを指定してタスクを作成できる
```

### Step 4: TODOリストを更新

```markdown
## TODO List

### タスク作成機能
- [x] タイトルを指定してタスクを作成できる  ← 完了!
- [ ] 説明を指定してタスクを作成できる
- [ ] 説明なしでタスクを作成できる
- ...
```

### Step 5: 次のテストを追加 (Red)

```typescript
describe("taskService.create", () => {
  test("タイトルを指定してタスクを作成できる", async () => {
    // ... 既存のテスト
  });

  test("説明を指定してタスクを作成できる", async () => {
    const input = {
      title: "Test Task",
      description: "Test Description",
    };

    const result = await taskService.create(input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.description).toBe("Test Description");
    }
  });
});
```

**既にコードがあるのでテストは通る (🟢 Green)。**

### Step 6: バリデーションのテストを追加 (Red)

```typescript
test("空のタイトルでタスク作成はエラー", async () => {
  const input = {
    title: "",
    description: null,
  };

  const result = await taskService.create(input);

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error.type).toBe("VALIDATION_ERROR");
    expect(result.error.message).toContain("Title");
  }
});
```

**テストは失敗する (🔴 Red):**
```bash
✗ taskService.create > 空のタイトルでタスク作成はエラー
  Expected: result.isErr() === true
  Received: false
```

### Step 7: バリデーションを実装 (Green)

```typescript
import { z } from "zod";
import { Result, ok, err } from "neverthrow";

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title cannot be empty")
  .max(200, "Title must be 200 characters or less");

const parseWith = <T>(schema: z.ZodType<T>, data: unknown): Result<T, TaskError> => {
  const result = schema.safeParse(data);
  if (result.success) return ok(result.data);
  return err(TaskErrors.validation(result.error.issues[0]?.message ?? "Validation failed"));
};

export const create = (input: { title: string; description: string | null }): ResultAsync<Task, TaskError> => {
  // バリデーション追加
  const titleResult = parseWith(titleSchema, input.title);
  if (titleResult.isErr()) {
    return errAsync(titleResult.error);
  }

  const task = createTask({
    id: createTaskId("dummy-id"),
    title: titleResult.value,
    description: input.description,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return okAsync(task);
};
```

**テストが通る (🟢 Green):**
```bash
✓ taskService.create > 空のタイトルでタスク作成はエラー
```

### Step 8: リファクタリング (Refactor)

**テストが通っている状態で、コードを整理する。**

```typescript
// 🔵 Refactor: parseWithをliftAsyncと組み合わせて簡潔に
const liftAsync = <T, E>(result: Result<T, E>): ResultAsync<T, E> =>
  result.match(okAsync, errAsync);

export const create = (input: { title: string; description: string | null }): ResultAsync<Task, TaskError> => {
  return liftAsync(parseWith(titleSchema, input.title))
    .map((title) =>
      createTask({
        id: createTaskId("dummy-id"),
        title,
        description: input.description,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
};
```

**リファクタリング後もテストが通ることを確認 (🟢 Green):**
```bash
$ bun test
✓ taskService.create > タイトルを指定してタスクを作成できる
✓ taskService.create > 説明を指定してタスクを作成できる
✓ taskService.create > 空のタイトルでタスク作成はエラー
```

### Step 9: TODOリストを更新して繰り返す

```markdown
## TODO List

### タスク作成機能
- [x] タイトルを指定してタスクを作成できる
- [x] 説明を指定してタスクを作成できる
- [ ] 説明なしでタスクを作成できる
- [x] 空のタイトルでタスク作成はエラー
- [ ] 201文字のタイトルでタスク作成はエラー  ← 次のテスト
- ...
```

**この🔴→🟢→🔵サイクルを繰り返す。**

---

## TDDの実践原則 (t_wada流)

### 1. テストファースト

```typescript
// ❌ BAD: 実装を先に書く
export const createTask = (input: CreateTaskInput) => {
  // 実装
};

// テストを後から書く
test("creates task", () => {
  // テスト
});
```

```typescript
// ✅ GOOD: テストを先に書く
test("creates task", () => {
  // テストを先に書く
  const result = await taskService.create({ title: "Test" });
  expect(result.isOk()).toBe(true);
});

// その後で実装
export const create = (input: CreateTaskInput) => {
  // 実装
};
```

### 2. 明白な実装 vs 仮実装

#### 明白な実装 (Obvious Implementation)

**簡単な実装はすぐに書く。**

```typescript
// ✅ 明白な実装: getter系は仮実装不要
test("returns task title", () => {
  const task = createTask({ title: "Test Task", ... });
  expect(task.title).toBe("Test Task");
});

// すぐに実装
export const createTask = (params: TaskParams): Task => {
  return Object.freeze({
    ...params,
  });
};
```

#### 仮実装 (Fake It)

**複雑な実装は仮の値で通してから正しい実装に置き換える。**

```typescript
// 🔴 Red: テストを書く
test("calculates task completion rate", () => {
  const tasks = [
    createTask({ status: "completed" }),
    createTask({ status: "pending" }),
    createTask({ status: "completed" }),
  ];

  expect(calculateCompletionRate(tasks)).toBe(66.67);
});

// 🟢 Green: まず仮実装でテストを通す
export const calculateCompletionRate = (tasks: Task[]): number => {
  return 66.67;  // 仮実装: ハードコードされた値
};

// 🔵 Refactor: 正しい実装に置き換える
export const calculateCompletionRate = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === "completed").length;
  return Math.round((completed / tasks.length) * 10000) / 100;
};
```

### 3. 三角測量 (Triangulation)

**複数のテストケースから一般化した実装を導く。**

```typescript
// 🔴 Red: 最初のテスト
test("returns 100% when all tasks completed", () => {
  const tasks = [
    createTask({ status: "completed" }),
    createTask({ status: "completed" }),
  ];
  expect(calculateCompletionRate(tasks)).toBe(100);
});

// 🟢 Green: 仮実装
export const calculateCompletionRate = (tasks: Task[]): number => {
  return 100;
};

// 🔴 Red: 2つ目のテスト
test("returns 50% when half completed", () => {
  const tasks = [
    createTask({ status: "completed" }),
    createTask({ status: "pending" }),
  ];
  expect(calculateCompletionRate(tasks)).toBe(50);
});

// 🟢 Green: 2つのテストから一般化
export const calculateCompletionRate = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter(t => t.status === "completed").length;
  return (completed / tasks.length) * 100;
};

// 🔴 Red: 3つ目のテスト（エッジケース）
test("returns 0 when no tasks", () => {
  expect(calculateCompletionRate([])).toBe(0);
});

// 既に実装されているのでテストは通る (🟢 Green)
```

### 4. 小さなステップで進む

```typescript
// ❌ BAD: 一気に複数の機能を実装
test("creates task with validation and persistence", () => {
  // 複数のことを一度にテスト
});

// ✅ GOOD: 1つずつテスト
test("creates task with title", () => { ... });
test("validates empty title", () => { ... });
test("persists task to database", () => { ... });
```

### 5. テストが失敗する理由は1つだけ

```typescript
// ❌ BAD: 複数の理由で失敗する可能性
test("creates and saves task", () => {
  const result = await taskService.create({ title: "Test" });
  expect(result.isOk()).toBe(true);  // 作成が失敗?

  const saved = await taskRepository.findById(result.value.id);
  expect(saved).toBeDefined();  // 保存が失敗?
});

// ✅ GOOD: 1つのことだけテスト
test("creates task with valid input", () => {
  const result = await taskService.create({ title: "Test" });
  expect(result.isOk()).toBe(true);
  expect(result.value.title).toBe("Test");
});

test("persists task to database", () => {
  const task = await taskRepository.create({ title: "Test" });
  const saved = await taskRepository.findById(task.id);
  expect(saved.id).toBe(task.id);
});
```

### 6. テストは独立している

```typescript
// ❌ BAD: テスト間で状態を共有
let sharedTask: Task;

test("creates task", () => {
  sharedTask = await taskService.create({ title: "Test" });
  expect(sharedTask.id).toBeDefined();
});

test("updates task", () => {
  // 前のテストに依存
  await taskService.update(sharedTask.id, { title: "Updated" });
});

// ✅ GOOD: 各テストが独立
test("creates task", () => {
  const task = await taskService.create({ title: "Test" });
  expect(task.id).toBeDefined();
});

test("updates task", () => {
  // 自分でデータを準備
  const task = await TaskFactory.create();
  await taskService.update(task.id, { title: "Updated" });

  const updated = await taskRepository.findById(task.id);
  expect(updated.title).toBe("Updated");
});
```

### 7. テストの可読性 > DRY

```typescript
// ❌ BAD: 過度に抽象化
const testCases = [
  { input: { title: "" }, expectedError: "VALIDATION_ERROR" },
  { input: { title: "a".repeat(201) }, expectedError: "VALIDATION_ERROR" },
];

for (const tc of testCases) {
  test(`validates ${tc.input.title.length} char title`, () => {
    // 何をテストしているか分かりにくい
  });
}

// ✅ GOOD: 明示的
test("returns validation error for empty title", () => {
  const result = await taskService.create({ title: "" });
  expect(result.isErr()).toBe(true);
  expect(result.error.type).toBe("VALIDATION_ERROR");
});

test("returns validation error for title exceeding 200 characters", () => {
  const result = await taskService.create({ title: "a".repeat(201) });
  expect(result.isErr()).toBe(true);
  expect(result.error.type).toBe("VALIDATION_ERROR");
});
```

**ただし、Golang-styleテーブル駆動テストは例外的にOK:**
```typescript
// ✅ GOOD: テーブル駆動テストは可読性を保ちながらDRY
const testCases = [
  {
    name: "returns validation error for empty title",
    input: { title: "" },
    expectedError: "VALIDATION_ERROR",
  },
  {
    name: "returns validation error for title exceeding 200 characters",
    input: { title: "a".repeat(201) },
    expectedError: "VALIDATION_ERROR",
  },
];

for (const tc of testCases) {
  test(tc.name, () => {
    // 明示的なテスト名
  });
}
```

---

## TDDのリズム

### 作業のタイムボックス

```
5-10分: テスト書く (🔴 Red)
2-5分:  実装書く (🟢 Green)
2-5分:  リファクタリング (🔵 Refactor)
─────────────────────────────
10-20分で1サイクル
```

**長くかかりすぎる場合:**
- ステップが大きすぎる → もっと小さく分割
- 設計が複雑すぎる → シンプルな設計を考え直す

### コミットのタイミング

```bash
# ✅ GOOD: 各サイクルでコミット
git add .
git commit -m "feat: add task creation validation

🔴 Add test for empty title validation
🟢 Implement title validation with Zod
🔵 Extract validation helper function

Tests: 3 passing"

# ❌ BAD: まとめてコミット
git commit -m "add task feature"  # 何をしたか不明
```

---

## TDDのメリット

### 1. 設計改善

テストしやすいコード = 良い設計

```typescript
// ❌ BAD: テストしにくい
class TaskService {
  constructor() {
    this.repository = new TaskRepository();  // 依存が固定
    this.logger = new Logger();
  }

  async create(input) {
    this.logger.info("Creating task");  // 副作用
    const task = await this.repository.create(input);
    return task;
  }
}

// ✅ GOOD: テストしやすい（依存注入、純粋関数）
export const create = (input: CreateTaskInput): ResultAsync<Task, TaskError> =>
  liftAsync(parseWith(createTaskSchema, input))
    .andThen(taskRepository.create);

// テストでrepositoryをモック可能
vi.mock("../repository/repository.ts");
```

### 2. リグレッション防止

```typescript
// バグ修正のワークフロー:
// 1. バグを再現するテストを書く (🔴 Red)
test("handles null description correctly", () => {
  const result = await taskService.update("id", { title: "Updated" });
  // descriptionがnullにならないことを確認
  expect(result.value.description).toBe("Original");  // FAIL
});

// 2. バグを修正 (🟢 Green)
// 3. テストがパス
// 4. 今後同じバグは起きない
```

### 3. ドキュメント代わり

```typescript
// テスト = 仕様書
describe("taskService.create", () => {
  test("creates task with title and description", () => { ... });
  test("creates task without description", () => { ... });
  test("returns validation error for empty title", () => { ... });
  test("returns validation error for title exceeding 200 chars", () => { ... });
  test("trims whitespace from title", () => { ... });
  test("converts empty description to null", () => { ... });
});

// これを読めば仕様が分かる
```

### 4. リファクタリングの安全性

```typescript
// 🔵 Refactor: 安心してリファクタリング可能
// Before
export const create = (input) => {
  const titleResult = parseWith(titleSchema, input.title);
  if (titleResult.isErr()) return errAsync(titleResult.error);
  const descResult = parseWith(descSchema, input.description);
  if (descResult.isErr()) return errAsync(descResult.error);
  // ...
};

// After
export const create = (input) =>
  liftAsync(parseWith(createTaskSchema, input))
    .andThen(taskRepository.create);

// テストがすべて通るので動作は保証されている
```

---

## TDDを適用すべき場面

### 適用すべき

✅ **ビジネスロジック (Service層)**
- バリデーション
- 計算ロジック
- 状態遷移

✅ **ドメインロジック (Domain層)**
- Smart Constructors
- ドメインルール
- エラー処理

✅ **データアクセス (Repository層)**
- CRUD操作
- クエリロジック
- トランザクション

✅ **API Handler (Handler層)**
- エンドポイントの動作
- エラーハンドリング
- レスポンス形式

### 適用不要

❌ **設定ファイル**
- `vite.config.ts`
- `tailwind.config.js`

❌ **型定義のみ**
- `interface Task { ... }`
- `type TaskId = string`

❌ **簡単な変換関数**
- `const toDomain = (prisma) => ({ ... })`

---

## まとめ: TDD実践チェックリスト

### 実装開始前
- [ ] TODOリストを作成
- [ ] 最初のテストケースを決定
- [ ] テストを書く環境を準備

### 各サイクル
- [ ] 🔴 Red: テストを書いて失敗させる
- [ ] 🟢 Green: テストを通す最小限のコード
- [ ] 🔵 Refactor: コードを整理
- [ ] すべてのテストが通ることを確認
- [ ] TODOリストを更新
- [ ] コミット

### 実装完了後
- [ ] すべてのTODOが完了
- [ ] すべてのテストがパス
- [ ] コードカバレッジ確認
- [ ] リファクタリング完了
- [ ] ドキュメント更新

---

## 参考資料

- **t_wada (和田卓人)さんの講演**
  - "質とスピード" シリーズ
  - "TDDライブコーディング" シリーズ

- **書籍**
  - Kent Beck "Test Driven Development: By Example"
  - 和田卓人訳 "テスト駆動開発"

- **実践例**
  - このプロジェクトの `features/tasks/` 配下のテスト
  - 特に `service.test.ts` と `.test/handler.*.test.ts`
