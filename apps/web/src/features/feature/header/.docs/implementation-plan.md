# Header Feature Implementation Plan

このドキュメントはHeader機能の実装計画です。TDD方法論とプロジェクトガイドラインに従った段階的な実装アプローチを提供します。

**参照**: `design.md` - 詳細な設計仕様

## Implementation Overview

- **Feature Type**: New Web UI Component
- **Scope**: Frontend only (Svelte 5 + Tailwind CSS)
- **Complexity**: Medium (3-5 files)
- **TDD Approach**: Component testing with @testing-library/svelte
- **Estimated Time**: 8-12 hours

---

## Phase 0: Prerequisites

### 0.1 Verify Environment

```bash
# Check Svelte setup
cd /workspace/main/apps/web
test -f package.json && echo "✓ Web app exists"
test -f vite.config.ts && echo "✓ Vite configured"
test -f tailwind.config.js && echo "✓ Tailwind configured"

# Check shadcn-svelte components
test -d src/lib/components/ui && echo "✓ shadcn-svelte installed"
```

### 0.2 Install Dependencies (if needed)

```bash
# If @testing-library/svelte not installed
bun add -D @testing-library/svelte @testing-library/jest-dom

# If svelte transitions not available
bun add -D svelte
```

---

## Phase 1: TODO List Creation

### 実装タスク一覧

#### Setup (15 min)
- [ ] ディレクトリ構造作成
- [ ] `components/`, `types/`, `.docs/` フォルダ作成
- [ ] `index.ts` ファイル作成

#### Types Definition (15 min)
- [ ] `types/index.ts` に Props 型定義
- [ ] `currentPath` 型定義
- [ ] イベントハンドラー型定義

#### Component Structure (30 min)
- [ ] `components/AppHeader.svelte` ベースファイル作成
- [ ] Props定義 ($props() runes)
- [ ] State管理 (menuOpen: $state(false))
- [ ] イベントハンドラー関数定義

#### Desktop Navigation (45 min)
- [ ] ロゴコンポーネント実装
  - [ ] レスポンシブ表示 (hidden sm:inline)
  - [ ] ホバーエフェクト
- [ ] 水平ナビゲーション実装
  - [ ] hidden md:flex でモバイル非表示
  - [ ] リンクアイテムコンポーネント
  - [ ] アクティブルートハイライト
  - [ ] min-h-[44px] タッチターゲット確保

#### Mobile Menu Button (30 min)
- [ ] ハンバーガーボタン実装
  - [ ] SVGアイコン (☰)
  - [ ] md:hidden でデスクトップ非表示
  - [ ] onclick={toggleMenu}
  - [ ] aria-label 動的設定
  - [ ] aria-expanded 状態管理
  - [ ] min-h-[44px] min-w-[44px]
- [ ] ×アイコン実装
  - [ ] menuOpen時の表示切り替え
  - [ ] transition-transform アニメーション

#### Mobile Menu Drawer (90 min)
- [ ] Backdrop実装
  - [ ] fixed inset-0 フルスクリーンオーバーレイ
  - [ ] bg-black/50 半透明背景
  - [ ] onclick={closeMenu}
  - [ ] md:hidden でデスクトップ非表示
  - [ ] transition:fade
- [ ] Drawer実装
  - [ ] fixed inset-y-0 left-0 左側固定
  - [ ] w-3/4 max-w-sm レスポンシブ幅
  - [ ] bg-background shadow-2xl
  - [ ] transition:fly (x: -300, duration: 300)
  - [ ] role="dialog", aria-modal="true"
  - [ ] onclick stopPropagation
- [ ] ナビゲーション項目実装
  - [ ] 垂直レイアウト (flex flex-col)
  - [ ] space-y-2 間隔
  - [ ] アイコン + テキスト
  - [ ] アクティブルートハイライト
  - [ ] onclick でメニュー閉じる

#### Keyboard & Accessibility (45 min)
- [ ] Escape キーハンドラー実装
  - [ ] handleKeydown 関数
  - [ ] svelte:window on:keydown
  - [ ] menuOpen時のみ反応
- [ ] フォーカストラップ実装
  - [ ] モーダル内の最初のfocusable要素にフォーカス
  - [ ] Tab循環制御
