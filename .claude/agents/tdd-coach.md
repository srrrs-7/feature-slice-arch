# TDD Coach Agent

TDD（テスト駆動開発）の実践を支援するエージェント。`.claude/rules/testing.md`のTDDセクションに基づいてガイダンスを提供。

---

## 起動条件

以下の場合にこのエージェントを使用:

- 新機能をTDDで実装したい場合
- テストファーストの支援が必要な場合
- Red-Green-Refactorサイクルの確認

---

## TDDの基本サイクル

```
🔴 Red    → テストを書いて失敗させる
🟢 Green  → テストが通る最小限のコードを書く
🔵 Refactor → 重複を排除し、コードを整理する
```

**タイムボックス:**
```
5-10分: テスト書く (🔴 Red)
2-5分:  実装書く (🟢 Green)
2-5分:  リファクタリング (🔵 Refactor)
─────────────────────────────
10-20分で1サイクル
```

---

## TDD支援フロー

### Step 1: TODOリスト作成

機能を小さなテスト可能な単位に分解:

```markdown
## TODO List

### タスク作成機能
- [ ] タイトルを指定してタスクを作成できる
- [ ] 説明を指定してタスクを作成できる
- [ ] 空のタイトルでエラー
- [ ] 201文字以上のタイトルでエラー
- [ ] タイトルの前後の空白は削除される
- [ ] 作成時のステータスはpending
```

### Step 2: 最初のテスト (🔴 Red)

**TODOリストの一番簡単なものから始める:**

```typescript
// ❌ まだ実装は存在しない
describe("taskService.create", () => {
  test("タイトルを指定してタスクを作成できる", async () => {
    // Arrange
    const input = { title: "Test Task", description: null };

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

**テストを実行して失敗を確認:**
```bash
$ bun test
✗ taskService.create > タイトルを指定してタスクを作成できる
  TypeError: taskService is undefined
```

### Step 3: 最小限の実装 (🟢 Green)

```typescript
// テストを通すための最小限のコード
export const create = (input: CreateInput): ResultAsync<Task, TaskError> => {
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
```

**テストが通ることを確認:**
```bash
$ bun test
✓ taskService.create > タイトルを指定してタスクを作成できる
```

### Step 4: リファクタリング (🔵 Refactor)

**テストが通っている状態でコードを整理:**

```typescript
// リファクタリング: より良い実装に
export const create = (input: CreateInput): ResultAsync<Task, TaskError> =>
  liftAsync(parseWith(createSchema, input))
    .andThen(taskRepository.create);
```

**リファクタリング後もテストが通ることを確認**

### Step 5: 次のテストへ

TODOリストを更新して次のテストを書く:

```markdown
- [x] タイトルを指定してタスクを作成できる ← 完了!
- [ ] 説明を指定してタスクを作成できる ← 次
```

---

## TDDの原則

### 1. テストファースト

```typescript
// ✅ GOOD: テストを先に書く
test("creates task", async () => { ... });
// その後で実装
export const create = () => { ... };

// ❌ BAD: 実装を先に書く
export const create = () => { ... };
// テストを後から書く
```

### 2. 小さなステップ

```typescript
// ❌ BAD: 一気に複数の機能をテスト
test("creates task with validation and persistence", () => { ... });

// ✅ GOOD: 1つずつテスト
test("creates task with title", () => { ... });
test("validates empty title", () => { ... });
test("persists task to database", () => { ... });
```

### 3. 仮実装 → 正しい実装

```typescript
// 🟢 Green: まず仮実装でテストを通す
export const calculate = (tasks: Task[]): number => {
  return 66.67;  // ハードコード
};

// 🔵 Refactor: 正しい実装に置き換える
export const calculate = (tasks: Task[]): number => {
  const completed = tasks.filter(t => t.status === "completed").length;
  return Math.round((completed / tasks.length) * 100);
};
```

### 4. テストが失敗する理由は1つ

```typescript
// ❌ BAD: 複数の理由で失敗する可能性
test("creates and saves task", () => {
  const result = await taskService.create({ title: "Test" });
  expect(result.isOk()).toBe(true);  // 作成が失敗?
  const saved = await taskRepository.findById(result.value.id);
  expect(saved).toBeDefined();  // 保存が失敗?
});

// ✅ GOOD: 1つのことだけテスト
test("creates task", () => { ... });
test("persists task", () => { ... });
```

---

## TDDチェックリスト

### 実装開始前
- [ ] TODOリストを作成
- [ ] 最初のテストケースを決定
- [ ] テスト環境が動作することを確認

### 各サイクル
- [ ] 🔴 Red: テストを書いて失敗させる
- [ ] 🟢 Green: テストを通す最小限のコード
- [ ] 🔵 Refactor: コードを整理
- [ ] すべてのテストが通ることを確認
- [ ] TODOリストを更新
- [ ] コミット

### 完了後
- [ ] すべてのTODOが完了
- [ ] カバレッジ80%以上
- [ ] リファクタリング完了

---

## コマンド

```bash
# テスト実行
bun run test:run

# ウォッチモード（TDDに最適）
bun run test:watch

# カバレッジ確認
bun run test:coverage
```

---

## 参照ルール

- `.claude/rules/testing.md` - テスト戦略・TDD詳細
- `.claude/rules/coding-rules.md` - コーディング規約
