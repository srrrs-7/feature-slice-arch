# Testing Rules

このドキュメントではテスト戦略とTDD実践パターンを定義します。

---

## TDD (Test-Driven Development)

### Red-Green-Refactor サイクル

```
🔴 Red    → テストを書いて失敗させる
🟢 Green  → テストが通る最小限のコードを書く
🔵 Refactor → 重複を排除し、コードを整理する
```

### TDDの原則

1. **テストファースト**: コードより先にテストを書く
2. **小さなステップ**: 一度に1つのことだけ（10-20分で1サイクル）
3. **リファクタリングはグリーン状態で**: テストが通ってから整理

### TDD実践フロー

```bash
# 1. TODOリスト作成
# - [ ] タイトルを指定してタスクを作成できる
# - [ ] 空のタイトルでエラー

# 2. テストを書く（🔴 Red）
test("creates task with title", () => { ... });
# → 失敗

# 3. 最小限の実装（🟢 Green）
export const create = () => { ... };
# → 成功

# 4. リファクタリング（🔵 Refactor）
# コードを整理、テストは通ったまま

# 5. 次のTODOへ
```

### TDDチェックリスト

- [ ] TODOリストを作成してから開始
- [ ] 各サイクルでテスト→実装→リファクタの順序を守る
- [ ] テストが通ったらコミット
- [ ] カバレッジ80%以上を維持

---

## テスト戦略

### テストピラミッド
```
    E2E Tests (少)
   ───────────────
  Integration Tests (中)
 ────────────────────────
Unit Tests (多)
```

### カバレッジ目標
- **Unit Tests**: 80%以上
- **Integration Tests**: 主要フロー全カバー
- **E2E Tests**: クリティカルパス

### カバレッジ確認ルール

**重要: テスト実装後は必ずカバレッジを確認してください**

```bash
# カバレッジ付きでテスト実行
bun run test:coverage

# または
btc  # エイリアス
```

**確認すべきポイント:**

1. **カバレッジレポートの確認**
   - ターミナル出力でカバレッジサマリーを確認
   - `apps/api/coverage/index.html`をブラウザで開いて詳細確認
   - カバレッジが80%未満の場合は追加テストを実装

2. **未カバー部分の特定**
   ```bash
   # HTMLレポートを開く
   open apps/api/coverage/index.html
   ```
   - 赤色（未実行）の行を確認
   - 黄色（部分的に実行）の分岐を確認
   - 重要なロジックが未カバーでないか確認

3. **カバレッジ目標達成の確認**
   - Lines (行カバレッジ): 80%以上
   - Functions (関数カバレッジ): 80%以上
   - Branches (分岐カバレッジ): 80%以上
   - Statements (ステートメントカバレッジ): 80%以上

4. **テスト追加が必要なケース**
   - エラーハンドリングのパスが未カバー
   - 境界値テストが不足
   - エッジケースが未テスト
   - 分岐条件の片方のみテスト

**ベストプラクティス:**
- ✅ 新機能実装後は必ずカバレッジを確認
- ✅ カバレッジが下がっている場合は追加テストを実装
- ✅ 重要なビジネスロジックは100%カバレッジを目指す
- ✅ カバレッジレポートをレビュー時に参照
- ❌ カバレッジ目標未達のままマージしない
- ❌ カバレッジを上げるためだけの無意味なテストを書かない

**例: カバレッジ確認フロー**
```bash
# 1. テスト実装
# features/tasks/.test/handler.post.test.ts を実装

# 2. カバレッジ付きでテスト実行
btc

# 3. カバレッジ確認
# ターミナル出力:
# All files          |    85.3 |    79.71 |   81.87 |   85.65 |
# features/tasks     |    95.5 |    90.00 |   92.50 |   95.00 |

# 4. 詳細確認（必要に応じて）
open apps/api/coverage/index.html

# 5. 未カバー部分にテスト追加
# エラーハンドリングのテストを追加

# 6. 再度カバレッジ確認
btc

# 7. 目標達成を確認してコミット
git add .
git commit -m "test: add comprehensive tests for task creation"
```

