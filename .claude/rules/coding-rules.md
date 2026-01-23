# Coding Rules

このドキュメントではプロジェクト固有のコーディング規約を定義します。

## 全体的な原則

### TypeScript
- **strictモード必須**: すべてのコンパイラオプションを有効化
- **明示的な型定義**: 型推論に頼りすぎない
- **any禁止**: `unknown`を使用
- **非nullアサーション最小化**: 本当に必要な場合のみ `!` を使用

### ファイル命名
- **ケバブケース**: `task-service.ts`, `task-list.svelte`
- **拡張子**: TypeScript `.ts`, Svelte `.svelte`, 設定ファイル `.js`

### インデント・フォーマット
- **Biome使用**: `bun run format` で自動フォーマット
- **インデント**: 2スペース
- **行末セミコロン**: あり
- **クォート**: ダブルクォート `"`

---

## API (Hono + Prisma) コーディング規約

### 1. Feature-Sliced Architecture

すべての機能は以下の層に分割:

```
features/{feature}/
├── index.ts              # 公開API (型とルートのみエクスポート)
├── domain/               # ドメイン層
│   └── {name}.ts
├── service/              # サービス層
│   ├── service.ts
│   └── service.test.ts
├── repository/           # リポジトリ層
│   └── repository.ts
├── handler.ts            # ハンドラー層 (HTTP)
├── validator.ts          # バリデーション
└── .test/                # E2Eテスト
    ├── setup.ts
    └── handler.*.test.ts
```

### 2. Domain層の規約

**イミュータブルな型定義**

```typescript
// ✅ GOOD: readonly, Branded Type, Smart Constructor
export type TaskId = string & { readonly _brand: unique symbol };

export interface Task {
  readonly id: TaskId;
  readonly title: string;
  readonly description: string | null;
  readonly status: TaskStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export const createTaskId = (id: string): TaskId => id as TaskId;
export const createTask = (params: TaskParams): Task => Object.freeze(params);

// ❌ BAD: mutable
interface Task {
  id: string;  // Branded Typeなし
  title: string;
}
```

**エラー型定義**

```typescript
// ✅ GOOD: 判別可能なユニオン型
export type TaskNotFoundError = {
  readonly type: "NOT_FOUND";
  readonly taskId: TaskId;
};

export type TaskError =
  | DatabaseError
  | ValidationError
  | TaskNotFoundError
  | TaskAlreadyExistsError;

// エラーコンストラクタ
export const TaskErrors = {
  notFound: (taskId: TaskId): TaskNotFoundError => ({
    type: "NOT_FOUND",
    taskId,
  }),
  validation: Errors.validation,
  database: Errors.database,
} as const;

// ❌ BAD: throwableなエラークラス
class TaskNotFoundError extends Error {}
```

### 3. Service層の規約

**関数型エラーハンドリング**

```typescript
// ✅ GOOD: ResultAsyncを返す
import { ResultAsync, okAsync, errAsync, ok, err } from "neverthrow";

export const getTaskById = (id: string): ResultAsync<Task, TaskError> =>
  liftAsync(parseWith(taskIdSchema, id))
    .andThen(taskRepository.findById)
    .map(enrichTaskData);

// ヘルパー関数
const parseWith = <T>(
  schema: z.ZodType<T>,
  data: unknown,
): Result<T, TaskError> => {
  const result = schema.safeParse(data);
  if (result.success) return ok(result.data);
  return err(TaskErrors.validation(result.error.issues[0]?.message));
};

const liftAsync = <T, E>(result: Result<T, E>): ResultAsync<T, E> =>
  result.match(okAsync, errAsync);

// ❌ BAD: throwする
export const getTaskById = async (id: string): Promise<Task> => {
  if (!id) throw new Error("ID required");
  const task = await db.findTask(id);
  if (!task) throw new TaskNotFoundError();
  return task;
};
```

**Zod Validation**

```typescript
// ✅ GOOD: trim, transform, 明確なエラーメッセージ
const titleSchema = z
  .string()
  .trim()
  .min(1, "Title cannot be empty")
  .max(200, "Title must be 200 characters or less");

const descriptionSchema = z
  .string()
  .trim()
  .max(1000, "Description must be 1000 characters or less")
  .transform((val) => (val.length === 0 ? null : val))
  .nullable()
  .optional()
  .transform((val) => val ?? null);

// ❌ BAD: 曖昧なエラーメッセージ
const titleSchema = z.string().min(1).max(200);
```