- [ ] ARIA属性追加
  - [ ] nav に aria-label
  - [ ] button に aria-label, aria-expanded
  - [ ] drawer に role, aria-modal, aria-label

#### Styling & Polish (60 min)
- [ ] Tailwind クラス最適化
- [ ] ホバー状態調整
- [ ] トランジション調整
- [ ] レスポンシブブレークポイント確認
- [ ] タッチターゲットサイズ確認 (≥44×44px)
- [ ] カラーコントラスト確認 (≥4.5:1)

#### Testing (90 min)
- [ ] コンポーネントテスト作成
  - [ ] Desktop navigation renders correctly
  - [ ] Mobile menu button toggles menu
  - [ ] Menu closes on backdrop click
  - [ ] Menu closes on Escape key
  - [ ] Active route highlights correctly
  - [ ] Keyboard navigation works
- [ ] Accessibility テスト
  - [ ] axe-core violations check
  - [ ] ARIA attributes present
  - [ ] Keyboard navigation
- [ ] Visual regression test (optional)

#### Documentation (30 min)
- [ ] コンポーネント使用例追加
- [ ] Props ドキュメント
- [ ] README更新

**Total Estimated Time: 8-12 hours**

---

## Phase 2: File Structure Setup

### 2.1 Create Directory Structure

```bash
cd /workspace/main/apps/web/src/features/feature/header

# Create directories
mkdir -p components types

# Create files
touch components/AppHeader.svelte
touch components/index.ts
touch types/index.ts
```

### 2.2 File Structure

```
apps/web/src/features/feature/header/
├── .docs/
│   ├── design.md                    # ✓ Already created
│   └── implementation-plan.md       # This document
├── components/
│   ├── AppHeader.svelte             # Main component
│   └── index.ts                     # Export
├── types/
│   └── index.ts                     # Type definitions
└── index.ts                         # Feature public API
```

---

## Phase 3: Implementation Steps (TDD-style)

### Step 1: Define Types (15 min)

**File**: `types/index.ts`

```typescript
// types/index.ts
export interface AppHeaderProps {
  /** 現在のルートパス */
  currentPath?: string;
  /** モバイルメニュー開閉コールバック (親コンポーネントからの制御用) */
  onMenuClick?: () => void;
}

export interface NavigationItem {
  href: string;
  label: string;
  icon?: string; // Optional icon name or component
}
```

**Checklist:**
- [x] Props型定義
- [x] Navigation item型定義
- [x] TypeScript strict mode準拠

### Step 2: Create Base Component Structure (30 min)

**File**: `components/AppHeader.svelte`

```svelte
<script lang="ts">
import type { AppHeaderProps } from '../types';

// Props with $props() runes (Svelte 5)
let {
  currentPath = '/',
  onMenuClick,
}: AppHeaderProps = $props();

// State
let menuOpen = $state(false);

// Event handlers
function toggleMenu() {
  menuOpen = !menuOpen;
  if (onMenuClick) onMenuClick();
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
      <!-- TODO: Logo -->
      <!-- TODO: Desktop Nav -->
      <!-- TODO: Mobile Menu Button -->
    </div>
  </div>
</header>

<!-- TODO: Mobile Menu -->
```

**Checklist:**
- [x] Props定義 ($props())
- [x] State管理 ($state())
- [x] イベントハンドラー定義
- [x] Base HTML structure
- [x] Sticky header positioning
- [x] Tailwind classes applied

### Step 3: Implement Logo (45 min)

```svelte
<!-- Logo -->
<a href="/" class="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors">
  <svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
    <path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5a1 1 0 112 0v4a1 1 0 11-2 0V5zm1 8a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" />
  </svg>
  <span class="hidden sm:inline">Todo App</span>
</a>
```

**Checklist:**
- [x] Icon + text layout
- [x] Responsive (hidden sm:inline)
- [x] Hover effect (hover:text-primary)
- [x] Transition (transition-colors)

### Step 4: Implement Desktop Navigation (45 min)

```svelte
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
  <a
    href="/tasks"
    class="px-4 py-2 rounded-md text-sm font-medium min-h-[44px] flex items-center
           {currentPath === '/tasks' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
           transition-colors"
  >
    Tasks
  </a>
</nav>
```