---

## API Testing (vitest + Prisma Fabbrica)

### 1. テスト構成

```
features/{feature}/
├── service/
│   └── service.test.ts      # Unit test (モック使用)
└── .test/
    ├── setup.ts              # 共通セットアップ
    ├── handler.get-all.test.ts
    ├── handler.get-by-id.test.ts
    ├── handler.post.test.ts
    ├── handler.put.test.ts
    └── handler.delete.test.ts
```

### 1.1 Routes層テストケースの作成方針（HTTP Statusごとに入れ子）

Routes（handler）層のテストは **HTTP statusごとに`describe`を分け、その中に「そのstatusが発生するケース」を入れ子で配置**します。

```typescript
describe.sequential("POST /api/tasks", () => {
  const client = testClient(taskRoutes);

  const testCases = [
    { name: "valid input", expectedStatus: 201, ... },
    { name: "missing title", expectedStatus: 400, ... },
  ] as const;

  const casesByStatus = new Map<number, typeof testCases>();
  for (const tc of testCases) {
    const list = casesByStatus.get(tc.expectedStatus) ?? [];
    casesByStatus.set(tc.expectedStatus, [...list, tc]);
  }

  for (const [status, cases] of casesByStatus) {
    describe(`HTTP ${status}`, () => {
      for (const tc of cases) {
        it(tc.name, async () => {
          const ctx = await tc.setup?.();
          const res = await tc.execute(ctx);
          expect(res.status).toBe(status);
          await tc.assert(res, ctx);
        });
      }
    });
  }
});
```

要点:
- `expectedStatus` を必ず各ケースに持たせる
- `describe("HTTP 200")` のように status単位でグルーピング
- 同一status内で「そのstatusが起きる条件」を明確に表現

### 2. vitest設定

**ファイル:** `apps/api/vitest.config.ts`

```typescript
// ✅ GOOD: sequential実行、test環境変数
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,  // テストファイルを順次実行
    env: {
      NODE_ENV: "test",      // ログ無効化
    },
  },
});
```

### 3. セットアップファイル

**ファイル:** `features/tasks/.test/setup.ts`

```typescript
// ✅ GOOD: afterEachでクリーンアップ、ファクトリーをエクスポート
import { afterEach } from "vitest";
import { prisma } from "@api/lib/db";
import { TaskFactory, resetSequence } from "@api/lib/db/factory";

// 各テスト後にデータベースをクリーンアップ
afterEach(async () => {
  await prisma.task.deleteMany();
  resetSequence();  // ファクトリーのシーケンスをリセット
});

// 便利のためにファクトリーを再エクスポート
export { TaskFactory };

// ❌ BAD: beforeEachでデータ作成（テスト間で競合の可能性）
beforeEach(async () => {
  await prisma.task.create({ ... });
});
```

### 4. テーブル駆動テスト (Golang-style)

**パターン:**
```typescript
describe.sequential("GET /api/tasks", () => {
  const client = testClient(taskRoutes);

  const testCases = [
    {
      name: "テストケース名",
      setup: async () => {
        // データ準備
        const task = await TaskFactory.create({ title: "Test" });
        return { taskId: task.id };
      },
      execute: async (context) => {
        // APIリクエスト
        return await client.$get();
      },
      assert: async (res, context) => {
        // アサーション
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.tasks).toHaveLength(1);
      },
    },
    // ... more test cases
  ];

  for (const tc of testCases) {
    it(tc.name, async () => {
      const context = await tc.setup();
      const res = await tc.execute(context);
      await tc.assert(res, context);
    });
  }
});
```

**実例: GET all tasks**

