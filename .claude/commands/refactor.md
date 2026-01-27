# Refactor Command

リファクタリングを安全かつ効果的に実行するためのコマンド。

## 参照ルール

以下のルールファイルを必ず参照してリファクタリングを実行:

- **コーディング規約**: `.claude/rules/coding-rules.md`
- **テスト規約**: `.claude/rules/testing.md` (TDD含む)
- **計画規約**: `.claude/rules/planning.md`
- **セキュリティ**: `.claude/rules/security.md`

## リファクタリングの原則

### 1. 安全第一 (Safety First)

```
🔴 テストで現在の動作を固める
🟢 リファクタリングを実行
🔵 テストが通ることを確認
```

**重要**: 動作を変えずに構造を改善する。機能追加とリファクタリングは別のコミットで。

### 2. 小さなステップ (Baby Steps)

- 一度に1つの変更のみ
- 各変更後にテスト実行
- 問題があれば即座にロールバック
- 論理的な単位でコミット

### 3. ボーイスカウトルール

「コードを見つけた時より綺麗にして去る」
- ただし、必要以上の変更は避ける
- 関連する部分のみリファクタ

---

## リファクタリング実行手順

### Step 1: 分析フェーズ

対象コードを分析し、以下を特定:

#### コードスメル (Code Smells)

| スメル | 説明 | 対処法 |
|--------|------|--------|
| **重複コード** | 同じ/類似のコードが複数箇所 | 関数抽出、共通モジュール化 |
| **長い関数** | 1関数が50行以上 | 関数分割、責務分離 |
| **長いパラメータリスト** | 引数が4つ以上 | オブジェクト化、ビルダーパターン |
| **神クラス/関数** | 1つが多すぎる責務を持つ | 責務分離、クラス分割 |
| **フィーチャー羨望** | 他モジュールのデータを多用 | メソッド移動、責務の再配置 |
| **データの塊** | 常に一緒に使われるデータ群 | クラス/型として抽出 |
| **プリミティブ執着** | 基本型の過度な使用 | ドメイン型（Branded Type）導入 |
| **分岐の乱用** | if/switch文の多用 | ポリモーフィズム、戦略パターン |
| **コメントの多用** | コードの意図をコメントで説明 | 自己文書化コードへ |
| **死んだコード** | 使われていないコード | 削除 |

#### アーキテクチャ違反

- [ ] Feature-Sliced Architectureに準拠しているか
- [ ] 層の依存関係が正しいか（domain ← service ← repository ← handler）
- [ ] 公開APIが適切にエクスポートされているか

### Step 2: テストカバレッジ確認

```bash
# カバレッジ確認
bun run test:coverage

# 対象ファイルのテスト有無を確認
bun test <target-file>
```

**テストがない場合**: リファクタリング前にテストを追加

```typescript
// ✅ 現在の動作をテストで固める
describe("現在の動作", () => {
  test("期待される入出力", () => {
    // 現在の動作を正確にテスト
  });
});
```

### Step 3: リファクタリング計画

変更を小さなステップに分解:

```markdown
## リファクタリング計画

### 対象: {file/feature}
### 目的: {改善したい点}

### Steps:
1. [ ] テスト追加（必要な場合）
2. [ ] {具体的な変更1}
3. [ ] テスト実行・確認
4. [ ] {具体的な変更2}
5. [ ] テスト実行・確認
6. [ ] 最終確認・コミット
```

### Step 4: リファクタリング実行

各ステップで以下を実行:

```bash
# 1. 変更を実施

# 2. 型チェック
bun run check:type

# 3. テスト実行
bun run test:run

# 4. Lint/Format
bun run format
bun run check:biome

# 5. 問題なければ続行、あればロールバック
```

### Step 5: 検証・コミット

```bash
# 全チェック実行
bun run check

# 全テスト実行
bun run test:run

# コミット
git add <changed-files>
git commit -m "refactor: <what was improved>

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 主要リファクタリングパターン

### 1. 関数抽出 (Extract Function)

```typescript
// Before: 長い関数
const processTask = async (task: Task) => {
  // バリデーション (10行)
  if (!task.title) throw new Error("...");
  // ...

  // 変換処理 (15行)
  const transformed = { ... };
  // ...

  // 保存処理 (10行)
  await db.save(transformed);
  // ...
};

