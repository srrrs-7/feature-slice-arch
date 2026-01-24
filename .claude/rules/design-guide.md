# Design Guide

このドキュメントではGoogleのデザインベストプラクティスとMaterial Designの原則に基づいたUI/UX設計規約を定義します。

## デザイン原則

### 1. Material Design の3つの基本原則

#### Material is the Metaphor (物理的なメタファー)
- **現実世界の物理法則を尊重**: 光、影、奥行きを使って階層を表現
- **視覚的な一貫性**: カードやボタンは明確な境界を持つ
- **アニメーションは自然**: オブジェクトの動きは物理的に自然

#### Bold, Graphic, Intentional (大胆、グラフィカル、意図的)
- **意味のあるコントラスト**: 重要な要素を強調
- **明確なタイポグラフィ**: 階層が一目でわかる
- **目的のある色使い**: 色は意図を伝える

#### Motion Provides Meaning (動きが意味を提供)
- **フィードバックとガイダンス**: アニメーションはユーザーをガイド
- **スムーズな遷移**: 状態変化は滑らか
- **関係性を示す**: 要素間の関係をモーションで表現

---

## レスポンシブデザイン

### ブレークポイント

Tailwind CSSのデフォルトブレークポイントを使用：

```typescript
// tailwind.config.js
export default {
  theme: {
    screens: {
      'sm': '640px',   // モバイル（大）
      'md': '768px',   // タブレット
      'lg': '1024px',  // デスクトップ（小）
      'xl': '1280px',  // デスクトップ（大）
      '2xl': '1536px', // ワイドスクリーン
    },
  },
};
```

### モバイルファースト設計

```svelte
<!-- ✅ GOOD: モバイルファーストで設計 -->
<div class="
  px-4 py-6                    // モバイル: 小さいpadding
  sm:px-6 sm:py-8              // タブレット: 中程度
  lg:px-8 lg:py-12             // デスクトップ: 大きい
  max-w-screen-2xl mx-auto     // 最大幅を制限
">
  <h1 class="
    text-2xl                   // モバイル: 小さい見出し
    sm:text-3xl                // タブレット
    lg:text-4xl                // デスクトップ: 大きい見出し
    font-bold
  ">
    ページタイトル
  </h1>
</div>

<!-- ❌ BAD: デスクトップファーストで設計 -->
<div class="px-8 py-12 lg:px-4 lg:py-6">
  <h1 class="text-4xl lg:text-2xl">ページタイトル</h1>
</div>
```

### レスポンシブグリッド

```svelte
<!-- ✅ GOOD: レスポンシブグリッド -->
<div class="
  grid
  grid-cols-1           // モバイル: 1列
  sm:grid-cols-2        // タブレット: 2列
  lg:grid-cols-3        // デスクトップ: 3列
  xl:grid-cols-4        // ワイド: 4列
  gap-4                 // アイテム間の余白
  sm:gap-6
  lg:gap-8
">
  {#each items as item}
    <div class="...">
      {item.title}
    </div>
  {/each}
</div>
```

### タッチターゲットサイズ

**Googleのガイドライン: 最小44×44px（Material Designでは48×48px推奨）**

```svelte
<!-- ✅ GOOD: 十分なタッチターゲット -->
<button class="
  min-h-[44px] min-w-[44px]  // 最小サイズ確保
  px-6 py-3                   // 視覚的なpadding
  text-base                   // 読みやすいテキストサイズ
  rounded-md
  bg-blue-600 text-white
  hover:bg-blue-700
  active:bg-blue-800
  transition-colors
">
  アクション
</button>

<!-- ❌ BAD: タッチターゲットが小さすぎる -->
<button class="px-2 py-1 text-xs">
  アクション
</button>
```

### レスポンシブタイポグラフィ

**フォントサイズはモバイルファーストで段階的に拡大:**

```svelte
<!-- ✅ GOOD: レスポンシブなフォントサイズ -->

<!-- ページタイトル -->
<h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold">
  ページタイトル
</h1>

<!-- セクションタイトル -->
<h2 class="text-xl sm:text-2xl lg:text-3xl font-semibold">
  セクションタイトル
</h2>

<!-- 本文 -->
<p class="text-sm sm:text-base text-muted-foreground">
  本文テキスト
</p>

<!-- 大きな表示（時計など） -->
<time class="text-4xl sm:text-5xl lg:text-6xl font-mono tabular-nums">
  12:34:56
</time>

<!-- ❌ BAD: 固定サイズ -->
<h1 class="text-4xl">すべての画面で同じサイズ</h1>
```

### レスポンシブスペーシング

**余白もモバイルファーストで段階的に拡大:**

```svelte
<!-- ✅ GOOD: レスポンシブなスペーシング -->

<!-- コンテナのパディング -->
<div class="px-3 sm:px-4 md:px-6 lg:px-8">
  コンテンツ
</div>

<!-- セクション間の余白 -->
<section class="py-4 sm:py-6 lg:py-8">
  セクション
</section>

<!-- 要素間のギャップ -->
<div class="space-y-4 sm:space-y-6 lg:space-y-8">
  <div>アイテム1</div>
  <div>アイテム2</div>
</div>

<!-- マージン -->
<div class="mb-4 sm:mb-6 lg:mb-8">
  下に余白
</div>

<!-- ❌ BAD: 固定スペーシング -->
<div class="px-8 py-12">モバイルで余白が大きすぎる</div>
```