```typescript
// ✅ GOOD: テーブル駆動テスト
import { describe, expect, it } from "vitest";
import { testClient } from "hono/testing";
import taskRoutes from "../handler.ts";
import { TaskFactory } from "./setup.ts";

describe.sequential("GET /api/tasks", () => {
  const client = testClient(taskRoutes);

  const testCases = [
    {
      name: "returns empty array when no tasks exist",
      setup: async () => {
        // データなし
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual({ tasks: [] });
      },
    },
    {
      name: "returns all tasks ordered by createdAt desc",
      setup: async () => {
        await TaskFactory.createList(3);
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.tasks).toHaveLength(3);
        // 降順確認
        const dates = data.tasks.map((t: any) => new Date(t.createdAt).getTime());
        expect(dates).toEqual([...dates].sort((a, b) => b - a));
      },
    },
    {
      name: "returns tasks with all required fields",
      setup: async () => {
        await TaskFactory.create({
          title: "Test Task",
          description: "Test Description",
          status: "pending",
        });
      },
      assert: async (res: Response) => {
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.tasks[0]).toMatchObject({
          id: expect.any(String),
          title: "Test Task",
          description: "Test Description",
          status: "pending",
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      },
    },
  ];

  for (const tc of testCases) {
    it(tc.name, async () => {
      await tc.setup();
      const res = await client.$get();
      await tc.assert(res);
    });
  }
});

// ❌ BAD: 個別it()、データ準備が分散
it("returns empty array", async () => {
  const res = await client.$get();
  expect(res.status).toBe(200);
});

it("returns all tasks", async () => {
  await TaskFactory.createList(3);
  const res = await client.$get();
  expect(res.status).toBe(200);
});
```

**実例: POST endpoint**

```typescript
describe.sequential("POST /api/tasks", () => {
  const client = testClient(taskRoutes);

  const testCases = [
    {
      name: "creates task with valid data",
      input: { title: "New Task", description: "Task description" },
      assert: async (res: Response) => {
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.task).toMatchObject({
          title: "New Task",
          description: "Task description",
          status: "pending",
        });
        expect(data.task).toHaveProperty("id");

        // DBに保存されたか確認
        const dbTask = await prisma.task.findUnique({
          where: { id: data.task.id },
        });
        expect(dbTask).not.toBeNull();
      },
    },
    {
      name: "creates task with null description",
      input: { title: "Task without description" },
      assert: async (res: Response) => {
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.task.description).toBeNull();
      },
    },
    {
      name: "returns validation error for empty title",
      input: { title: "" },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toBe("BAD_REQUEST");
        expect(data.message).toContain("Title");
      },
    },
    {
      name: "returns validation error for title exceeding 200 characters",
      input: { title: "a".repeat(201) },
      assert: async (res: Response) => {
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.message).toContain("200 characters");
      },
    },
    {
      name: "trims title and description",
      input: { title: "  Trimmed Title  ", description: "  Trimmed Desc  " },
      assert: async (res: Response) => {
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.task.title).toBe("Trimmed Title");
        expect(data.task.description).toBe("Trimmed Desc");
      },
    },
    {
      name: "converts empty description to null",
      input: { title: "Task", description: "   " },
      assert: async (res: Response) => {
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.task.description).toBeNull();
      },
    },
  ];

  for (const tc of testCases) {
    it(tc.name, async () => {
      const res = await client.$post({ json: tc.input });
      await tc.assert(res);
    });
  }
});
```

### 5. Prisma Fabbrica Factory

**ファクトリー定義:** `lib/db/factory.ts`

```typescript
// ✅ GOOD: デフォルト値、traits、seq使用
import { defineTaskFactory, initialize } from "./generated/fabbrica";
import { prisma } from "./index.ts";

initialize({ prisma });

export const TaskFactory = defineTaskFactory({
  defaultData: async ({ seq }) => ({
    title: `Task ${seq}`,
    description: `Description for task ${seq}`,
    status: "pending",
  }),
  traits: {
    inProgress: {
      data: { status: "in_progress" },
    },
    completed: {
      data: { status: "completed" },
    },
    withoutDescription: {
      data: { description: null },
    },
  },
});

export { resetSequence } from "./generated/fabbrica";
```

**ファクトリー使用例:**

