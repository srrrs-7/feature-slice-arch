# Review Command

コードレビューを体系的かつ効果的に実行するためのコマンド。

## 参照ルール

レビュー実行前に以下のルールファイルを必ず参照:

- **コーディング規約**: `.claude/rules/coding-rules.md`
- **テスト規約**: `.claude/rules/testing.md` (TDD含む)
- **デザインガイド**: `.claude/rules/design-guide.md`
- **セキュリティ**: `.claude/rules/security.md`
- **計画規約**: `.claude/rules/planning.md`
- **GitHub PR規約**: `.claude/rules/github-pr.md`

---

## レビューの原則

### 1. 目的を明確に

コードレビューの目的:
- **品質保証**: バグ、セキュリティ問題、ロジックエラーの発見
- **知識共有**: コードベースの理解を広める
- **一貫性**: プロジェクト標準への準拠
- **学習**: 開発者の成長支援

### 2. 建設的なフィードバック

```markdown
❌ BAD: 「このコードは間違っている」
✅ GOOD: 「このパターンは〇〇の問題を引き起こす可能性があります。代わりに△△を検討してください。理由は...」
```

### 3. 重要度を明確に

| レベル | 説明 | 対応 |
|--------|------|------|
| 🔴 Critical | セキュリティ脆弱性、データ損失リスク、重大なバグ | マージ前に必ず修正 |
| 🟡 Major | アーキテクチャ違反、テスト不足、パフォーマンス問題 | マージ前に修正推奨 |
| 🔵 Minor | コードスタイル、軽微な改善 | 可能であれば修正 |
| ⚪ Nitpick | 個人的な好み、オプション | 任意 |

---

## レビュー観点

### 1. 正確性 (Correctness)

```markdown
## チェックポイント
- [ ] コードが仕様通りに動作するか
- [ ] エッジケースが考慮されているか
- [ ] エラーハンドリングが適切か
- [ ] null/undefined の処理が適切か
- [ ] 境界値が正しく処理されているか
```

**APIコードの場合:**
```typescript
// ✅ 確認すべきパターン
// 1. ResultAsyncで適切にエラーを返しているか
taskService.getById(id).match(
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

// 2. 全てのエラーケースが網羅されているか（exhaustive switch）
```

**Webコードの場合:**
```svelte
<!-- ✅ 確認すべきパターン -->
<!-- 1. ローディング状態の処理 -->
{#if $isLoading}
  <LoadingSpinner />
{:else if $error}
  <ErrorMessage message={$error} />
{:else if $tasks.length === 0}
  <EmptyState />
{:else}
  {#each $tasks as task (task.id)}
    <TaskCard {task} />
  {/each}
{/if}

<!-- 2. オプティミスティック更新とロールバック -->
```

### 2. セキュリティ (Security)

```markdown
## OWASP Top 10 チェックリスト
- [ ] **インジェクション**: SQLインジェクション、コマンドインジェクション
- [ ] **認証の不備**: 認証バイパス、セッション管理
- [ ] **機密データの露出**: パスワード、トークン、PII
- [ ] **XXE**: XMLパース脆弱性
- [ ] **アクセス制御の不備**: 認可チェック漏れ
- [ ] **セキュリティ設定ミス**: デフォルト設定、エラー情報露出
- [ ] **XSS**: クロスサイトスクリプティング
- [ ] **安全でないデシリアライゼーション**: データ検証
- [ ] **脆弱なコンポーネント**: 依存関係の脆弱性
- [ ] **ログとモニタリング不足**: セキュリティイベントの記録
```

**確認すべきコードパターン:**

```typescript
// ❌ 危険: SQLインジェクション
const users = await prisma.$queryRaw`SELECT * FROM users WHERE name = ${userInput}`;

// ✅ 安全: パラメータ化クエリ
const users = await prisma.user.findMany({
  where: { name: userInput },
});

// ❌ 危険: パスワードのログ出力
logger.info({ email, password }, "Login attempt");

// ✅ 安全: 機密情報を除外
logger.info({ email }, "Login attempt");

// ❌ 危険: エラー詳細の露出
return c.json({ error: error.stack }, 500);

// ✅ 安全: 一般的なエラーメッセージ
return responseDBAccessError(c);
```