**Checklist:**
- [x] hidden md:flex でモバイル非表示
- [x] min-h-[44px] タッチターゲット
- [x] アクティブルートハイライト
- [x] ホバーエフェクト
- [x] aria-label追加

### Step 5: Implement Mobile Menu Button (30 min)

```svelte
<!-- Mobile Menu Button -->
<button
  onclick={toggleMenu}
  aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
  aria-expanded={menuOpen}
  class="md:hidden min-h-[44px] min-w-[44px] p-2 rounded-md text-foreground hover:bg-accent transition-colors"
>
  {#if menuOpen}
    <!-- × Icon -->
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  {:else}
    <!-- ☰ Icon -->
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  {/if}
</button>
```

**Checklist:**
- [x] md:hidden でデスクトップ非表示
- [x] min-h-[44px] min-w-[44px]
- [x] aria-label動的設定
- [x] aria-expanded状態
- [x] アイコン切り替え

### Step 6: Implement Mobile Menu Drawer (90 min)

```svelte
<script lang="ts">
import { fade, fly } from 'svelte/transition';
import { quintOut } from 'svelte/easing';
// ... existing code
</script>

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
        <a
          href="/tasks"
          onclick={closeMenu}
          class="flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium min-h-[44px]
                 {currentPath === '/tasks' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'}
                 transition-colors"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" />
          </svg>
          Tasks
        </a>
      </nav>
    </div>
  </div>
{/if}
```

**Checklist:**
- [x] Backdrop with fade transition
- [x] Drawer with fly transition
- [x] stopPropagation on drawer click
- [x] role="dialog", aria-modal="true"
- [x] Navigation items with icons
- [x] closeMenu on link click
- [x] min-h-[44px] タッチターゲット

### Step 7: Export Component (5 min)

**File**: `components/index.ts`

```typescript
export { default as AppHeader } from './AppHeader.svelte';
```

**File**: `index.ts` (feature root)

```typescript
// Public API
export { AppHeader } from './components';
export type { AppHeaderProps, NavigationItem } from './types';
```

---

## Phase 4: Testing

### 4.1 Component Tests

**File**: `components/__tests__/AppHeader.test.ts`

```typescript
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import AppHeader from '../AppHeader.svelte';

describe('AppHeader', () => {
  it('renders logo and app name', () => {
    render(AppHeader, { props: { currentPath: '/' } });
    expect(screen.getByText('Todo App')).toBeInTheDocument();
  });

  it('highlights active route', () => {
    render(AppHeader, { props: { currentPath: '/' } });
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveClass('bg-primary/10');
  });

  it('opens mobile menu on button click', async () => {
    render(AppHeader, { props: { currentPath: '/' } });
    const menuButton = screen.getByLabelText('メニューを開く');
    await fireEvent.click(menuButton);

    // Check menu is visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes menu on Escape key', async () => {
    render(AppHeader, { props: { currentPath: '/' } });
    const menuButton = screen.getByLabelText('メニューを開く');
    await fireEvent.click(menuButton);

    // Press Escape
    await fireEvent.keyDown(window, { key: 'Escape' });

    // Menu should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes menu on backdrop click', async () => {
    render(AppHeader, { props: { currentPath: '/' } });
    const menuButton = screen.getByLabelText('メニューを開く');
    await fireEvent.click(menuButton);

    // Click backdrop
    const backdrop = screen.getByRole('dialog').parentElement;
    await fireEvent.click(backdrop);

    // Menu should be closed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

### 4.2 Accessibility Tests

```typescript
import { axe } from 'jest-axe';