```typescript
// ✅ GOOD: ファクトリーで簡潔にデータ作成
// 単一作成
const task = await TaskFactory.create();
const task = await TaskFactory.create({ title: "Custom Title" });

// 複数作成
const tasks = await TaskFactory.createList(5);

// Traits使用
const completed = await TaskFactory.use("completed").create();
const inProgress = await TaskFactory.use("inProgress").create();
const noDesc = await TaskFactory.use("withoutDescription").create();

// 複数Traits
const task = await TaskFactory
  .use("completed", "withoutDescription")
  .create();

// ❌ BAD: 手動でデータ作成
const task = await prisma.task.create({
  data: {
    id: "uuid-1",
    title: "Task 1",
    description: "Desc 1",
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
});
```

### 6. Service層ユニットテスト

**モックリポジトリ:**

```typescript
// ✅ GOOD: vitestのvi.fn()でモック、型安全
import { errAsync, okAsync, type ResultAsync } from "neverthrow";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";
import {
  createTask,
  createTaskId,
  type Task,
  type TaskError,
  TaskErrors,
  type TaskId,
} from "../domain/task.ts";

// モックヘルパー
function createMockTask(overrides = {}): Task {
  const now = new Date();
  return createTask({
    id: createTaskId("task-1"),
    title: "Test Task",
    description: "Test description",
    status: "pending",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

// 型安全なモック
type MockFn<T extends (...args: never[]) => unknown> = Mock<T>;

const mockRepository: {
  findAll: MockFn<() => ResultAsync<readonly Task[], TaskError>>;
  findById: MockFn<(id: TaskId) => ResultAsync<Task, TaskError>>;
  create: MockFn<
    (params: { title: string; description: string | null }) => ResultAsync<Task, TaskError>
  >;
} = {
  findAll: vi.fn(() => okAsync([createMockTask()] as readonly Task[])),
  findById: vi.fn(() => okAsync(createMockTask())),
  create: vi.fn(() => okAsync(createMockTask())),
};

// リポジトリをモック
vi.mock("../repository/repository.ts", () => ({
  taskRepository: mockRepository,
}));

// モック後にサービスをインポート
const { taskService } = await import("./service.ts");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("taskService.getById", () => {
  test("returns task when found", async () => {
    const task = createMockTask();
    mockRepository.findById.mockReturnValue(okAsync(task));

    const result = await taskService.getById("task-1");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.id).toBe("task-1");
    }
  });

  test("returns validation error for empty id", async () => {
    const result = await taskService.getById("");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("VALIDATION_ERROR");
    }
  });

  test("returns not found error when task does not exist", async () => {
    mockRepository.findById.mockReturnValue(
      errAsync(TaskErrors.notFound(createTaskId("missing"))),
    );

    const result = await taskService.getById("missing");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe("NOT_FOUND");
    }
  });
});

// ❌ BAD: 型なしモック、グローバルstate
let mockData = [];
const mockRepository = {
  findAll: async () => mockData,
};
```

### 7. アサーションパターン

```typescript
// ✅ GOOD: 明確なアサーション
expect(res.status).toBe(200);
expect(data.task.title).toBe("Expected Title");
expect(data.tasks).toHaveLength(3);

// オブジェクトマッチ
expect(data.task).toMatchObject({
  title: "Title",
  status: "pending",
});

// 配列内容
expect(data.tasks).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ title: "Task 1" }),
  ]),
);

// 型チェック
expect(data.task.id).toEqual(expect.any(String));
expect(data.task.createdAt).toEqual(expect.any(String));

// エラーメッセージ
expect(data.message).toContain("Title");
expect(data.message).toMatch(/200 characters/);

// ❌ BAD: 曖昧なアサーション
expect(data).toBeTruthy();
expect(data.task).toBeDefined();
```

### 8. テスト実行

```bash
# すべてのテスト実行
bun run test:run

# ウォッチモード
bun run test:watch

# 特定のファイル
bun test apps/api/src/features/tasks/service/service.test.ts

# カバレッジ
bun test --coverage
```

---

## Web Testing (Svelte + Testing Library)