### レスポンシブレイアウトパターン

**Flexbox方向の切り替え:**

```svelte
<!-- ✅ GOOD: モバイルは縦並び、デスクトップは横並び -->
<div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
  <button class="min-w-full sm:min-w-[140px]">アクション1</button>
  <button class="min-w-full sm:min-w-[140px]">アクション2</button>
</div>

<!-- ✅ GOOD: レスポンシブなグリッド列数 -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {#each items as item}
    <Card>{item.title}</Card>
  {/each}
</div>

<!-- ✅ GOOD: タブの列数調整 -->
<Tabs.List class="grid grid-cols-2 sm:grid-cols-4 gap-1">
  <Tabs.Trigger value="all">All</Tabs.Trigger>
  <Tabs.Trigger value="pending">Pending</Tabs.Trigger>
  <Tabs.Trigger value="progress">Progress</Tabs.Trigger>
  <Tabs.Trigger value="done">Done</Tabs.Trigger>
</Tabs.List>
```

### レスポンシブコンポーネントパターン

**ボタンのレスポンシブ化:**

```svelte
<!-- ✅ GOOD: モバイルでフル幅、デスクトップで適切なサイズ -->
<Button
  class="
    min-h-[48px] sm:min-h-[52px]
    min-w-full sm:min-w-[140px]
    text-base sm:text-lg
    font-semibold
  "
>
  アクション
</Button>
```

**カードのレスポンシブ化:**

```svelte
<!-- ✅ GOOD: レスポンシブなカードパディングとフォントサイズ -->
<Card class="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]">
  <Card.Header class="p-4 sm:p-6">
    <Card.Title class="text-base sm:text-lg line-clamp-2">
      {task.title}
    </Card.Title>
    <Card.Description class="mt-1 text-xs sm:text-sm line-clamp-2">
      {task.description}
    </Card.Description>
  </Card.Header>
  <Card.Content class="p-4 sm:p-6 pt-0 sm:pt-0">
    <Badge class="text-xs">{task.status}</Badge>
  </Card.Content>
</Card>
```

**サイドバーのレスポンシブ化:**

```svelte
<!-- ✅ GOOD: モバイルでオーバーレイ、デスクトップで固定 -->
<script lang="ts">
  let sidebarOpen = $state(false);
  let isMobile = $state(false);

  $effect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    isMobile = mediaQuery.matches;

    const handler = (e: MediaQueryListEvent) => {
      isMobile = e.matches;
      if (!e.matches) sidebarOpen = true;
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  });
</script>

<!-- モバイル: オーバーレイ背景 -->
{#if isMobile && sidebarOpen}
  <div
    class="fixed inset-0 bg-black/50 z-40 md:hidden"
    onclick={() => (sidebarOpen = false)}
  ></div>
{/if}

<!-- サイドバー -->
<aside class="
  {isMobile ? 'fixed z-50' : 'relative'}
  {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  transition-transform duration-300
  w-64 h-full bg-background border-r
">
  サイドバーコンテンツ
</aside>
```

### テキストの省略（line-clamp）

```svelte
<!-- ✅ GOOD: 長いテキストを省略して表示 -->
<h3 class="line-clamp-2">
  非常に長いタイトルが複数行にわたる場合、2行で省略されます...
</h3>

<p class="line-clamp-3 text-sm text-muted-foreground">
  説明文は3行で省略。詳細は詳細ページで確認できます...
</p>

<!-- Tailwind CSS line-clamp クラス -->
<!-- line-clamp-1: 1行で省略 -->
<!-- line-clamp-2: 2行で省略 -->
<!-- line-clamp-3: 3行で省略 -->
<!-- line-clamp-none: 省略なし -->
```

### タッチフィードバック

```svelte
<!-- ✅ GOOD: タッチ操作時の視覚的フィードバック -->
<Card class="
  cursor-pointer
  hover:shadow-md
  transition-shadow
  active:scale-[0.99]  /* タップ時に少し縮む */
">
  タップ可能なカード
</Card>

<button class="
  transition-all duration-150
  hover:bg-accent
  active:scale-95      /* タップ時に縮む */
  active:bg-accent/80
">
  タップ可能なボタン
</button>
```

### レスポンシブデザインのベストプラクティス

```markdown
## チェックリスト

### 必須
- [ ] モバイルファーストで実装（sm: → md: → lg: → xl:）
- [ ] タッチターゲット最小48×48px
- [ ] フォントサイズがレスポンシブ
- [ ] スペーシングがレスポンシブ
- [ ] 長いテキストにline-clamp

### 推奨
- [ ] flexbox方向の切り替え（flex-col sm:flex-row）
- [ ] グリッド列数の調整
- [ ] タッチフィードバック（active:scale-*）
- [ ] サイドバーのモバイル対応

### 避けるべき
- ❌ デスクトップファーストの設計
- ❌ 固定幅/高さの多用
- ❌ 小さすぎるタッチターゲット
- ❌ モバイルでの横スクロール
```

---

## アクセシビリティ

### 1. セマンティックHTML

