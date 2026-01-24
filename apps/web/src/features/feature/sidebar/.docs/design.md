# Sidebar Feature Design Document

## Overview

アプリケーションのサイドナビゲーションコンポーネントです。Material Design Navigation Drawerパターンに基づき、主要機能へのアクセスを提供します。

## Requirements

### Functional Requirements

- **FR1**: 主要ページへのナビゲーションリンク
- **FR2**: レスポンシブ動作（デスクトップ常時表示/モバイルトグル）
- **FR3**: アクティブルートのハイライト
- **FR4**: アイコン + ラベルのナビゲーション項目
- **FR5**: グループ化されたナビゲーション（オプション）

### Non-Functional Requirements

- **NFR1**: Material Design Navigation Drawer準拠
- **NFR2**: モバイルファーストレスポンシブ
- **NFR3**: WCAG 2.1 AA準拠
- **NFR4**: スムーズなアニメーション
- **NFR5**: キーボードナビゲーション対応

## Design Principles

### Material Design: Navigation Drawer

- **Standard Drawer (Desktop)**: 画面左側に常時表示、256px幅
- **Modal Drawer (Mobile)**: オーバーレイ表示、画面の80%幅
- **Elevation**: Drawerはコンテンツより上（elevation 3）

### Responsive Strategy

- **Mobile (< 1024px)**: Modal drawer（オーバーレイ）
- **Desktop (≥ 1024px)**: Standard drawer（常時表示）

## UI/UX Design

### Desktop Layout (≥1024px)

```
┌────────────────┬────────────────────────────────────┐
│  [Logo]        │                                    │
│                │                                    │
│  🏠 Home       │  Main Content Area                │
│  📋 Tasks      │                                    │
│  ⚙️ Settings   │                                    │
│                │                                    │
│  [User Info]   │                                    │
└────────────────┴────────────────────────────────────┘
```

### Mobile Layout (<1024px) - Closed

```
┌──────────────────────────────────┐
│  [Header with Menu Button]       │
├──────────────────────────────────┤
│                                  │
│  Main Content Area               │
│  (Full Width)                    │
│                                  │
└──────────────────────────────────┘
```

### Mobile Layout - Open

```
┌──────────────┬───────────────────┐
│  [× Logo]    │ ░░░░░░░░░░░░░░░░░ │
│              │ ░ (Backdrop)  ░░░ │
│  🏠 Home     │ ░░░░░░░░░░░░░░░░░ │
│  📋 Tasks    │ ░░░░░░░░░░░░░░░░░ │
│  ⚙️ Settings │ ░░░░░░░░░░░░░░░░░ │
│              │ ░░░░░░░░░░░░░░░░░ │
│  [User Info] │ ░░░░░░░░░░░░░░░░░ │
└──────────────┴───────────────────┘
```

## Component Specifications

### AppSidebar.svelte

**Props:**
```typescript
interface Props {
  /** 現在のルートパス */
  currentPath?: string;
  /** モバイルでサイドバーが開いているか（外部制御用） */
  open?: boolean;
  /** サイドバー閉じるコールバック */
  onClose?: () => void;
}
```

**Features:**
- Responsive: lg:block (デスクトップ常時表示)
- Mobile: Modal drawer with backdrop
- 幅: w-64 (256px)
- 背景: bg-background
- Border: border-r border-border

### Sidebar Header

```svelte
<div class="flex items-center justify-between h-16 px-6 border-b border-border">
  <a href="/" class="flex items-center gap-2 text-lg font-semibold text-foreground">
    <svg class="w-6 h-6 text-primary"><!-- Logo --></svg>
    <span>Todo App</span>
  </a>
  <!-- Mobile: Close button -->
  <button
    class="lg:hidden min-h-[44px] min-w-[44px] p-2 rounded-md hover:bg-accent transition-colors"
    onclick={onClose}
    aria-label="サイドバーを閉じる"
  >
    <svg class="w-5 h-5"><!-- × Icon --></svg>
  </button>
</div>
```

### Navigation Items