### 1. テスト構成

```
features/{feature}/
├── api/
│   └── __tests__/
│       └── client.test.ts
├── stores/
│   └── __tests__/
│       └── tasks.test.ts
├── components/
│   └── __tests__/
│       └── TaskCard.test.ts
└── pages/
    └── __tests__/
        └── TodoListPage.test.ts
```

### 2. API Client テスト

```typescript
// ✅ GOOD: モックサーバーを使用
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { rest } from "msw";
import { setupServer } from "msw/node";
import * as api from "../index";

const server = setupServer(
  rest.get("http://localhost:3000/api/tasks", (req, res, ctx) => {
    return res(ctx.json({ tasks: [{ id: "1", title: "Test Task" }] }));
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("API Client", () => {
  it("fetches tasks", async () => {
    const { tasks } = await api.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Test Task");
  });

  it("handles error response", async () => {
    server.use(
      rest.get("http://localhost:3000/api/tasks", (req, res, ctx) => {
        return res(ctx.status(500));
      }),
    );

    await expect(api.getTasks()).rejects.toThrow("Failed to fetch tasks");
  });
});
```

### 3. Store テスト

```typescript
// ✅ GOOD: get()でstore値を取得、モックAPI
import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "svelte/store";
import { tasks, tasksStore } from "../tasks";
import * as api from "../../api";

vi.mock("../../api");

beforeEach(() => {
  vi.clearAllMocks();
  tasks.set([]);
});

describe("Tasks Store", () => {
  it("initializes with empty array", () => {
    expect(get(tasks)).toEqual([]);
  });

  it("fetches and sets tasks", async () => {
    const mockTasks = [{ id: "1", title: "Task 1", status: "pending" }];
    vi.mocked(api.getTasks).mockResolvedValue({ tasks: mockTasks });

    await tasksStore.fetchAll();

    expect(get(tasks)).toEqual(mockTasks);
  });

  it("handles error during fetch", async () => {
    vi.mocked(api.getTasks).mockRejectedValue(new Error("Network error"));

    await tasksStore.fetchAll();

    const errorValue = get(error);
    expect(errorValue).toBe("Network error");
  });

  it("performs optimistic update", async () => {
    const initialTask = { id: "1", title: "Old", status: "pending" };
    tasks.set([initialTask]);

    const updatePromise = tasksStore.update("1", { title: "New" });

    // オプティミスティック更新を確認
    expect(get(tasks)[0].title).toBe("New");

    vi.mocked(api.updateTask).mockResolvedValue({
      task: { ...initialTask, title: "New" },
    });

    await updatePromise;

    expect(get(tasks)[0].title).toBe("New");
  });

  it("rolls back on update error", async () => {
    const initialTask = { id: "1", title: "Old", status: "pending" };
    tasks.set([initialTask]);

    vi.mocked(api.updateTask).mockRejectedValue(new Error("Update failed"));

    await expect(tasksStore.update("1", { title: "New" })).rejects.toThrow();

    // ロールバック確認
    expect(get(tasks)[0].title).toBe("Old");
  });
});
```

### 4. Component テスト

```typescript
// ✅ GOOD: @testing-library/svelte使用
import { render, screen, fireEvent } from "@testing-library/svelte";
import { expect, it, describe, vi } from "vitest";
import TaskCard from "../TaskCard.svelte";

describe("TaskCard", () => {
  const mockTask = {
    id: "1",
    title: "Test Task",
    description: "Test Description",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("renders task information", () => {
    render(TaskCard, { props: { task: mockTask } });

    expect(screen.getByText("Test Task")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", async () => {
    const onEdit = vi.fn();
    render(TaskCard, { props: { task: mockTask, onEdit } });

    const editButton = screen.getByText("Edit");
    await fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockTask);
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(TaskCard, { props: { task: mockTask, onDelete } });

    const deleteButton = screen.getByText("Delete");
    await fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockTask.id);
  });
});
```

### 5. E2E テスト (Playwright)

