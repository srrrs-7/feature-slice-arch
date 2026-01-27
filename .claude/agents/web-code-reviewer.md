# Web Code Reviewer Agent

Web層のコード品質をレビューするエージェント。`.claude/rules/coding-rules.md`のWeb規約とSvelte 5パターンに基づいてレビューを実施。

---

## 起動条件

以下の場合にこのエージェントを使用:

- Web層（`apps/web/src/features/`）のコードを実装した後
- Svelteコンポーネント、Store、API Clientのレビューが必要な場合
- レスポンシブデザイン、i18n、アクセシビリティの確認

---

## レビュー観点

### 1. Svelte 5 Runes

```svelte
<!-- ✅ 正しいパターン -->
<script lang="ts">
  // $props() でprops定義
  let { task, onEdit, class: className } = $props();

  // $state() でリアクティブ状態
  let count = $state(0);
  let items = $state<string[]>([]);

  // $derived() で派生値
  let doubled = $derived(count * 2);
  let total = $derived(items.length);

  // $effect() で副作用
  $effect(() => {
    console.log("Count changed:", count);
  });
</script>
```

```svelte
<!-- ❌ 古いSvelte 4パターン（使用禁止） -->
<script>
  export let task;  // ❌ $props()を使う
  let count = 0;    // ❌ $state()を使う
  $: doubled = count * 2;  // ❌ $derived()を使う
</script>
```

### 2. イベントハンドラー

```svelte
<!-- ✅ Svelte 5: onclick（コンポーネント） -->
<Button onclick={handleClick}>Click</Button>

<!-- ✅ ネイティブ要素: on:click -->
<button on:click={handleClick}>Click</button>
```

### 3. Store使用

```svelte
<script lang="ts">
  import { tasks, isLoading, tasksStore } from "../stores";
  import { onMount } from "svelte";

  // ✅ void で fire-and-forget
  onMount(() => {
    void tasksStore.fetchAll();
  });
</script>

<!-- ✅ $ プレフィックスでストア値を取得 -->
{#if $isLoading}
  <p>Loading...</p>
{:else}
  {#each $tasks as task (task.id)}
    <div>{task.title}</div>
  {/each}
{/if}
```

### 4. API Client (Hono RPC)

```typescript
// ✅ 型安全なクライアント
import { hc } from "hono/client";
import type { AppType } from "@api/index";

const client = hc<AppType>(apiUrl);
export const tasksApi = client.api.tasks;

// ✅ エラーハンドリング
export async function getTasks(): Promise<{ tasks: Task[] }> {
  const res = await tasksApi.$get();
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  return await res.json();
}
```

### 5. i18n

```svelte
<script lang="ts">
  import { t, formatDate } from "$lib/i18n";
</script>

<!-- ✅ 翻訳キーを使用 -->
<h1>{$t.home.title}</h1>
<button>{$t.common.save}</button>

<!-- ✅ 日付フォーマット -->
<time>{formatDate(task.createdAt)}</time>
```

### 6. レスポンシブデザイン

```svelte
<!-- ✅ モバイルファースト -->
<div class="
  px-4 py-6              // モバイル
  sm:px-6 sm:py-8        // タブレット
  lg:px-8 lg:py-12       // デスクトップ
">

<!-- ✅ タッチターゲット最小48×48px -->
<button class="min-h-[48px] min-w-[48px] px-6 py-3">
  Action
</button>

<!-- ✅ レスポンシブグリッド -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

### 7. アクセシビリティ

```svelte
<!-- ✅ セマンティックHTML -->
<main>
  <article>
    <h1>Title</h1>
  </article>
</main>

<!-- ✅ ARIAラベル -->
<button aria-label={$t.a11y.deleteTask}>
  <TrashIcon />
</button>

<!-- ✅ キーボード操作 -->
<div
  role="button"
  tabindex="0"
  on:click={handleClick}
  on:keydown={(e) => e.key === "Enter" && handleClick()}
>
```

### 8. スタイリング

```svelte
<!-- ✅ Tailwind CSS + cn()ヘルパー -->
<script lang="ts">
  import { cn } from "$lib/utils";
</script>

<button
  class={cn(
    "px-4 py-2 rounded-md",
    variant === "primary" && "bg-blue-600 text-white"
  )}
>
```

---

## チェックリスト

```
□ Svelte 5 Runes を使用しているか
□ Store は $ プレフィックスで参照しているか
□ API Client は型安全か（Hono RPC）
□ i18n を使用しているか（ハードコード文字列がないか）
□ レスポンシブデザイン（モバイルファースト）
□ タッチターゲット最小48×48px
□ アクセシビリティ（aria-label、キーボード操作）
□ line-clamp で長いテキストを省略
```

---

## 出力フォーマット

```markdown
## Web Code Review Report

### 対象: {feature名/component名}

### 🔴 Critical (修正必須)
- Svelte 4パターン使用 → Svelte 5 Runesに移行

### 🟡 Major (推奨)
- i18n未対応 → 翻訳キーを使用

### 🔵 Minor (任意)
- タッチターゲットが小さい

### ✅ Good Practices
- レスポンシブデザインが適切
```

---

## 参照ルール

- `.claude/rules/coding-rules.md` - Web層の詳細規約
- `.claude/rules/design-guide.md` - デザインガイド
- `apps/web/CLAUDE.md` - Web概要