```svelte
<!-- ✅ GOOD: セマンティックなマークアップ -->
<header>
  <nav aria-label="メインナビゲーション">
    <ul>
      <li><a href="/">ホーム</a></li>
      <li><a href="/tasks">タスク</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>記事タイトル</h1>
    <p>本文...</p>
  </article>
</main>

<footer>
  <p>&copy; 2026 Company</p>
</footer>

<!-- ❌ BAD: divとspanのみ -->
<div class="header">
  <div class="nav">
    <div class="link">ホーム</div>
  </div>
</div>
```

### 2. カラーコントラスト

**WCAG 2.1 AA基準: 4.5:1以上（通常テキスト）、3:1以上（大きいテキスト）**

```svelte
<!-- ✅ GOOD: 十分なコントラスト -->
<div class="bg-white text-gray-900">
  <!-- コントラスト比: 21:1 -->
  通常のテキスト
</div>

<div class="bg-blue-600 text-white">
  <!-- コントラスト比: 8.59:1 -->
  アクションボタン
</div>

<!-- ⚠️ WARNING: コントラスト不足 -->
<div class="bg-gray-100 text-gray-300">
  <!-- コントラスト比: 2.5:1（WCAG AA基準を満たさない） -->
  薄すぎるテキスト
</div>

<!-- ✅ GOOD: エラーメッセージは色だけに頼らない -->
<div class="text-red-600 flex items-center gap-2">
  <svg><!-- エラーアイコン --></svg>
  <span>エラー: 入力が無効です</span>
</div>
```

### 3. キーボード操作

```svelte
<script lang="ts">
  function handleKeydown(event: KeyboardEvent) {
    // Enterキーでアクション実行
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleAction();
    }

    // Escapeキーでモーダル閉じる
    if (event.key === "Escape") {
      closeModal();
    }
  }
</script>

<!-- ✅ GOOD: キーボード操作可能 -->
<button
  on:click={handleAction}
  on:keydown={handleKeydown}
  aria-label="タスクを削除"
>
  削除
</button>

<!-- インタラクティブな要素にtabindex -->
<div
  role="button"
  tabindex="0"
  on:click={handleAction}
  on:keydown={handleKeydown}
>
  クリック可能な要素
</div>

<!-- ❌ BAD: キーボード操作不可 -->
<div on:click={handleAction}>
  <!-- tabindexなし、roleなし -->
  クリック可能な要素
</div>
```

### 4. ARIAラベル

```svelte
<!-- ✅ GOOD: 明確なARIAラベル -->
<button aria-label="タスク「買い物」を削除">
  <svg><!-- ゴミ箱アイコン --></svg>
</button>

<input
  type="search"
  aria-label="タスクを検索"
  placeholder="検索..."
/>

<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  {#if $isLoading}
    読み込み中...
  {:else if $error}
    エラー: {$error}
  {/if}
</div>

<!-- フォームのエラーメッセージ -->
<div>
  <label for="title">タイトル</label>
  <input
    id="title"
    type="text"
    aria-invalid={!!titleError}
    aria-describedby={titleError ? "title-error" : undefined}
  />
  {#if titleError}
    <p id="title-error" class="text-red-600 text-sm mt-1">
      {titleError}
    </p>
  {/if}
</div>
```

### 5. フォーカス管理

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  let modalOpen = false;
  let modalElement: HTMLElement;
  let previousFocusedElement: HTMLElement;

  function openModal() {
    previousFocusedElement = document.activeElement as HTMLElement;
    modalOpen = true;

    // モーダル内の最初のフォーカス可能要素にフォーカス
    setTimeout(() => {
      const firstFocusable = modalElement.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }, 0);
  }

  function closeModal() {
    modalOpen = false;
    // 前にフォーカスしていた要素に戻す
    previousFocusedElement?.focus();
  }
</script>

<!-- ✅ GOOD: フォーカストラップ -->
{#if modalOpen}
  <div
    bind:this={modalElement}
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    on:keydown={(e) => e.key === "Escape" && closeModal()}
  >
    <div class="bg-white rounded-lg p-6 max-w-md">
      <h2 id="modal-title">モーダルタイトル</h2>
      <button on:click={closeModal}>閉じる</button>
    </div>
  </div>
{/if}
```

---

## カラーシステム

### プライマリーカラー

```typescript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // プライマリー（アクション、リンク）
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // メイン
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // セカンダリー（補助的なアクション）
        secondary: {
          500: '#6366f1',  // Indigo
        },
        // セマンティックカラー
        success: {
          500: '#10b981',  // Green
        },
        warning: {
          500: '#f59e0b',  // Amber
        },
        error: {
          500: '#ef4444',  // Red
        },
        info: {
          500: '#3b82f6',  // Blue
        },
      },
    },
  },
};
```

### カラー使用例

```svelte
<!-- ✅ GOOD: セマンティックな色使い -->

<!-- プライマリーアクション -->
<button class="bg-primary-600 hover:bg-primary-700 text-white">
  保存
</button>

<!-- セカンダリーアクション -->
<button class="bg-gray-200 hover:bg-gray-300 text-gray-900">
  キャンセル
</button>

<!-- 成功メッセージ -->
<div class="bg-success-50 border border-success-200 text-success-800 p-4 rounded-md">
  <p class="flex items-center gap-2">
    <svg class="text-success-500"><!-- チェックアイコン --></svg>
    保存しました
  </p>
</div>