```typescript
// ✅ GOOD: Playwright使用
import { test, expect } from "@playwright/test";

test.describe("Todo List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
  });

  test("creates and displays new task", async ({ page }) => {
    // タイトル入力
    await page.fill('input[placeholder*="title"]', "E2E Test Task");
    await page.fill('textarea[placeholder*="description"]', "E2E Description");

    // 作成ボタンクリック
    await page.click('button:has-text("Create Task")');

    // タスクが表示されることを確認
    await expect(page.locator("text=E2E Test Task")).toBeVisible();
    await expect(page.locator("text=E2E Description")).toBeVisible();
  });

  test("updates task status", async ({ page }) => {
    // タスク作成
    await page.fill('input[placeholder*="title"]', "Status Test");
    await page.click('button:has-text("Create Task")');

    // ステータスバッジをクリック
    await page.click('button:has-text("Pending")');

    // In Progressに変更されたことを確認
    await expect(page.locator("text=In Progress")).toBeVisible();
  });

  test("deletes task", async ({ page }) => {
    // タスク作成
    await page.fill('input[placeholder*="title"]', "Delete Test");
    await page.click('button:has-text("Create Task")');

    // 削除ボタンクリック
    await page.click('button:has-text("Delete")');

    // 確認ダイアログでOK
    page.on("dialog", (dialog) => dialog.accept());

    // タスクが消えたことを確認
    await expect(page.locator("text=Delete Test")).not.toBeVisible();
  });

  test("filters tasks by status", async ({ page }) => {
    // 複数タスク作成
    await page.fill('input[placeholder*="title"]', "Pending Task");
    await page.click('button:has-text("Create Task")');

    await page.fill('input[placeholder*="title"]', "Completed Task");
    await page.click('button:has-text("Create Task")');
    await page.click('button:has-text("Pending"):last-of-type');
    await page.click('button:has-text("In Progress")');
    await page.click('button:has-text("In Progress")');

    // Completedフィルター
    await page.click('button:has-text("Completed"):first-of-type');

    // Completedタスクのみ表示
    await expect(page.locator("text=Completed Task")).toBeVisible();
    await expect(page.locator("text=Pending Task")).not.toBeVisible();
  });
});
```

---

## テストのベストプラクティス

### 1. テストの独立性
```typescript
// ✅ GOOD: 各テストが独立
afterEach(async () => {
  await prisma.task.deleteMany();
  resetSequence();
});

// ❌ BAD: テスト間でデータ共有
let sharedTask;
beforeAll(async () => {
  sharedTask = await TaskFactory.create();
});
```

### 2. AAA パターン (Arrange-Act-Assert)
```typescript
// ✅ GOOD: 明確な3ステップ
it("creates task", async () => {
  // Arrange
  const input = { title: "Test", description: "Desc" };

  // Act
  const res = await client.$post({ json: input });

  // Assert
  expect(res.status).toBe(201);
  const data = await res.json();
  expect(data.task.title).toBe("Test");
});
```

### 3. テスト名の明確性
```typescript
// ✅ GOOD: 何をテストするか明確
it("returns 400 when title exceeds 200 characters", async () => {});
it("trims whitespace from title and description", async () => {});
it("converts empty description to null", async () => {});

// ❌ BAD: 曖昧
it("works", async () => {});
it("test create", async () => {});
```

### 4. エッジケースのテスト
```typescript
// ✅ GOOD: 境界値、空文字、null、エラーケース
it("accepts title with exactly 200 characters", async () => {});
it("rejects title with 201 characters", async () => {});
it("handles null description", async () => {});
it("handles empty string description", async () => {});
it("handles whitespace-only description", async () => {});
```

### 5. 非同期テストの適切な処理
```typescript
// ✅ GOOD: async/await使用
it("fetches tasks", async () => {
  const res = await client.$get();
  expect(res.status).toBe(200);
});

// ❌ BAD: awaitなし
it("fetches tasks", () => {
  client.$get().then((res) => {
    expect(res.status).toBe(200);  // アサーションが実行されない可能性
  });
});
```