// After: 責務ごとに分割
const validateTask = (task: Task): Result<Task, ValidationError> => { ... };
const transformTask = (task: Task): TransformedTask => { ... };
const saveTask = (task: TransformedTask): ResultAsync<Task, DBError> => { ... };

const processTask = (task: Task): ResultAsync<Task, TaskError> =>
  liftAsync(validateTask(task))
    .map(transformTask)
    .andThen(saveTask);
```

### 2. 条件分岐の簡略化 (Simplify Conditional)

```typescript
// Before: ネストした条件分岐
const getStatus = (task: Task): string => {
  if (task.completed) {
    if (task.archived) {
      return "archived";
    } else {
      return "completed";
    }
  } else {
    if (task.started) {
      return "in_progress";
    } else {
      return "pending";
    }
  }
};

// After: 早期リターン + フラットな構造
const getStatus = (task: Task): TaskStatus => {
  if (task.archived) return "archived";
  if (task.completed) return "completed";
  if (task.started) return "in_progress";
  return "pending";
};
```

### 3. パラメータオブジェクト導入 (Introduce Parameter Object)

```typescript
// Before: 多すぎるパラメータ
const createTask = (
  title: string,
  description: string | null,
  status: TaskStatus,
  priority: Priority,
  dueDate: Date | null,
  assigneeId: string | null,
) => { ... };

// After: パラメータオブジェクト
interface CreateTaskInput {
  readonly title: string;
  readonly description?: string | null;
  readonly status?: TaskStatus;
  readonly priority?: Priority;
  readonly dueDate?: Date | null;
  readonly assigneeId?: string | null;
}

const createTask = (input: CreateTaskInput) => { ... };
```

### 4. ポリモーフィズム導入 (Replace Conditional with Polymorphism)

```typescript
// Before: switch文の乱用
const calculatePay = (employee: Employee): number => {
  switch (employee.type) {
    case "hourly":
      return employee.hours * employee.rate;
    case "salaried":
      return employee.salary / 12;
    case "commission":
      return employee.basePay + employee.sales * employee.commissionRate;
    default:
      throw new Error("Unknown type");
  }
};

// After: 型による分岐
type Employee =
  | { type: "hourly"; hours: number; rate: number }
  | { type: "salaried"; salary: number }
  | { type: "commission"; basePay: number; sales: number; commissionRate: number };

const calculatePay = (employee: Employee): number => {
  switch (employee.type) {
    case "hourly": return employee.hours * employee.rate;
    case "salaried": return employee.salary / 12;
    case "commission": return employee.basePay + employee.sales * employee.commissionRate;
  }
  // TypeScriptが網羅性をチェック（defaultは不要）
};
```

### 5. 共通モジュール抽出 (Extract Shared Module)

```typescript
// Before: 複数ファイルに重複
// features/tasks/service/service.ts
const parseWith = <T>(schema: z.ZodType<T>, data: unknown) => { ... };
const liftAsync = <T, E>(result: Result<T, E>) => { ... };

// features/users/service/service.ts
const parseWith = <T>(schema: z.ZodType<T>, data: unknown) => { ... };  // 重複!
const liftAsync = <T, E>(result: Result<T, E>) => { ... };  // 重複!

// After: 共通モジュールに抽出
// lib/validation/index.ts
export const parseWith = <T, E>(
  schema: z.ZodType<T>,
  data: unknown,
  errorFactory: (msg: string) => E,
): Result<T, E> => { ... };

export const liftAsync = <T, E>(result: Result<T, E>): ResultAsync<T, E> =>
  result.match(okAsync, errAsync);
```

### 6. neverthrowパターンへの移行

```typescript
// Before: try-catch
const getTask = async (id: string): Promise<Task> => {
  try {
    const task = await db.findTask(id);
    if (!task) throw new Error("Not found");
    return task;
  } catch (error) {
    throw new Error(`Failed: ${error.message}`);
  }
};