<!-- エラーメッセージ -->
<div class="bg-error-50 border border-error-200 text-error-800 p-4 rounded-md">
  <p class="flex items-center gap-2">
    <svg class="text-error-500"><!-- エラーアイコン --></svg>
    エラーが発生しました
  </p>
</div>

<!-- 警告メッセージ -->
<div class="bg-warning-50 border border-warning-200 text-warning-800 p-4 rounded-md">
  <p class="flex items-center gap-2">
    <svg class="text-warning-500"><!-- 警告アイコン --></svg>
    注意が必要です
  </p>
</div>
```

---

## タイポグラフィ

### フォントスケール

```typescript
// tailwind.config.js
export default {
  theme: {
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
      'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
      'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
      '5xl': ['3rem', { lineHeight: '1' }],           // 48px
    },
  },
};
```

### 階層的なタイポグラフィ

```svelte
<!-- ✅ GOOD: 明確な階層 -->
<article class="prose prose-lg max-w-none">
  <!-- ページタイトル（H1） -->
  <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
    ページタイトル
  </h1>

  <!-- セクションタイトル（H2） -->
  <h2 class="text-3xl sm:text-4xl font-semibold text-gray-900 mt-8 mb-3">
    セクションタイトル
  </h2>

  <!-- サブセクション（H3） -->
  <h3 class="text-2xl sm:text-3xl font-semibold text-gray-900 mt-6 mb-2">
    サブセクション
  </h3>

  <!-- 本文 -->
  <p class="text-base text-gray-700 leading-relaxed mb-4">
    本文のテキストです。読みやすい行間とフォントサイズを設定します。
  </p>

  <!-- キャプション -->
  <p class="text-sm text-gray-600 mt-2">
    補足説明やキャプション
  </p>

  <!-- ラベル -->
  <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">
    ラベル
  </span>
</article>
```

### フォントウェイト

```svelte
<!-- ✅ GOOD: 適切なフォントウェイト -->

<!-- 強調（見出し） -->
<h1 class="font-bold">タイトル</h1>          <!-- 700 -->
<h2 class="font-semibold">サブタイトル</h2>  <!-- 600 -->

<!-- 通常（本文） -->
<p class="font-normal">本文テキスト</p>      <!-- 400 -->

<!-- 控えめ（補足） -->
<span class="font-light text-gray-600">補足情報</span>  <!-- 300 -->

<!-- ❌ BAD: 意味のない太字の乱用 -->
<p class="font-bold">すべてが太字で強調されると、何も強調されていない</p>
```

---

## レイアウト

### スペーシングシステム

**8pxグリッドシステム（Material Designの基本）**

```svelte
<!-- ✅ GOOD: 8pxの倍数でスペーシング -->
<div class="p-4">    <!-- 16px -->
  <div class="mb-6"> <!-- 24px -->
    <h2 class="mb-2">タイトル</h2> <!-- 8px -->
    <p class="mb-4">説明</p>        <!-- 16px -->
  </div>

  <div class="space-y-4"> <!-- 子要素間に16pxの余白 -->
    <div>アイテム1</div>
    <div>アイテム2</div>
    <div>アイテム3</div>
  </div>
</div>

<!-- Tailwindのスペーシングスケール -->
<!-- p-1 = 4px, p-2 = 8px, p-3 = 12px, p-4 = 16px, p-6 = 24px, p-8 = 32px -->
```

### カードレイアウト

```svelte
<!-- ✅ GOOD: Material Designのカード -->
<div class="
  bg-white
  rounded-lg
  shadow-md          /* Elevation 2 */
  hover:shadow-lg    /* Elevation 4 on hover */
  transition-shadow
  overflow-hidden
">
  <!-- カードヘッダー -->
  <div class="p-6 border-b border-gray-200">
    <h3 class="text-xl font-semibold text-gray-900">カードタイトル</h3>
    <p class="text-sm text-gray-600 mt-1">サブタイトル</p>
  </div>

  <!-- カードコンテンツ -->
  <div class="p-6">
    <p class="text-gray-700">
      カードの本文コンテンツ
    </p>
  </div>

  <!-- カードアクション -->
  <div class="px-6 py-4 bg-gray-50 flex justify-end gap-2">
    <button class="text-gray-600 hover:text-gray-900">キャンセル</button>
    <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
      アクション
    </button>
  </div>
</div>
```

### エレベーション（影）

```css
/* Material Designのエレベーションレベル */
.elevation-0  { box-shadow: none; }
.elevation-1  { box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); }
.elevation-2  { box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23); }
.elevation-3  { box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23); }
.elevation-4  { box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22); }
.elevation-5  { box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22); }
```

```svelte
<!-- ✅ GOOD: エレベーションの使い分け -->

<!-- カード: elevation-2 -->
<div class="shadow-md">カード</div>

<!-- ホバー時: elevation-4 -->
<div class="shadow-md hover:shadow-lg transition-shadow">
  ホバー可能なカード
</div>

<!-- モーダル: elevation-5 -->
<div class="shadow-2xl">モーダル</div>