**名前空間エクスポート**

```typescript
// ✅ GOOD: 名前空間オブジェクト
export const taskService = {
  getAll: getAllTasks,
  getById: getTaskById,
  create: createTask,
  update: updateTask,
  delete: deleteTask,
} as const;

// ❌ BAD: 個別エクスポート
export { getAllTasks, getTaskById, createTask };
```

### 4. Repository層の規約

**Prismaラッパー**

```typescript
// ✅ GOOD: wrapAsyncWithLogを使用、エラーマッピング
import { wrapAsyncWithLog } from "@api/lib/types/result/db";

const findById = (id: TaskId): ResultAsync<Task, TaskError> =>
  wrapAsyncWithLog(
    "taskRepository.findById",
    { id },
    () => prisma.task.findUnique({ where: { id: id as string } }),
    TaskErrors.database,
  ).andThen((task) =>
    task ? ok(toDomain(task)) : err(TaskErrors.notFound(id)),
  );

// ドメインへの変換
const toDomain = (prismaTask: PrismaTask): Task =>
  createTask({
    id: createTaskId(prismaTask.id),
    title: prismaTask.title,
    description: prismaTask.description,
    status: prismaTask.status as TaskStatus,
    createdAt: prismaTask.createdAt,
    updatedAt: prismaTask.updatedAt,
  });

// ❌ BAD: 直接Prisma呼び出し、エラーハンドリングなし
const findById = async (id: string) => {
  return await prisma.task.findUnique({ where: { id } });
};
```

**Prisma Not Found エラーハンドリング**

```typescript
// ✅ GOOD: isDatabaseNotFoundヘルパーを使用
import { isDatabaseNotFound } from "@api/lib/error";

const update = (id: TaskId, params: UpdateParams): ResultAsync<Task, TaskError> =>
  wrapAsyncWithLog(
    "taskRepository.update",
    { id, ...params },
    () => prisma.task.update({ where: { id: id as string }, data: params }),
    TaskErrors.database,
  )
    .map(toDomain)
    .mapErr((error) =>
      isDatabaseNotFound(error) ? TaskErrors.notFound(id) : error,
    );

// ❌ BAD: Prismaエラーコードを直接チェック
catch (error) {
  if (error.code === "P2025") { ... }
}
```

### 5. Handler層の規約

**Honoルート定義**

```typescript
// ✅ GOOD: メソッドチェーン、zValidator、match
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

export default new Hono()
  .get(
    "/:id",
    zValidator("param", idParamSchema, (result, c) => {
      if (!result.success) {
        return responseBadRequest(c, result.error.issues);
      }
      return;
    }),
    async (c) => {
      const { id } = c.req.valid("param");

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
        },
      );
    },
  );

// ❌ BAD: try-catch、直接レスポンス
app.get("/:id", async (c) => {
  try {
    const task = await getTask(c.req.param("id"));
    return c.json(task);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});
```

**HTTPレスポンスヘルパー使用**

```typescript
// ✅ GOOD: @api/lib/httpヘルパー使用
import {
  responseOk,
  responseCreated,
  responseNoContent,
  responseBadRequest,
  responseNotFound,
  responseDBAccessError,
} from "@api/lib/http";

return responseOk(c, { task });
return responseCreated(c, { task });
return responseNoContent(c);
return responseBadRequest(c, "Invalid input");
return responseNotFound(c, { message: "Task not found" });
return responseDBAccessError(c);

// ❌ BAD: 直接ステータスコード
return c.json({ task }, 200);
return c.json({ error: "Not found" }, 404);
```

### 6. Validator層の規約

```typescript
// ✅ GOOD: 独立したvalidator.ts、再利用可能なスキーマ
export const idParamSchema = z.object({
  id: z.string().trim().min(1, "Task ID is required"),
});

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .nullable()
    .optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

// ❌ BAD: handler内でインラインスキーマ定義
app.post("/", async (c) => {
  const body = z.object({ title: z.string() }).parse(await c.req.json());
});
```

### 7. 公開API (index.ts)