describe('AppHeader Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(AppHeader, { props: { currentPath: '/' } });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA labels', () => {
    render(AppHeader, { props: { currentPath: '/' } });
    expect(screen.getByLabelText('メインナビゲーション')).toBeInTheDocument();
    expect(screen.getByLabelText('メニューを開く')).toBeInTheDocument();
  });
});
```

### 4.3 Manual Testing Checklist

- [ ] **Desktop (1280px)**
  - [ ] Logo + text visible
  - [ ] Horizontal navigation visible
  - [ ] Mobile menu button hidden
  - [ ] Active route highlighted
  - [ ] Hover effects work
  - [ ] Keyboard Tab navigation works

- [ ] **Tablet (768px)**
  - [ ] Layout switches at breakpoint
  - [ ] Mobile menu appears
  - [ ] Desktop nav hidden

- [ ] **Mobile (375px)**
  - [ ] Logo visible (text hidden on very small screens)
  - [ ] Menu button visible
  - [ ] Menu opens smoothly
  - [ ] Drawer width appropriate
  - [ ] Touch targets ≥44×44px
  - [ ] Menu closes on link click

- [ ] **Accessibility**
  - [ ] Tab navigation works
  - [ ] Enter activates links
  - [ ] Escape closes menu
  - [ ] Screen reader announces menu state
  - [ ] Focus trap works in mobile menu

---

## Phase 5: Integration

### 5.1 Usage Example

```svelte
<!-- App.svelte or Layout component -->
<script lang="ts">
import { AppHeader } from '@/features/feature/header';

let currentPath = $state(window.location.pathname);
</script>

<div class="min-h-screen">
  <AppHeader {currentPath} />

  <main>
    <slot />
  </main>
</div>
```

### 5.2 Verification

```bash
# Run dev server
cd /workspace/main/apps/web
bun run dev

# Open browser
# http://localhost:5173

# Test:
# 1. Desktop navigation
# 2. Mobile menu
# 3. Keyboard navigation
# 4. Responsive behavior
```

---

## Phase 6: Completion Checklist

### Code Quality
- [ ] TypeScript型エラーなし: `bun run check:type`
- [ ] Lint/Formatエラーなし: `bun run check:biome`
- [ ] すべてのTODOコメント削除

### Design Compliance
- [ ] Material Design principles 遵守
- [ ] 8px grid system 適用
- [ ] Typography hierarchy 正しい
- [ ] Color system 一貫性
- [ ] Elevation levels 適切

### Responsive Design
- [ ] Mobile (320px-767px) 動作確認
- [ ] Tablet (768px-1023px) 動作確認
- [ ] Desktop (1024px+) 動作確認
- [ ] Touch targets ≥44×44px

### Accessibility
- [ ] WCAG 2.1 AA 準拠
- [ ] Keyboard navigation 完全動作
- [ ] Screen reader テスト (NVDA/VoiceOver)
- [ ] ARIA attributes 適切
- [ ] Color contrast ≥4.5:1
- [ ] axe-core violations: 0

### Performance
- [ ] Animation smooth (60fps)
- [ ] No layout shift
- [ ] Bundle size reasonable

### Documentation
- [ ] `design.md` 最終化
- [ ] `implementation-plan.md` 完了
- [ ] README 更新 (usage example)
- [ ] Props documented

---

## Timeline Estimate

| Phase | Task | Time |
|-------|------|------|
| 1 | Setup + Types | 30 min |
| 2 | Base Structure | 30 min |
| 3 | Logo | 45 min |
| 4 | Desktop Nav | 45 min |
| 5 | Mobile Button | 30 min |
| 6 | Mobile Drawer | 90 min |
| 7 | Accessibility | 45 min |
| 8 | Testing | 90 min |
| 9 | Documentation | 30 min |
| 10 | Integration & Polish | 60 min |

**Total: 8-12 hours**

---

## Success Criteria

### Functional
✅ Header sticky at top
✅ Desktop navigation works
✅ Mobile menu opens/closes
✅ Active route highlighted
✅ Keyboard navigation
✅ Escape key closes menu

### Design
✅ Material Design compliant
✅ Responsive (mobile-first)
✅ Touch targets ≥44×44px
✅ Smooth animations
✅ Proper elevation

### Accessibility
✅ WCAG 2.1 AA compliant
✅ Screen reader friendly
✅ Keyboard accessible
✅ Focus management
✅ ARIA labels

### Performance
✅ No layout shift
✅ Smooth 60fps animations
✅ Fast first paint

---

## References

- **Design Document**: `design.md`
- **Project Guidelines**: `/workspace/main/.claude/rules/guideline.md`
- **Coding Standards**: `/workspace/main/.claude/rules/coding-rules.md`
- **Design Guide**: `/workspace/main/.claude/rules/design-guide.md`
- **Material Design**: https://m3.material.io/components/top-app-bar
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