```svelte
<nav class="flex-1 overflow-y-auto p-4" aria-label="サイドナビゲーション">
  <div class="space-y-1">
    <a
      href="/"
      onclick={handleNavClick}
      class="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium min-h-[44px]
             {currentPath === '/'
               ? 'bg-primary/10 text-primary'
               : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
             transition-colors"
    >
      <svg class="w-5 h-5 flex-shrink-0"><!-- Home Icon --></svg>
      <span>Home</span>
    </a>

    <a
      href="/tasks"
      onclick={handleNavClick}
      class="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium min-h-[44px]
             {currentPath === '/tasks'
               ? 'bg-primary/10 text-primary'
               : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
             transition-colors"
    >
      <svg class="w-5 h-5 flex-shrink-0"><!-- Tasks Icon --></svg>
      <span>Tasks</span>
    </a>

    <a
      href="/settings"
      onclick={handleNavClick}
      class="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium min-h-[44px]
             {currentPath === '/settings'
               ? 'bg-primary/10 text-primary'
               : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
             transition-colors"
    >
      <svg class="w-5 h-5 flex-shrink-0"><!-- Settings Icon --></svg>
      <span>Settings</span>
    </a>
  </div>
</nav>
```

**Features:**
- アクティブ項目: bg-primary/10 + text-primary
- ホバー: bg-accent
- アイコン + ラベル
- タッチターゲット: 44px以上
- モバイルクリック時にサイドバー閉じる

### Grouped Navigation (Optional)

```svelte
<nav class="flex-1 overflow-y-auto p-4">
  <!-- Main Section -->
  <div class="mb-6">
    <h3 class="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      Main
    </h3>
    <div class="space-y-1">
      <!-- Navigation items -->
    </div>
  </div>

  <!-- Settings Section -->
  <div>
    <h3 class="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      Settings
    </h3>
    <div class="space-y-1">
      <!-- Settings items -->
    </div>
  </div>
</nav>
```

### Sidebar Footer

```svelte
<div class="p-4 border-t border-border">
  <div class="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors cursor-pointer">
    <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
      U
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-foreground truncate">User Name</p>
      <p class="text-xs text-muted-foreground truncate">user@example.com</p>
    </div>
  </div>
</div>
```

### Desktop Layout

```svelte
<!-- Desktop: Always visible -->
<aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-30 bg-background border-r border-border">
  <!-- Sidebar content -->
</aside>
```

### Mobile Layout with Backdrop

```svelte
<!-- Mobile: Modal drawer -->
{#if open}
  <div
    class="fixed inset-0 z-50 lg:hidden"
    transition:fade={{ duration: 200 }}
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/50"
      onclick={onClose}
    ></div>

    <!-- Drawer -->
    <aside
      class="absolute inset-y-0 left-0 w-4/5 max-w-sm bg-background shadow-2xl flex flex-col"
      transition:fly={{ x: -300, duration: 300, easing: quintOut }}
      role="dialog"
      aria-modal="true"
      aria-label="ナビゲーションサイドバー"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Sidebar content -->
    </aside>
  </div>
{/if}
```

## Layout Integration

### Main Layout Component

```svelte
<script lang="ts">
import AppHeader from '@/features/feature/header/components/AppHeader.svelte';
import AppSidebar from '@/features/feature/sidebar/components/AppSidebar.svelte';

let sidebarOpen = $state(false);

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
}

function closeSidebar() {
  sidebarOpen = false;
}
</script>

<div class="min-h-screen bg-background">
  <!-- Header with menu button -->
  <AppHeader currentPath={$page.url.pathname} onMenuClick={toggleSidebar} />

  <!-- Sidebar -->
  <AppSidebar
    currentPath={$page.url.pathname}
    open={sidebarOpen}
    onClose={closeSidebar}
  />

  <!-- Main content with offset for desktop sidebar -->
  <main class="lg:pl-64 pt-16">
    <slot />
  </main>
</div>
```

## Color System

```typescript
bg-background       // サイドバー背景
border-border       // ボーダー
text-foreground     // 通常テキスト
text-primary        // アクティブ項目
bg-primary/10       // アクティブ背景
text-muted-foreground // 非アクティブ
hover:bg-accent     // ホバー背景
bg-black/50         // モバイルbackdrop
```

## Animation & Transitions

### Mobile Drawer Animation

```typescript
// Backdrop
fade({ duration: 200 })

// Drawer slide-in
fly({ x: -300, duration: 300, easing: quintOut })
```

### Navigation Item Hover

```css
transition-colors duration-200
hover:bg-accent
```

## Accessibility Checklist

- [x] セマンティックHTML (`<aside>`, `<nav>`)
- [x] ARIAラベル (nav, drawer)
- [x] ARIAロール (role="dialog")
- [x] ARIAステート (aria-modal="true")
- [x] キーボード操作 (Escape to close)
- [x] フォーカストラップ (モバイルdrawer)
- [x] タッチターゲット ≥44×44px
- [x] カラーコントラスト ≥4.5:1
- [x] スクリーンリーダー対応

## Responsive Breakpoints

```typescript
// Mobile-first
base:       Modal drawer (オーバーレイ)
lg (1024px): Standard drawer (常時表示)
            Main content: pl-64 offset
```