### 3. パフォーマンス (Performance)

```markdown
## チェックポイント
- [ ] N+1クエリ問題がないか
- [ ] 不要なデータ取得がないか
- [ ] インデックスが適切か
- [ ] メモリリークの可能性がないか
- [ ] 大量データの処理方法が適切か
```

**確認すべきコードパターン:**

```typescript
// ❌ N+1問題
const tasks = await prisma.task.findMany();
for (const task of tasks) {
  task.user = await prisma.user.findUnique({ where: { id: task.userId } });
}

// ✅ JOINで一括取得
const tasks = await prisma.task.findMany({
  include: { user: true },
});

// ❌ 不要なデータ取得
const users = await prisma.user.findMany();
const emails = users.map(u => u.email);

// ✅ 必要なフィールドのみ取得
const users = await prisma.user.findMany({
  select: { email: true },
});
```

### 4. アーキテクチャ (Architecture)

```markdown
## Feature-Sliced Architecture チェックリスト
- [ ] 層の分離が正しいか（domain ← service ← repository ← handler）
- [ ] 依存方向が正しいか（内側に向かってのみ依存）
- [ ] 公開APIが適切にエクスポートされているか
- [ ] 型定義がドメイン層にあるか
- [ ] ビジネスロジックがサービス層にあるか
```

**層の責務確認:**

| 層 | 責務 | 依存してよい層 |
|-----|------|--------------|
| Domain | 型定義、エラー型、ドメインルール | なし |
| Service | ビジネスロジック、バリデーション | Domain |
| Repository | データアクセス、Prisma操作 | Domain |
| Handler | HTTP処理、リクエスト/レスポンス | Domain, Service |

```typescript
// ❌ 違反: HandlerがRepositoryに直接依存
// handler.ts
import { taskRepository } from "./repository/repository";
const task = await taskRepository.findById(id);

// ✅ 正しい: HandlerはServiceを経由
// handler.ts
import { taskService } from "./service/service";
return taskService.getById(id).match(...);
```

### 5. コード品質 (Code Quality)

```markdown
## チェックポイント
- [ ] 命名が明確で一貫しているか
- [ ] 関数が単一責任か
- [ ] コードの重複がないか
- [ ] 適切な抽象化レベルか
- [ ] TypeScriptの型が適切か
- [ ] コメントが必要十分か
```

**確認すべきパターン:**

```typescript
// ❌ BAD: 曖昧な命名
const d = new Date();
const res = await api.get();
const tmp = tasks.filter(t => t.s === "p");

// ✅ GOOD: 明確な命名
const now = new Date();
const response = await api.getTasks();
const pendingTasks = tasks.filter(task => task.status === "pending");

// ❌ BAD: 型の不備
const data: any = await res.json();
const items = [];

// ✅ GOOD: 明示的な型
const data: TaskResponse = await res.json();
const items: Task[] = [];

// ❌ BAD: Branded Type未使用
const taskId: string = "123";

// ✅ GOOD: Branded Type使用
const taskId: TaskId = createTaskId("123");
```

### 6. テスト (Testing)

```markdown
## チェックポイント
- [ ] 新規コードにテストがあるか
- [ ] テストがパスするか
- [ ] エッジケースがテストされているか
- [ ] テストが読みやすいか
- [ ] モック/スタブが適切か
- [ ] カバレッジが十分か（目標80%以上）
```

**確認すべきテストパターン:**

```typescript
// ✅ GOOD: テーブル駆動テスト
const testCases = [
  {
    name: "正常ケース",
    input: { title: "Test" },
    expected: { status: 201 },
  },
  {
    name: "バリデーションエラー",
    input: { title: "" },
    expected: { status: 400 },
  },
];

// ✅ GOOD: 独立したテスト
afterEach(async () => {
  await prisma.task.deleteMany();
  resetSequence();
});

// ❌ BAD: テスト間で状態を共有
let sharedTask: Task;
beforeAll(async () => {
  sharedTask = await TaskFactory.create();
});
```