```typescript
// ✅ GOOD: 型とルートのみエクスポート
export type { Task, TaskId, TaskStatus, TaskError } from "./domain/task.ts";
export { default as taskRoutes } from "./handler.ts";

// ❌ BAD: 実装の詳細をエクスポート
export { taskService } from "./service/service.ts";
export { taskRepository } from "./repository/repository.ts";
```

### 8. データベース規約

**Prismaスキーマ**

```prisma
// ✅ GOOD
generator client {
  provider = "prisma-client-js"
  output   = "../generated/client"
}

generator fabbrica {
  provider = "prisma-fabbrica"
  output   = "../generated/fabbrica"
}

datasource db {
  provider = "postgresql"
}

model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  status      String   @default("pending")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("tasks")
}
```

**Prismaクライアント使用**

```typescript
// ✅ GOOD: シングルトンをインポート
import { prisma } from "@api/lib/db";

const tasks = await prisma.task.findMany();

// ❌ BAD: 新しいインスタンスを作成
const prisma = new PrismaClient();
```

### 9. タイムゾーン処理

**バックエンド: 常にUTC**

```typescript
// ✅ GOOD: UTC日時を使用
import { nowUTC, toUTC, formatInTimezone } from "@api/lib/time";

const task = await prisma.task.create({
  data: {
    title: "Task",
    createdAt: nowUTC(), // UTC
  },
});

// フォーマットはフロントエンドで
// ❌ BAD: サーバー側でタイムゾーン変換
const jstDate = dayjs().tz("Asia/Tokyo");
```

---

## Web (Svelte + Vite) コーディング規約

### 1. Feature-Sliced Architecture

```
features/{feature}/
├── pages/                # ページコンポーネント
├── components/           # UIコンポーネント
├── api/                  # API連携
│   ├── client.ts        # Hono RPCクライアント
│   └── index.ts         # APIラッパー関数
├── stores/               # 状態管理
│   ├── {name}.ts
│   └── index.ts
├── types/                # 型定義
│   └── index.ts
└── .docs/                # ドキュメント
    └── design.md
```

### 2. Hono RPC クライアント

**クライアント設定**

```typescript
// ✅ GOOD: APIのAppTypeをインポート
import { hc } from "hono/client";
import type { AppType } from "@api/index";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const client = hc<AppType>(apiUrl);
export const tasksApi = client.api.tasks;

// ❌ BAD: 型なし
const client = hc("http://localhost:3000");
```

**APIラッパー関数**

```typescript
// ✅ GOOD: エラーハンドリング、明示的な戻り値型
import type { Task, CreateTaskInput } from "../types";

export async function getTasks(): Promise<{ tasks: Task[] }> {
  const res = await tasksApi.$get();
  if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.statusText}`);
  return await res.json();
}

export async function createTask(input: CreateTaskInput): Promise<{ task: Task }> {
  const res = await tasksApi.$post({ json: input });
  if (!res.ok) throw new Error(`Failed to create task: ${res.statusText}`);
  return await res.json();
}

// ❌ BAD: エラーハンドリングなし
export const getTasks = () => tasksApi.$get().then(r => r.json());
```

### 3. Svelte Stores

**Store定義**

```typescript
// ✅ GOOD: writable, derived, オプティミスティック更新
import { writable, derived } from "svelte/store";
import type { Task, CreateTaskInput, UpdateTaskInput } from "../types";
import * as api from "../api";

export const tasks = writable<Task[]>([]);
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);

// Derived store
export const filteredTasks = derived(
  [tasks, currentFilter],
  ([$tasks, $filter]) => {
    if ($filter === "all") return $tasks;
    return $tasks.filter((task) => task.status === $filter);
  },
);

// Store methods
export const tasksStore = {
  async fetchAll() {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.getTasks();
      tasks.set(data.tasks);
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      isLoading.set(false);
    }
  },

  async update(id: string, input: UpdateTaskInput) {
    isLoading.set(true);
    error.set(null);

    // オプティミスティック更新
    let original: Task | undefined;
    tasks.update((items) => {
      original = items.find((t) => t.id === id);
      return items.map((t) => (t.id === id ? { ...t, ...input } : t));
    });

    try {
      const data = await api.updateTask(id, input);
      tasks.update((items) => items.map((t) => (t.id === id ? data.task : t)));
    } catch (err) {
      // エラー時ロールバック
      if (original) {
        tasks.update((items) => items.map((t) => (t.id === id ? original! : t)));
      }
      error.set(err instanceof Error ? err.message : "Failed to update task");
      throw err;
    } finally {
      isLoading.set(false);
    }
  },
};

