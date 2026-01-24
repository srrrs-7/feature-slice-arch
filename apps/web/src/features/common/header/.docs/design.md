# Header Feature Design Document

## Overview

アプリケーション全体のヘッダーコンポーネントです。Material Design原則に基づき、ブランディング、ナビゲーション、ユーザーアクションを提供します。

## Requirements

### Functional Requirements

- **FR1**: アプリケーション名/ロゴの表示
- **FR2**: レスポンシブナビゲーション（デスクトップ/モバイル）
- **FR3**: モバイルメニュー開閉（ハンバーガーアイコン）
- **FR4**: アクティブルートのハイライト

### Non-Functional Requirements

- **NFR1**: Material Design Elevationレベル2（shadow-md）
- **NFR2**: モバイルファースト設計
- **NFR3**: WCAG 2.1 AA準拠
- **NFR4**: タッチターゲット最小44×44px
- **NFR5**: スムーズなアニメーション（200-300ms）

## Design Principles

### Material Design: Bold, Graphic, Intentional

- **明確な階層**: ロゴ → ナビゲーション → アクション
- **適切なコントラスト**: 背景とテキストのコントラスト比4.5:1以上
- **意図的な配色**: Primary colorでブランディング強調

### Responsive Design

- **Mobile (< 768px)**: ハンバーガーメニュー + モーダルナビゲーション
- **Tablet/Desktop (≥ 768px)**: 水平ナビゲーションバー

## UI/UX Design

### Desktop Layout (≥768px)

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] Todo App          [Home] [About]              [Profile] │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Layout (<768px)

```
┌───────────────────────────┐
│  [☰] Todo App      [⋮]   │
└───────────────────────────┘

// モバイルメニュー展開時
┌───────────────────────────┐
│  [×] Todo App      [⋮]   │
├───────────────────────────┤
│  🏠 Home                  │
│  ℹ️ About                 │
│  👤 Profile               │
└───────────────────────────┘
```

## Component Specifications

### AppHeader.svelte

**Props:**
```typescript
interface Props {
  /** 現在のルートパス */
  currentPath?: string;
}
```

**Features:**
- Sticky header (固定ヘッダー)
- Elevation 2 (shadow-md)
- 背景: bg-background
- 高さ: h-16 (64px)
- パディング: px-4 sm:px-6 lg:px-8

**Accessibility:**
- `<header>` セマンティックHTML
- `<nav aria-label="メインナビゲーション">`
- ハンバーガーボタン: `aria-label="メニューを開く"`, `aria-expanded`
- モバイルメニュー: `role="dialog"`, `aria-modal="true"`

### Logo Component

```svelte
<a href="/" class="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors">
  <svg class="w-8 h-8 text-primary"><!-- アイコン --></svg>
  <span class="hidden sm:inline">Todo App</span>
</a>
```

**Features:**
- モバイル: アイコンのみ
- デスクトップ: アイコン + テキスト
- ホバー時にprimary colorへ遷移

### Navigation Links (Desktop)

```svelte
<nav class="hidden md:flex items-center gap-1" aria-label="メインナビゲーション">
  <a
    href="/"
    class="px-4 py-2 rounded-md text-sm font-medium
           {currentPath === '/'
             ? 'bg-primary/10 text-primary'
             : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
           transition-colors"
  >
    Home
  </a>
  <!-- 他のリンク -->
</nav>
```

**Features:**
- アクティブリンク: bg-primary/10 + text-primary
- 非アクティブ: hover:bg-accent
- タッチターゲット: min-h-[44px]

### Mobile Menu Button

```svelte
<button
  onclick={toggleMenu}
  aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
  aria-expanded={menuOpen}
  class="md:hidden min-h-[44px] min-w-[44px] p-2 rounded-md
         text-foreground hover:bg-accent transition-colors"
>
  {#if menuOpen}
    <svg class="w-6 h-6"><!-- × アイコン --></svg>
  {:else}
    <svg class="w-6 h-6"><!-- ☰ アイコン --></svg>
  {/if}
</button>
```

**Features:**
- タッチターゲット: 44×44px
- ARIAラベル動的更新
- スムーズなアイコン切り替え

### Mobile Menu Overlay

```svelte
{#if menuOpen}
  <div
    class="fixed inset-0 z-50 bg-black/50 md:hidden"
    onclick={closeMenu}
    transition:fade={{ duration: 200 }}
  >
    <div
      class="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-background shadow-2xl"
      onclick={(e) => e.stopPropagation()}
      transition:fly={{ x: -300, duration: 300, easing: quintOut }}
      role="dialog"
      aria-modal="true"
      aria-label="ナビゲーションメニュー"
    >
      <!-- メニューコンテンツ -->
    </div>
  </div>
{/if}
```

**Features:**
- Backdrop: bg-black/50
- Drawer: 画面の75%、最大320px
- Elevation 5 (shadow-2xl)
- Svelteトランジション: fade + fly
- フォーカストラップ
- Escapeキーで閉じる

### Mobile Menu Content

```svelte
<nav class="flex flex-col p-6 space-y-2">
  <a
    href="/"
    onclick={closeMenu}
    class="flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium
           {currentPath === '/'
             ? 'bg-primary/10 text-primary'
             : 'text-foreground hover:bg-accent'}
           transition-colors min-h-[44px]"
  >
    <svg class="w-5 h-5"><!-- アイコン --></svg>
    Home
  </a>
  <!-- 他のリンク -->
</nav>
```