### 7. デザイン・UI (Design/UI)

**Webコンポーネントの場合:**

```markdown
## チェックポイント
- [ ] レスポンシブデザイン（モバイルファースト）
- [ ] タッチターゲット（最小44×44px）
- [ ] アクセシビリティ（WCAG 2.1 AA）
- [ ] セマンティックHTML
- [ ] ARIAラベル
- [ ] キーボード操作
- [ ] カラーコントラスト（4.5:1以上）
- [ ] ローディング/エラー/空状態
```

**確認すべきパターン:**

```svelte
<!-- ❌ BAD: アクセシビリティ不足 -->
<div on:click={handleDelete}>
  <svg>...</svg>
</div>

<!-- ✅ GOOD: アクセシビリティ対応 -->
<button
  onclick={handleDelete}
  aria-label={$t.a11y.deleteTask}
  class="min-h-[44px] min-w-[44px]"
>
  <svg aria-hidden="true">...</svg>
</button>

<!-- ❌ BAD: レスポンシブ未対応 -->
<div class="px-8 text-4xl">Title</div>

<!-- ✅ GOOD: モバイルファースト -->
<div class="px-4 sm:px-6 lg:px-8 text-2xl sm:text-3xl lg:text-4xl">Title</div>
```

---

## レビュー実行手順

### Step 1: 変更内容の把握

```bash
# 変更ファイル一覧
git diff --name-only main

# 変更統計
git diff --stat main

# 変更内容確認
git diff main
```

### Step 2: 全体像の理解

- **目的**: このPR/変更は何を達成しようとしているか
- **範囲**: 影響を受けるファイル/機能は何か
- **リスク**: 潜在的なリスクは何か

### Step 3: 層別レビュー

#### API変更の場合:
1. **Domain層**: 型定義、エラー型
2. **Service層**: ビジネスロジック、バリデーション
3. **Repository層**: データアクセス
4. **Handler層**: HTTP処理
5. **テスト**: カバレッジ、品質

#### Web変更の場合:
1. **Types**: 型定義
2. **API**: Hono RPCクライアント
3. **Stores**: 状態管理
4. **Components**: UIコンポーネント
5. **Pages**: ページコンポーネント

### Step 4: 自動チェック実行

```bash
# 型チェック
bun run check:type

# Lint/Format
bun run check:biome

# テスト
bun run test:run

# スペルチェック
bun run check:spell
```

### Step 5: レビューレポート作成

---

## レビューレポート形式

```markdown
# Code Review: [PR/変更タイトル]

## 📊 概要

| 項目 | 状態 |
|------|------|
| 正確性 | ✅ / ⚠️ / ❌ |
| セキュリティ | ✅ / ⚠️ / ❌ |
| パフォーマンス | ✅ / ⚠️ / ❌ |
| アーキテクチャ | ✅ / ⚠️ / ❌ |
| コード品質 | ✅ / ⚠️ / ❌ |
| テスト | ✅ / ⚠️ / ❌ |
| デザイン/UI | ✅ / ⚠️ / ❌ (該当する場合) |

**総合評価**: [Approve / Request Changes / Comment]

---

## 🔴 Critical Issues (必須修正)

### Issue 1: [タイトル]
- **ファイル**: `path/to/file.ts:42-48`
- **カテゴリ**: Security / Bug / Architecture
- **問題**:
  ```typescript
  // 現在のコード
  const data = await fetch(url);
  ```
- **リスク**: [影響の説明]
- **修正案**:
  ```typescript
  // 推奨するコード
  const data = await fetch(url, { timeout: 5000 });
  ```

---

## 🟡 Major Issues (推奨修正)

### Issue 1: [タイトル]
- **ファイル**: `path/to/file.ts:100`
- **カテゴリ**: Performance / Testing / Code Quality
- **問題**: [説明]
- **提案**: [改善案]

---

## 🔵 Minor Issues (可能であれば修正)

### Issue 1: [タイトル]
- **ファイル**: `path/to/file.ts:150`
- **提案**: [改善案]

---

## ⚪ Nitpicks (任意)

- `file.ts:200` - [コメント]
- `file.ts:210` - [コメント]

---

## ✅ Good Practices (良い点)

- **パターン適用**: [良かった点の説明]
- **テスト**: [テストが充実している点]
- **可読性**: [読みやすいコードの例]

---

## 📝 追加コメント

[全体的なフィードバック、提案、質問など]

---

## チェックリスト確認

### 自動チェック
- [ ] `bun run check:type` パス
- [ ] `bun run check:biome` パス
- [ ] `bun run test:run` パス
- [ ] `bun run check:spell` パス

### 手動チェック
- [ ] 機能が仕様通り動作
- [ ] エッジケースが考慮されている
- [ ] セキュリティ問題なし
- [ ] パフォーマンス問題なし
```