// After: ResultAsync
const getTask = (id: string): ResultAsync<Task, TaskError> =>
  wrapAsyncWithLog(
    "taskRepository.findById",
    { id },
    () => prisma.task.findUnique({ where: { id } }),
    TaskErrors.database,
  ).andThen((task) =>
    task ? ok(toDomain(task)) : err(TaskErrors.notFound(createTaskId(id))),
  );
```

### 7. Svelte 5 Runesへの移行

```svelte
<!-- Before: Svelte 4 -->
<script lang="ts">
  export let task: Task;
  export let onEdit: (task: Task) => void;

  let count = 0;
  $: doubled = count * 2;

  function increment() {
    count += 1;
  }
</script>

<button on:click={increment}>
  {doubled}
</button>

<!-- After: Svelte 5 Runes -->
<script lang="ts">
  interface Props {
    task: Task;
    onEdit: (task: Task) => void;
  }

  let { task, onEdit }: Props = $props();

  let count = $state(0);
  let doubled = $derived(count * 2);

  function increment() {
    count += 1;
  }
</script>

<button onclick={increment}>
  {doubled}
</button>
```

---

## プロジェクト固有のリファクタリング

### API層の構造改善

#### シンプル → 複雑な機能への移行

機能が成長して複数サブドメインを持つようになった場合:

```
# Before: シンプルな構造
features/stamps/
├── handler.ts
├── validator.ts
└── ...

# After: 複雑な構造
features/attendance/
├── domain/
│   ├── stamp.ts
│   ├── attendance.ts
│   └── index.ts
├── handler/
│   ├── stamp-handler.ts
│   ├── attendance-handler.ts
│   └── index.ts
├── validator/
│   ├── stamp-validator.ts
│   ├── attendance-validator.ts
│   └── index.ts
└── ...
```

### Web層の構造改善

#### Store → TanStack Queryへの移行

```typescript
// Before: Svelte Store
export const tasks = writable<Task[]>([]);
export const isLoading = writable(false);

export const tasksStore = {
  async fetchAll() {
    isLoading.set(true);
    try {
      const data = await api.getTasks();
      tasks.set(data.tasks);
    } finally {
      isLoading.set(false);
    }
  },
};

// After: TanStack Query
export const useTasksQuery = () =>
  createQuery({
    queryKey: ["tasks"],
    queryFn: () => api.getTasks().then((r) => r.tasks),
  });

export const useCreateTaskMutation = () =>
  createMutation({
    mutationFn: (input: CreateTaskInput) => api.createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
```

---

## リファクタリングのアンチパターン

### やってはいけないこと

1. **テストなしでリファクタリング**
   - 必ずテストで動作を固めてから

2. **機能追加とリファクタリングの混同**
   - 別々のコミットで実施

3. **大きすぎる変更**
   - 小さなステップに分割

4. **完璧主義**
   - 「十分良い」で止める
   - 関連しない部分まで手を出さない

5. **リファクタリングのリファクタリング**
   - 一度のリファクタリングで完了させる
   - 何度も同じ箇所を変更しない

6. **コメントアウトでの保持**
   - 不要なコードは完全に削除
   - Gitで履歴は追える

---

## チェックリスト

### リファクタリング前
- [ ] 対象コードを理解した
- [ ] コードスメルを特定した
- [ ] テストカバレッジを確認した
- [ ] リファクタリング計画を立てた

### リファクタリング中
- [ ] 小さなステップで進めている
- [ ] 各ステップ後にテスト実行
- [ ] 型チェックがパス
- [ ] 動作が変わっていないことを確認

### リファクタリング後
- [ ] すべてのテストがパス
- [ ] 型チェックがパス
- [ ] Lintがパス
- [ ] コードが読みやすくなった
- [ ] 重複が減った
- [ ] 適切なコミットメッセージ

---

## 使用例

```bash
# 特定ファイルのリファクタリング
/refactor apps/api/src/features/tasks/service/service.ts

# 特定機能全体のリファクタリング
/refactor apps/api/src/features/attendance

# 重複コード解消
/refactor --focus=duplication apps/api/src/features

# neverthrowパターンへの移行
/refactor --pattern=neverthrow apps/api/src/features/tasks/handler.ts
```