<!-- フラットな要素: elevation-0 -->
<div class="shadow-none">フラット</div>
```

---

## コンポーネント設計

### ボタンバリエーション

```svelte
<script lang="ts">
  import { cn } from "$lib/utils";

  export let variant: "primary" | "secondary" | "outline" | "ghost" | "danger" = "primary";
  export let size: "sm" | "md" | "lg" = "md";
  export let disabled = false;

  const baseClasses = "font-medium rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-blue-600 disabled:bg-blue-300",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 focus-visible:outline-gray-400 disabled:bg-gray-100",
    outline: "border-2 border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-gray-400",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:outline-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:outline-red-600 disabled:bg-red-300",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm min-h-[36px]",
    md: "px-4 py-2 text-base min-h-[44px]",
    lg: "px-6 py-3 text-lg min-h-[52px]",
  };
</script>

<button
  class={cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled && "cursor-not-allowed opacity-50"
  )}
  {disabled}
  on:click
>
  <slot />
</button>
```

**使用例:**

```svelte
<!-- ✅ GOOD: 適切なボタンバリエーション -->
<Button variant="primary">保存</Button>
<Button variant="secondary">キャンセル</Button>
<Button variant="outline">詳細</Button>
<Button variant="ghost">編集</Button>
<Button variant="danger">削除</Button>

<Button size="sm">小</Button>
<Button size="md">中</Button>
<Button size="lg">大</Button>

<Button disabled>無効化</Button>
```

### インプットフィールド

```svelte
<script lang="ts">
  export let id: string;
  export let label: string;
  export let value: string;
  export let error: string | null = null;
  export let helperText: string | null = null;
  export let required = false;
  export let disabled = false;
</script>