---

## プロジェクト固有のチェックリスト

### API (Hono + Prisma)

```markdown
## neverthrow
- [ ] ResultAsync/Resultを返しているか
- [ ] エラー型が適切に定義されているか
- [ ] switchで全エラーケースを網羅しているか
- [ ] wrapAsyncWithLogを使用しているか

## Prisma
- [ ] findUniqueでnullを適切に処理しているか
- [ ] updateでP2025エラーを処理しているか
- [ ] トランザクションが必要な箇所で使用しているか
- [ ] selectで必要なフィールドのみ取得しているか

## Zod
- [ ] trim()を使用しているか
- [ ] 適切なエラーメッセージがあるか
- [ ] transformで正規化しているか

## Handler
- [ ] zValidatorを使用しているか
- [ ] responseOk/responseNotFoundなどヘルパーを使用しているか
- [ ] エラーハンドリングが網羅的か
```

### Web (Svelte 5)

```markdown
## Runes
- [ ] $props()でpropsを受け取っているか
- [ ] $state()で状態を定義しているか
- [ ] $derived()で派生値を定義しているか
- [ ] $effect()の依存関係が適切か

## イベント
- [ ] コンポーネントはonclick（not on:click）を使用しているか
- [ ] ネイティブ要素はon:clickを使用しているか

## Store
- [ ] $プレフィックスでストア値にアクセスしているか
- [ ] オプティミスティック更新とロールバックがあるか

## i18n
- [ ] ハードコードされた文字列がないか
- [ ] $t.xxx で翻訳を使用しているか
- [ ] formatDate/formatTimeを使用しているか
```

---

## レビューのベストプラクティス

### 1. 早期かつ頻繁にレビュー

```markdown
❌ BAD: 1000行の巨大なPRを一度にレビュー
✅ GOOD: 小さなPRを頻繁にレビュー
```

### 2. コードではなく変更をレビュー

```markdown
❌ BAD: 既存コードの問題を指摘し続ける
✅ GOOD: この変更による影響にフォーカス
```

### 3. 質問を活用

```markdown
✅ GOOD:
- 「この実装を選んだ理由を教えてください」
- 「このエッジケースはどうなりますか？」
- 「将来この機能が拡張される場合、どう対応しますか？」
```

### 4. 具体的なフィードバック

```markdown
❌ BAD: 「このコードは改善が必要」
✅ GOOD: 「この関数は50行を超えています。validateInput()とprocessData()に分割することを提案します」
```

### 5. ポジティブなフィードバックも含める

```markdown
✅ GOOD:
- 「このエラーハンドリングパターンは素晴らしいです」
- 「テストケースが網羅的で良いですね」
- 「読みやすい命名です」
```

---

## 使用例

```bash
# 特定のPRをレビュー
/review PR#123

# 特定のファイルをレビュー
/review apps/api/src/features/tasks/handler.ts

# 特定の観点でレビュー
/review --focus=security apps/api/src/features/auth

# 変更差分をレビュー
/review --diff main..feature-branch

# 全体的なコードレビュー
/review apps/api/src/features/attendance
```

---

## 関連エージェント

より専門的なレビューが必要な場合:

- **セキュリティレビュー**: `pjt-security-code-reviewer` エージェント
- **デザインレビュー**: `design-reviewer` エージェント