// ❌ BAD: グローバル変数、エラーハンドリングなし
let tasks = [];
export const fetchTasks = async () => {
  tasks = await api.getTasks();
};
```

**Store使用 (コンポーネント)**

```svelte
<script lang="ts">
  import { onMount } from "svelte";
  import { tasks, isLoading, error, tasksStore } from "../stores";

  onMount(() => {
    tasksStore.fetchAll();
  });

  async function handleCreate() {
    try {
      await tasksStore.create({ title: "New Task" });
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  }
</script>

<!-- ✅ GOOD: $記法でリアクティブ -->
{#if $error}
  <div class="error">{$error}</div>
{/if}

{#if $isLoading}
  <div>Loading...</div>
{:else}
  {#each $tasks as task (task.id)}
    <div>{task.title}</div>
  {/each}
{/if}

<button on:click={handleCreate}>Create</button>

<!-- ❌ BAD: storeを直接参照 -->
{#each tasks as task}
  <div>{task.title}</div>
{/each}
```

### 4. Svelteコンポーネント

**Props定義**

```svelte
<script lang="ts">
  import type { Task } from "../types";

  // ✅ GOOD: export letでprops定義、型注釈
  export let task: Task;
  export let onEdit: (task: Task) => void;
  export let onDelete: (id: string) => void;

  // ❌ BAD: 型なし
  export let task;
  export let onEdit;
</script>
```

**イベントディスパッチ**

```svelte
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { Task } from "../types";

  // ✅ GOOD: 型付きイベント
  const dispatch = createEventDispatcher<{
    edit: Task;
    delete: string;
  }>();

  function handleEdit() {
    dispatch("edit", task);
  }
</script>

<button on:click={handleEdit}>Edit</button>

<!-- ❌ BAD: 型なし -->
<button on:click={() => dispatch("edit", task)}>Edit</button>
```

**フォームバインディング**

```svelte
<script lang="ts">
  // ✅ GOOD: bind:value
  let title = "";
  let description = "";
</script>

<input bind:value={title} placeholder="Title" />
<textarea bind:value={description} placeholder="Description" />

<!-- ❌ BAD: onInput -->
<input value={title} on:input={(e) => (title = e.target.value)} />
```

**条件・繰り返しレンダリング**

```svelte
<!-- ✅ GOOD: キー付きeach、if-else if-else -->
{#if $isLoading}
  <div>Loading...</div>
{:else if $error}
  <div>Error: {$error}</div>
{:else if $tasks.length === 0}
  <div>No tasks</div>
{:else}
  {#each $tasks as task (task.id)}
    <div>{task.title}</div>
  {/each}
{/if}

<!-- ❌ BAD: キーなし、ネストif -->
{#each tasks as task}
  <div>{task.title}</div>
{/each}
```

### 5. 型定義

```typescript
// ✅ GOOD: API型を再エクスポート、クライアント専用型を追加
// features/todo-list/types/index.ts
export type { Task, TaskId, TaskStatus } from "@api/features/tasks/domain/task";

// クライアント専用型
export type TaskFilter = "all" | "pending" | "in_progress" | "completed";

export interface CreateTaskInput {
  title: string;
  description?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: "pending" | "in_progress" | "completed";
}

// ❌ BAD: 型を複製
export interface Task {
  id: string;
  title: string;
  // ...
}
```

### 6. スタイリング

**Tailwind CSS**

```svelte
<!-- ✅ GOOD: Tailwindユーティリティクラス -->
<div class="container mx-auto py-8 px-4 max-w-4xl">
  <h1 class="text-4xl font-bold text-gray-900 mb-8">Todo List</h1>
</div>

<!-- ✅ GOOD: 条件付きクラス -->
<button
  class="px-4 py-2 rounded-md {$currentFilter === 'all'
    ? 'bg-blue-600 text-white'
    : 'bg-gray-200 text-gray-700'}"
>
  All
</button>

<!-- ❌ BAD: インラインスタイル -->
<div style="max-width: 1024px; margin: 0 auto;">
  <h1 style="font-size: 2rem; font-weight: bold;">Todo List</h1>
</div>
```

**cn()ヘルパー (shadcn-svelte)**

```svelte
<script lang="ts">
  import { cn } from "$lib/utils";

  export let variant: "default" | "destructive" = "default";
</script>

<!-- ✅ GOOD: cn()で条件付きクラス -->
<button
  class={cn(
    "px-4 py-2 rounded-md",
    variant === "default" && "bg-blue-600 text-white",
    variant === "destructive" && "bg-red-600 text-white",
  )}
>
  <slot />
</button>
```

### 7. タイムゾーン処理

**フロントエンド: 表示時に変換**

```svelte
<script lang="ts">
  import type { Task } from "../types";

  export let task: Task;

  // ✅ GOOD: UTC文字列をDateに変換してローカル表示
  const createdAtLocal = new Date(task.createdAt).toLocaleString();
  const createdAtDate = new Date(task.createdAt).toLocaleDateString();
  const createdAtTime = new Date(task.createdAt).toLocaleTimeString();
</script>

<p>Created: {createdAtLocal}</p>

<!-- ❌ BAD: UTC文字列をそのまま表示 -->
<p>Created: {task.createdAt}</p>
```

---

## 共通規約

### 1. コメント

```typescript
// ✅ GOOD: 必要な箇所のみコメント
// ビジネスロジックの意図を説明
const statusCycle = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "pending",
};

// Workaround for Prisma bug #12345
const result = await prisma.$queryRaw`...`;

// ❌ BAD: 自明なコメント、コメントアウトされたコード
// Get tasks
const tasks = await getTasks();

// const oldImplementation = () => { ... };
```

### 2. 非同期処理

```typescript
// ✅ GOOD: async/await
async function fetchData() {
  const tasks = await api.getTasks();
  return tasks;
}

// ❌ BAD: Promise chain
function fetchData() {
  return api.getTasks().then((tasks) => tasks);
}
```

### 3. エラーハンドリング

```typescript
// ✅ GOOD (API): ResultAsync
return taskService.getById(id).match(
  (task) => responseOk(c, { task }),
  (error) => handleError(error),
);

// ✅ GOOD (Web): try-catch
try {
  await tasksStore.create(input);
} catch (err) {
  console.error("Failed:", err);
  error.set(err instanceof Error ? err.message : "Unknown error");
}

// ❌ BAD: エラーを無視
await tasksStore.create(input).catch(() => {});
```

### 4. 命名規則

```typescript
// ✅ GOOD
// 変数: camelCase
const taskCount = 10;
const isLoading = true;

// 関数: camelCase、動詞始まり
function getTasks() {}
function handleCreate() {}

// 型・インターフェース: PascalCase
interface Task {}
type TaskId = string;

// 定数: UPPER_SNAKE_CASE
const MAX_TITLE_LENGTH = 200;

// コンポーネント: PascalCase
TodoListPage.svelte
TaskCard.svelte

// ❌ BAD
const TaskCount = 10;  // 定数ではない
function task_list() {}  // snake_case
interface task {}  // lowercase
```

### 5. インポート順序

```typescript
// ✅ GOOD: 外部 → 内部 → 相対
import { Hono } from "hono";
import { z } from "zod";

import { prisma } from "@api/lib/db";
import { Errors } from "@api/lib/error";

import { taskRepository } from "./repository/repository.ts";
import type { Task } from "./domain/task.ts";

// ❌ BAD: ランダムな順序
import { taskRepository } from "./repository/repository.ts";
import { Hono } from "hono";
import { prisma } from "@api/lib/db";
```

### 6. Boolean条件

```typescript
// ✅ GOOD: 明示的
if (tasks.length > 0) {}
if (user !== null) {}
if (isLoading === true) {}

// ✅ GOOD: truthyチェック（適切な場合のみ）
if (error) {}
if (title) {}

// ❌ BAD: 曖昧
if (tasks.length) {}  // 0をfalsyとして扱うのは明示的に
if (!user) {}  // nullチェックは !== null
```