<div class="w-full">
  <!-- ラベル -->
  <label
    for={id}
    class="block text-sm font-medium text-gray-900 mb-1"
  >
    {label}
    {#if required}
      <span class="text-red-500" aria-label="必須">*</span>
    {/if}
  </label>

  <!-- インプット -->
  <input
    {id}
    bind:value
    {disabled}
    aria-invalid={!!error}
    aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
    class="
      w-full px-4 py-2 text-base
      border rounded-md
      {error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
      focus:outline-none focus:ring-2
      disabled:bg-gray-100 disabled:cursor-not-allowed
      transition-colors
    "
    on:input
    on:blur
    on:focus
  />

  <!-- エラーメッセージ -->
  {#if error}
    <p id="{id}-error" class="mt-1 text-sm text-red-600 flex items-center gap-1">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      {error}
    </p>
  {/if}

  <!-- ヘルパーテキスト -->
  {#if helperText && !error}
    <p id="{id}-helper" class="mt-1 text-sm text-gray-600">
      {helperText}
    </p>
  {/if}
</div>
```

### ローディングインジケーター

```svelte
<!-- ✅ GOOD: Material Designスタイルのスピナー -->
<div
  role="status"
  aria-live="polite"
  aria-label="読み込み中"
  class="inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent h-8 w-8 text-blue-600"
></div>

<!-- スケルトンローディング -->
<div class="animate-pulse space-y-4">
  <div class="h-4 bg-gray-200 rounded w-3/4"></div>
  <div class="h-4 bg-gray-200 rounded w-1/2"></div>
  <div class="h-4 bg-gray-200 rounded w-5/6"></div>
</div>

<!-- プログレスバー -->
<div class="w-full bg-gray-200 rounded-full h-2">
  <div
    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
    style="width: {progress}%"
    role="progressbar"
    aria-valuenow={progress}
    aria-valuemin={0}
    aria-valuemax={100}
  ></div>
</div>
```

---

## アニメーション

### トランジション

```svelte
<script lang="ts">
  import { fade, fly, slide, scale } from "svelte/transition";
  import { quintOut } from "svelte/easing";
</script>

<!-- ✅ GOOD: 適切なトランジション -->

<!-- フェードイン/アウト（汎用） -->
<div transition:fade={{ duration: 200 }}>
  コンテンツ
</div>

<!-- スライド（モーダル、サイドバー） -->
<div transition:slide={{ duration: 300, easing: quintOut }}>
  サイドバー
</div>

<!-- フライイン（通知、トースト） -->
<div transition:fly={{ y: -20, duration: 300, easing: quintOut }}>
  通知メッセージ
</div>

<!-- スケール（ポップアップ、ドロップダウン） -->
<div transition:scale={{ start: 0.95, duration: 200, easing: quintOut }}>
  ドロップダウンメニュー
</div>
```

### ホバーアニメーション

```svelte
<!-- ✅ GOOD: スムーズなホバー効果 -->
<button class="
  transform transition-all duration-200 ease-out
  hover:scale-105
  hover:shadow-lg
  active:scale-95
">
  ボタン
</button>

<div class="
  transition-colors duration-200
  hover:bg-blue-50
">
  ホバー可能なカード
</div>

<!-- リップル効果（Material Design） -->
<button class="
  relative overflow-hidden
  before:absolute before:inset-0
  before:bg-white before:opacity-0
  before:transition-opacity before:duration-200
  hover:before:opacity-10
  active:before:opacity-20
">
  リップルボタン
</button>
```

### パフォーマンスガイドライン

```svelte
<!-- ✅ GOOD: transform/opacityのみアニメーション -->
<div class="
  transition-transform duration-200
  hover:translate-x-1
">
  パフォーマンス良好
</div>

<!-- ❌ BAD: width/heightをアニメーション（レイアウトシフト） -->
<div class="
  transition-all duration-200
  hover:w-full
">
  パフォーマンス低下
</div>
```

**アニメーション可能なプロパティ:**
- ✅ `transform` (translate, scale, rotate)
- ✅ `opacity`
- ⚠️ `color`, `background-color` (問題ないが最適ではない)
- ❌ `width`, `height`, `margin`, `padding` (レイアウトシフトを引き起こす)

---

## エラーハンドリングとフィードバック

### エラーメッセージ

```svelte
<!-- ✅ GOOD: 具体的で実行可能なエラーメッセージ -->
<div class="bg-red-50 border border-red-200 rounded-md p-4">
  <div class="flex items-start gap-3">
    <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <!-- エラーアイコン -->
    </svg>
    <div class="flex-1">
      <h3 class="text-sm font-medium text-red-800">
        タスクの作成に失敗しました
      </h3>
      <p class="mt-1 text-sm text-red-700">
        タイトルは1文字以上200文字以下で入力してください。現在の文字数: 250文字
      </p>
      <button class="mt-2 text-sm font-medium text-red-800 underline hover:no-underline">
        もう一度試す
      </button>
    </div>
  </div>
</div>

<!-- ❌ BAD: 曖昧なエラーメッセージ -->
<div class="text-red-500">
  エラーが発生しました
</div>
```

### 成功フィードバック

```svelte
<!-- ✅ GOOD: トーストメッセージ -->
<div
  class="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-md shadow-lg flex items-center gap-3"
  transition:fly={{ y: -20, duration: 300 }}
>
  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <!-- チェックアイコン -->
  </svg>
  <span class="font-medium">タスクを保存しました</span>
  <button
    on:click={dismiss}
    aria-label="閉じる"
    class="ml-4 text-white hover:text-green-100"
  >
    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <!-- ×アイコン -->
    </svg>
  </button>
</div>
```

### 確認ダイアログ

```svelte
<!-- ✅ GOOD: 破壊的なアクションの確認 -->
<div
  role="alertdialog"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
>
  <div class="bg-white rounded-lg p-6 max-w-md shadow-2xl">
    <div class="flex items-start gap-3">
      <svg class="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <!-- 警告アイコン -->
      </svg>
      <div class="flex-1">
        <h2 id="dialog-title" class="text-lg font-semibold text-gray-900">
          タスクを削除しますか？
        </h2>
        <p id="dialog-description" class="mt-2 text-sm text-gray-600">
          この操作は取り消せません。タスク「{task.title}」を完全に削除します。
        </p>
      </div>
    </div>

    <div class="mt-6 flex justify-end gap-3">
      <button
        on:click={cancel}
        class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
      >
        キャンセル
      </button>
      <button
        on:click={confirmDelete}
        class="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md"
      >
        削除
      </button>
    </div>
  </div>
</div>
```

### 空状態（Empty State）

```svelte
<!-- ✅ GOOD: アクションを促す空状態 -->
<div class="flex flex-col items-center justify-center py-12 px-4 text-center">
  <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <!-- イラスト -->
  </svg>
  <h3 class="text-lg font-semibold text-gray-900 mb-2">
    タスクがありません
  </h3>
  <p class="text-gray-600 mb-6 max-w-sm">
    最初のタスクを作成して、やることを管理しましょう。
  </p>
  <button
    on:click={createTask}
    class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
  >
    <svg class="w-5 h-5 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
      <!-- + アイコン -->
    </svg>
    タスクを作成
  </button>
</div>
```

---

## パフォーマンス

### 画像最適化

```svelte
<!-- ✅ GOOD: レスポンシブ画像 -->
<img
  src="/images/hero-800.webp"
  srcset="
    /images/hero-400.webp 400w,
    /images/hero-800.webp 800w,
    /images/hero-1200.webp 1200w
  "
  sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
  alt="ヒーロー画像の説明"
  loading="lazy"
  class="w-full h-auto"
/>

<!-- ✅ GOOD: アイコンはSVG -->
<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
  <path d="..." />
</svg>
```

### 遅延ローディング

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  let HeavyComponent;

  onMount(async () => {
    // コンポーネントを遅延ロード
    const module = await import("./HeavyComponent.svelte");
    HeavyComponent = module.default;
  });
</script>

{#if HeavyComponent}
  <svelte:component this={HeavyComponent} />
{:else}
  <div>読み込み中...</div>
{/if}
```

### 仮想スクロール（大量データ）

```svelte
<script lang="ts">
  import { VirtualList } from "svelte-virtual-list";

  export let items: Item[];
</script>

<!-- ✅ GOOD: 1000件以上のアイテムは仮想スクロール -->
<VirtualList {items} itemHeight={60} let:item>
  <div class="px-4 py-3 border-b">
    {item.title}
  </div>
</VirtualList>
```

---

## ダークモード（オプション）

```typescript
// tailwind.config.js
export default {
  darkMode: 'class', // またはmedia
  theme: {
    extend: {
      colors: {
        // ダークモード用カラー
      },
    },
  },
};
```

```svelte
<!-- ✅ GOOD: ダークモード対応 -->
<div class="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-700
">
  コンテンツ
</div>

<button class="
  bg-blue-600 dark:bg-blue-500
  text-white
  hover:bg-blue-700 dark:hover:bg-blue-600
">
  ボタン
</button>
```

---

## 多言語対応（i18n）

このプロジェクトでは、外部ライブラリを使用せずにSvelte storeベースのシンプルなi18nシステムを実装しています。

### アーキテクチャ

```
apps/web/src/lib/i18n/
├── index.ts          # メインのi18n store とヘルパー関数
├── types.ts          # 型定義とサポート言語の設定
└── locales/
    ├── ja.ts         # 日本語翻訳
    └── en.ts         # 英語翻訳
```

### サポート言語

```typescript
// types.ts
export type Locale = "ja" | "en";

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
];

export const DEFAULT_LOCALE: Locale = "ja";
```

### 翻訳の構造

```typescript
// types.ts
export interface Translations {
  common: {
    appName: string;
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    back: string;
    // ...
  };
  nav: {
    home: string;
    tasks: string;
    stamp: string;
    settings: string;
    // ...
  };
  home: {
    title: string;
    subtitle: string;
    // ...
  };
  tasks: {
    title: string;
    createTask: string;
    // ...
  };
  // ... 他のセクション
}
```

### 翻訳ファイルの書き方

```typescript
// locales/ja.ts
import type { Translations } from "../types";

export const ja: Translations = {
  common: {
    appName: "WorkFlow",
    loading: "読み込み中...",
    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    edit: "編集",
    create: "作成",
    back: "戻る",
  },
  nav: {
    home: "ホーム",
    tasks: "タスク",
    stamp: "打刻",
    settings: "設定",
  },
  // ...
};

// locales/en.ts
import type { Translations } from "../types";

export const en: Translations = {
  common: {
    appName: "WorkFlow",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    back: "Back",
  },
  nav: {
    home: "Home",
    tasks: "Tasks",
    stamp: "Stamp",
    settings: "Settings",
  },
  // ...
};
```

### i18n Store

```typescript
// index.ts
import { writable, derived, get } from "svelte/store";
import type { Locale, Translations } from "./types";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./types";
import { ja } from "./locales/ja";
import { en } from "./locales/en";

const translations: Record<Locale, Translations> = { ja, en };

// ブラウザの言語設定から初期ロケールを決定
function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const stored = localStorage.getItem("locale") as Locale | null;
  if (stored && SUPPORTED_LOCALES.some((l) => l.code === stored)) {
    return stored;
  }

  const browserLang = navigator.language.split("-")[0];
  if (SUPPORTED_LOCALES.some((l) => l.code === browserLang)) {
    return browserLang as Locale;
  }

  return DEFAULT_LOCALE;
}

// 現在のロケール
export const locale = writable<Locale>(getInitialLocale());

// 翻訳オブジェクト（derived store）
export const t = derived(locale, ($locale) => translations[$locale]);

// ロケールを変更
export function setLocale(newLocale: Locale): void {
  locale.set(newLocale);
  if (typeof window !== "undefined") {
    localStorage.setItem("locale", newLocale);
    document.documentElement.lang = newLocale;
  }
}

// 日付フォーマット
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const currentLocale = get(locale);
  return new Intl.DateTimeFormat(currentLocale, options).format(d);
}

// 時刻フォーマット
export function formatTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const currentLocale = get(locale);
  return new Intl.DateTimeFormat(currentLocale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...options,
  }).format(d);
}
```

### コンポーネントでの使用方法

```svelte
<script lang="ts">
  import { t, locale, formatDate, formatTime } from "$lib/i18n";
</script>

<!-- 基本的な翻訳 -->
<h1>{$t.home.title}</h1>
<p>{$t.home.subtitle}</p>

<!-- ボタン -->
<button>{$t.common.save}</button>
<button>{$t.common.cancel}</button>

<!-- ナビゲーション -->
<nav>
  <a href="/">{$t.nav.home}</a>
  <a href="/tasks">{$t.nav.tasks}</a>
</nav>

<!-- 日付・時刻フォーマット -->
<time>{formatDate(task.createdAt)}</time>
<time>{formatTime(new Date())}</time>

<!-- 現在のロケールに基づくフォーマット -->
<time>
  {new Date().toLocaleString($locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}
</time>
```

### 言語切替コンポーネント

```svelte
<!-- LanguageSwitcher.svelte -->
<script lang="ts">
  import { locale, setLocale, t } from "$lib/i18n";
  import { SUPPORTED_LOCALES, type Locale } from "$lib/i18n/types";

  let { compact = false, class: className = "" } = $props();
  let isOpen = $state(false);

  const currentLocale = $derived(
    SUPPORTED_LOCALES.find((l) => l.code === $locale)
  );

  function handleSelect(code: Locale) {
    setLocale(code);
    isOpen = false;
  }
</script>

<div class="relative {className}">
  <button
    onclick={() => (isOpen = !isOpen)}
    class="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent"
    aria-label={$t.language.label}
    aria-expanded={isOpen}
  >
    <span>{currentLocale?.flag}</span>
    {#if !compact}
      <span>{currentLocale?.nativeName}</span>
    {/if}
  </button>

  {#if isOpen}
    <div class="absolute right-0 mt-2 w-40 bg-background border rounded-md shadow-lg">
      {#each SUPPORTED_LOCALES as loc}
        <button
          onclick={() => handleSelect(loc.code)}
          class="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
          class:bg-accent={loc.code === $locale}
        >
          <span>{loc.flag}</span>
          <span>{loc.nativeName}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
```

### 新しい翻訳キーの追加手順

1. **types.ts に型を追加**
```typescript
export interface Translations {
  // 既存のセクション...
  newSection: {
    newKey: string;
    anotherKey: string;
  };
}
```

2. **各言語ファイルに翻訳を追加**
```typescript
// locales/ja.ts
export const ja: Translations = {
  // ...
  newSection: {
    newKey: "新しいキー",
    anotherKey: "別のキー",
  },
};

// locales/en.ts
export const en: Translations = {
  // ...
  newSection: {
    newKey: "New Key",
    anotherKey: "Another Key",
  },
};
```

3. **コンポーネントで使用**
```svelte
<p>{$t.newSection.newKey}</p>
```

### 動的な値を含む翻訳

```typescript
// types.ts
export interface Translations {
  tasks: {
    count: string;  // "{count}件のタスク"
  };
}

// locales/ja.ts
tasks: {
  count: "{count}件のタスク",
}

// locales/en.ts
tasks: {
  count: "{count} tasks",
}
```

```svelte
<script lang="ts">
  import { t } from "$lib/i18n";

  let count = 5;

  // 簡易的な置換
  const message = $derived($t.tasks.count.replace("{count}", count.toString()));
</script>

<p>{message}</p>
```

### ベストプラクティス

#### 翻訳キーの命名規則
```typescript
// ✅ GOOD: セクション.キー形式
$t.common.save
$t.tasks.createTask
$t.errors.notFound

// ❌ BAD: フラットな構造
$t.saveButton
$t.createTaskButton
```

#### ハードコードされた文字列を避ける
```svelte
<!-- ✅ GOOD: 翻訳を使用 -->
<button>{$t.common.delete}</button>
<h1>{$t.tasks.title}</h1>

<!-- ❌ BAD: ハードコード -->
<button>削除</button>
<h1>タスク一覧</h1>
```

#### アクセシビリティラベルも翻訳
```svelte
<!-- ✅ GOOD: aria-labelも翻訳 -->
<button aria-label={$t.a11y.toggleSidebar}>
  <MenuIcon />
</button>

<!-- ❌ BAD: aria-labelがハードコード -->
<button aria-label="サイドバーを開く">
  <MenuIcon />
</button>
```

### i18nチェックリスト

#### 新機能実装時
- [ ] すべての表示文字列が翻訳キーを使用
- [ ] 日付・時刻はformatDate/formatTimeを使用
- [ ] aria-labelも翻訳を使用
- [ ] 新しいキーをすべての言語ファイルに追加
- [ ] TypeScriptの型チェックがパス

#### 新言語追加時
1. `types.ts`のSUPPORTED_LOCALESに追加
2. `locales/`に新しい言語ファイルを作成
3. `index.ts`のtranslationsに追加
4. すべてのキーを翻訳

---

## デザインチェックリスト

### 新機能実装時の確認事項

#### レスポンシブ
- [ ] モバイル（320px-640px）で動作確認
- [ ] タブレット（768px-1024px）で動作確認
- [ ] デスクトップ（1280px以上）で動作確認
- [ ] タッチターゲットが最小44×44px

#### アクセシビリティ
- [ ] キーボードで操作可能
- [ ] セマンティックHTMLを使用
- [ ] ARIAラベルが適切
- [ ] カラーコントラストがWCAG AA基準
- [ ] フォーカス状態が視覚的に明確
- [ ] スクリーンリーダーでテスト

#### カラー・タイポグラフィ
- [ ] プライマリー/セカンダリーカラーを適切に使用
- [ ] セマンティックカラー（success/error/warning）を使用
- [ ] テキスト階層が明確
- [ ] フォントサイズが読みやすい（最小14px）

#### レイアウト
- [ ] 8pxグリッドシステムに準拠
- [ ] 適切なスペーシング
- [ ] カードに影を使用（elevation）
- [ ] 最大幅を制限（max-w-*）

#### アニメーション
- [ ] トランジションが200-300ms
- [ ] transform/opacityのみアニメーション
- [ ] ホバー/アクティブ状態が明確
- [ ] ページ遷移がスムーズ

#### エラーハンドリング
- [ ] 具体的なエラーメッセージ
- [ ] 成功フィードバック
- [ ] 破壊的アクションに確認ダイアログ
- [ ] 空状態に意味のあるメッセージ

#### パフォーマンス
- [ ] 画像を最適化（WebP、適切なサイズ）
- [ ] 遅延ローディングを使用
- [ ] 大量データに仮想スクロール
- [ ] Lighthouseスコア90以上

#### 多言語対応（i18n）
- [ ] すべての表示文字列が翻訳キーを使用
- [ ] 日付・時刻はformatDate/formatTimeを使用
- [ ] aria-labelも翻訳を使用
- [ ] 新しいキーをすべての言語ファイルに追加
- [ ] TypeScriptの型チェックがパス

---

## 参考資料

### Google公式ガイドライン
- **Material Design**: https://m3.material.io/
- **Web Fundamentals**: https://developers.google.com/web/fundamentals
- **Web.dev Best Practices**: https://web.dev/learn

### アクセシビリティ
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/

### ツール
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Lighthouse**: Chrome DevTools
- **axe DevTools**: ブラウザ拡張機能