**Features:**
- 垂直レイアウト (space-y-2)
- アイコン + テキスト
- タッチターゲット: 44px以上
- クリック時にメニュー閉じる

## Color System

```typescript
// Tailwindカラー使用
bg-background       // ヘッダー背景
text-foreground     // 通常テキスト
text-primary        // アクティブリンク
bg-primary/10       // アクティブ背景
text-muted-foreground // 非アクティブリンク
hover:bg-accent     // ホバー背景
bg-black/50         // モバイルメニューbackdrop
```

## Animation & Transitions

### Menu Toggle Animation

```typescript
// ハンバーガーアイコン ⇄ ×アイコン
transition-transform duration-200

// モバイルメニュー
backdrop: fade({ duration: 200 })
drawer: fly({ x: -300, duration: 300, easing: quintOut })
```

### Link Hover

```css
transition-colors duration-200
hover:bg-accent
```

## Accessibility Checklist

- [x] セマンティックHTML (`<header>`, `<nav>`)
- [x] ARIAラベル (menu button, nav)
- [x] ARIAステート (aria-expanded, aria-modal)
- [x] キーボード操作 (Escape to close)
- [x] フォーカストラップ (モバイルメニュー)
- [x] タッチターゲット ≥44×44px
- [x] カラーコントラスト ≥4.5:1

## Responsive Breakpoints

```typescript
// Mobile-first
base:      ハンバーガーメニュー
sm (640px): ロゴテキスト表示
md (768px): 水平ナビゲーション表示
lg (1024px): パディング増加 (px-8)
```

## Implementation Checklist

- [ ] AppHeader.svelte作成
- [ ] モバイルメニュー状態管理 (let menuOpen = $state(false))
- [ ] デスクトップナビゲーション実装
- [ ] モバイルメニュー実装 (drawer + backdrop)
- [ ] ハンバーガーアイコン実装
- [ ] アクティブルートハイライト
- [ ] Svelteトランジション追加
- [ ] キーボード操作実装 (Escape)
- [ ] フォーカストラップ実装
- [ ] アクセシビリティテスト
- [ ] レスポンシブテスト (320px, 768px, 1024px)

## Example Code

### AppHeader.svelte

```svelte
<script lang="ts">
import { fade, fly } from 'svelte/transition';
import { quintOut } from 'svelte/easing';

interface Props {
  currentPath?: string;
}

let { currentPath = '/' }: Props = $props();
let menuOpen = $state(false);

function toggleMenu() {
  menuOpen = !menuOpen;
}

function closeMenu() {
  menuOpen = false;
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && menuOpen) {
    closeMenu();
  }
}
</script>

<svelte:window on:keydown={handleKeydown} />

<header class="sticky top-0 z-40 w-full bg-background shadow-md">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors">
        <svg class="w-8 h-8 text-primary"><!-- Icon --></svg>
        <span class="hidden sm:inline">Todo App</span>
      </a>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-1" aria-label="メインナビゲーション">
        <a
          href="/"
          class="px-4 py-2 rounded-md text-sm font-medium min-h-[44px] flex items-center
                 {currentPath === '/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
                 transition-colors"
        >
          Home
        </a>
      </nav>

      <!-- Mobile Menu Button -->
      <button
        onclick={toggleMenu}
        aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
        aria-expanded={menuOpen}
        class="md:hidden min-h-[44px] min-w-[44px] p-2 rounded-md text-foreground hover:bg-accent transition-colors"
      >
        {#if menuOpen}
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        {:else}
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        {/if}
      </button>
    </div>
  </div>
</header>

<!-- Mobile Menu -->
{#if menuOpen}
  <div
    class="fixed inset-0 z-50 bg-black/50 md:hidden"
    onclick={closeMenu}
    transition:fade={{ duration: 200 }}
  >
    <div
      class="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-background shadow-2xl"
      onclick={(e) => e.stopPropagation()}
      transition:fly={{ x: -300, duration: 300, easing: quintOut }}
      role="dialog"
      aria-modal="true"
      aria-label="ナビゲーションメニュー"
    >
      <nav class="flex flex-col p-6 space-y-2">
        <a
          href="/"
          onclick={closeMenu}
          class="flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium min-h-[44px]
                 {currentPath === '/' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'}
                 transition-colors"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Home
        </a>
      </nav>
    </div>
  </div>
{/if}
```

## Performance Considerations

- **Lazy Load**: メニューアイコンSVGは軽量
- **CSS Transitions**: transform/opacity使用（レイアウトシフトなし）
- **Minimal JS**: Svelte $stateでリアクティブ
- **Prefetch**: 主要ルートのプリフェッチ検討

## Testing Checklist

### Manual Testing

- [ ] デスクトップ(1280px)でナビゲーション表示確認
- [ ] タブレット(768px)でレイアウト切り替え確認
- [ ] モバイル(375px)でハンバーガーメニュー動作確認
- [ ] メニュー開閉アニメーション確認
- [ ] アクティブリンクハイライト確認
- [ ] キーボード操作確認 (Tab, Enter, Escape)
- [ ] タッチデバイスで操作確認
- [ ] スクリーンリーダーでテスト

### Automated Testing

- [ ] コンポーネントテスト (menu toggle)
- [ ] アクセシビリティテスト (axe-core)
- [ ] レスポンシブテスト (Playwright)

## References

- [Material Design: App bars](https://m3.material.io/components/top-app-bar)
- [WCAG 2.1: Navigation](https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways)
- [Design Guide](/workspace/main/.claude/rules/design-guide.md)