## Implementation Checklist

- [ ] AppSidebar.svelte作成
- [ ] Sidebar Header実装
- [ ] Navigation Items実装
- [ ] Sidebar Footer実装
- [ ] Desktop layout実装 (fixed sidebar)
- [ ] Mobile layout実装 (modal drawer)
- [ ] アクティブルートハイライト
- [ ] Svelteトランジション追加
- [ ] キーボード操作実装 (Escape)
- [ ] フォーカストラップ実装
- [ ] Main Layoutコンポーネント作成
- [ ] アクセシビリティテスト
- [ ] レスポンシブテスト

## Example Code

### AppSidebar.svelte

```svelte
<script lang="ts">
import { fade, fly } from 'svelte/transition';
import { quintOut } from 'svelte/easing';

interface Props {
  currentPath?: string;
  open?: boolean;
  onClose?: () => void;
}

let { currentPath = '/', open = false, onClose }: Props = $props();

function handleNavClick() {
  if (onClose) onClose();
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open) {
    if (onClose) onClose();
  }
}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Desktop: Always visible -->
<aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-30 bg-background border-r border-border">
  <!-- Header -->
  <div class="flex items-center h-16 px-6 border-b border-border">
    <a href="/" class="flex items-center gap-2 text-lg font-semibold text-foreground">
      <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
      </svg>
      <span>Todo App</span>
    </a>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 overflow-y-auto p-4" aria-label="サイドナビゲーション">
    <div class="space-y-1">
      <a
        href="/"
        class="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium min-h-[44px]
               {currentPath === '/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
               transition-colors"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
        <span>Home</span>
      </a>

      <a
        href="/tasks"
        class="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium min-h-[44px]
               {currentPath === '/tasks' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
               transition-colors"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
        </svg>
        <span>Tasks</span>
      </a>
    </div>
  </nav>

  <!-- Footer -->
  <div class="p-4 border-t border-border">
    <div class="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent transition-colors cursor-pointer">
      <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
        U
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-foreground truncate">User</p>
        <p class="text-xs text-muted-foreground truncate">user@example.com</p>
      </div>
    </div>
  </div>
</aside>

<!-- Mobile: Modal drawer -->
{#if open}
  <div
    class="fixed inset-0 z-50 lg:hidden"
    transition:fade={{ duration: 200 }}
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/50"
      onclick={onClose}
    ></div>

    <!-- Drawer -->
    <aside
      class="absolute inset-y-0 left-0 w-4/5 max-w-sm bg-background shadow-2xl flex flex-col"
      transition:fly={{ x: -300, duration: 300, easing: quintOut }}
      role="dialog"
      aria-modal="true"
      aria-label="ナビゲーションサイドバー"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header with close button -->
      <div class="flex items-center justify-between h-16 px-6 border-b border-border">
        <a href="/" class="flex items-center gap-2 text-lg font-semibold text-foreground">
          <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
          </svg>
          <span>Todo App</span>
        </a>
        <button
          class="min-h-[44px] min-w-[44px] p-2 rounded-md hover:bg-accent transition-colors"
          onclick={onClose}
          aria-label="サイドバーを閉じる"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-4">
        <!-- Same as desktop but with onclick={handleNavClick} -->
      </nav>

      <!-- Footer -->
      <!-- Same as desktop -->
    </aside>
  </div>
{/if}
```

## Performance Considerations

- **Lazy Loading**: アイコンSVGは軽量
- **CSS Transitions**: transform/opacity使用
- **Minimal Reflow**: Fixed positioningでレイアウトシフト防止
- **Scroll Performance**: `overflow-y-auto`で長いリスト対応

## Testing Checklist

### Manual Testing

- [ ] デスクトップ(1280px)でサイドバー常時表示確認
- [ ] モバイル(375px)でModal drawer動作確認
- [ ] サイドバー開閉アニメーション確認
- [ ] アクティブルートハイライト確認
- [ ] ナビゲーションリンククリック確認
- [ ] キーボード操作確認 (Tab, Enter, Escape)
- [ ] スクロール動作確認
- [ ] タッチデバイスで操作確認

### Automated Testing

- [ ] コンポーネントテスト (drawer toggle)
- [ ] アクセシビリティテスト (axe-core)
- [ ] レスポンシブテスト (Playwright)

## References

- [Material Design: Navigation Drawer](https://m3.material.io/components/navigation-drawer)
- [WCAG 2.1: Keyboard](https://www.w3.org/WAI/WCAG21/Understanding/keyboard)
- [Design Guide](/workspace/main/.claude/rules/design-guide.md)
