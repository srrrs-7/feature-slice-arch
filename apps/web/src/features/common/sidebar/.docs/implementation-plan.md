# Sidebar Feature Implementation Plan

このドキュメントはSidebar機能の実装計画です。TDD方法論とMaterial Design Navigation Drawerパターンに従った段階的な実装アプローチを提供します。

**参照**: `design.md` - 詳細な設計仕様

## Implementation Overview

- **Feature Type**: New Web UI Component
- **Scope**: Frontend only (Svelte 5 + Tailwind CSS)
- **Complexity**: Medium (3-5 files)
- **Pattern**: Material Design Navigation Drawer
- **Estimated Time**: 8-12 hours

---

## Phase 0: Prerequisites

### 0.1 Dependencies

Headerと同じ依存関係を使用:
- ✅ Svelte 5
- ✅ Tailwind CSS
- ✅ svelte/transition
- ✅ svelte/easing

---

## Phase 1: TODO List Creation

### 実装タスク一覧

#### Setup (15 min)
- [ ] ディレクトリ構造作成
- [ ] `components/`, `types/`, `.docs/` フォルダ作成
- [ ] `index.ts` ファイル作成

#### Types Definition (15 min)
- [ ] `types/index.ts` に Props 型定義
- [ ] Navigation item型定義
- [ ] Section group型定義 (optional)

#### Component Structure (30 min)
- [ ] `components/AppSidebar.svelte` ベースファイル作成
- [ ] Props定義 ($props() runes)
- [ ] イベントハンドラー関数定義
- [ ] Desktop/Mobile 条件分岐

#### Desktop Sidebar (Standard Drawer) (60 min)
- [ ] Fixed sidebar レイアウト
  - [ ] hidden lg:flex でモバイル非表示
  - [ ] lg:fixed lg:inset-y-0 固定配置
  - [ ] lg:w-64 幅256px
  - [ ] bg-background border-r
- [ ] Header section実装
  - [ ] Logo + App name
- [ ] Navigation section実装
  - [ ] flex-1 overflow-y-auto スクロール可能
  - [ ] Navigation items
  - [ ] Icon + Label layout
  - [ ] Active route highlight
  - [ ] min-h-[44px] タッチターゲット
- [ ] Footer section実装
  - [ ] User info display
  - [ ] Avatar + Name + Email

#### Mobile Sidebar (Modal Drawer) (90 min)
- [ ] Backdrop実装
  - [ ] fixed inset-0 フルスクリーンオーバーレイ
  - [ ] bg-black/50 半透明背景
  - [ ] onclick={onClose}
  - [ ] lg:hidden でデスクトップ非表示
  - [ ] transition:fade
- [ ] Drawer実装
  - [ ] absolute inset-y-0 left-0
  - [ ] w-4/5 max-w-sm レスポンシブ幅
  - [ ] bg-background shadow-2xl
  - [ ] transition:fly (x: -300, duration: 300)
  - [ ] role="dialog", aria-modal="true"
- [ ] Close button実装
  - [ ] lg:hidden でデスクトップ非表示
  - [ ] × アイコン
  - [ ] min-h-[44px] min-w-[44px]
- [ ] Navigation items実装
  - [ ] Desktop と同じコンポーネント再利用
  - [ ] onclick でサイドバー閉じる

#### Navigation Items Component (45 min)
- [ ] Reusable navigation item
  - [ ] Icon (SVG)
  - [ ] Label (text)
  - [ ] Active state styling
  - [ ] Hover effect
  - [ ] Transition
- [ ] Navigation list
  - [ ] space-y-1 間隔
  - [ ] Grouped navigation (optional)

#### Keyboard & Accessibility (45 min)
- [ ] Escape キーハンドラー実装
  - [ ] handleKeydown 関数
  - [ ] svelte:window on:keydown
  - [ ] open時のみ反応
- [ ] フォーカストラップ実装 (mobile drawer)
- [ ] ARIA属性追加
  - [ ] nav に aria-label
  - [ ] drawer に role, aria-modal, aria-label
  - [ ] close button に aria-label

#### Styling & Polish (60 min)
- [ ] Tailwind クラス最適化
- [ ] ホバー状態調整
- [ ] トランジション調整
- [ ] レスポンシブブレークポイント確認
- [ ] タッチターゲットサイズ確認 (≥44×44px)
- [ ] カラーコントラスト確認 (≥4.5:1)

#### Testing (90 min)
- [ ] コンポーネントテスト作成
  - [ ] Desktop sidebar always visible
  - [ ] Mobile drawer opens/closes
  - [ ] Navigation works
  - [ ] Active route highlights
  - [ ] Drawer closes on link click
  - [ ] Escape closes drawer
- [ ] Accessibility テスト
  - [ ] axe-core violations check
  - [ ] Keyboard navigation
  - [ ] Screen reader support

#### Documentation (30 min)
- [ ] コンポーネント使用例追加
- [ ] Props ドキュメント
- [ ] Layout integration example

**Total Estimated Time: 8-12 hours**

---

## Phase 2: File Structure Setup

### 2.1 Create Directory Structure

```bash
cd /workspace/main/apps/web/src/features/feature/sidebar

# Create directories
mkdir -p components types

# Create files
touch components/AppSidebar.svelte
touch components/index.ts
touch types/index.ts
```

### 2.2 File Structure

```
apps/web/src/features/feature/sidebar/
├── .docs/
│   ├── design.md                    # ✓ Already created
│   └── implementation-plan.md       # This document
├── components/
│   ├── AppSidebar.svelte            # Main component
│   └── index.ts                     # Export
├── types/
│   └── index.ts                     # Type definitions
└── index.ts                         # Feature public API
```

---

## Phase 3: Implementation Steps

### Step 1: Define Types (15 min)

**File**: `types/index.ts`

```typescript
// types/index.ts
export interface AppSidebarProps {
  /** 現在のルートパス */
  currentPath?: string;
  /** モバイルでサイドバーが開いているか */
  open?: boolean;
  /** サイドバー閉じるコールバック */
  onClose?: () => void;
}

export interface NavigationItem {
  href: string;
  label: string;
  icon: string; // SVG path data or icon name
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}
```

### Step 2: Create Base Component Structure (30 min)

**File**: `components/AppSidebar.svelte`

```svelte
<script lang="ts">
import { fade, fly } from 'svelte/transition';
import { quintOut } from 'svelte/easing';
import type { AppSidebarProps } from '../types';

// Props
let {
  currentPath = '/',
  open = false,
  onClose,
}: AppSidebarProps = $props();

// Event handlers
function handleNavClick() {
  if (onClose) onClose();
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open) {
    if (onClose) onClose();
  }
}

// Navigation items
const navItems = [
  { href: '/', label: 'Home', icon: 'M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z' },
  { href: '/tasks', label: 'Tasks', icon: 'M9 2a1 1 0 000 2h2a1 1 0 100-2H9z M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z' },
];
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Desktop Sidebar -->
<!-- TODO: Implement -->

<!-- Mobile Drawer -->
<!-- TODO: Implement -->
```

### Step 3: Implement Desktop Sidebar (60 min)

```svelte
<!-- Desktop: Always visible -->
<aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-30 bg-background border-r border-border">
  <!-- Header -->
  <div class="flex items-center h-16 px-6 border-b border-border">
    <a href="/" class="flex items-center gap-2 text-lg font-semibold text-foreground">
      <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" clip-rule="evenodd" />
      </svg>
      <span>Todo App</span>
    </a>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 overflow-y-auto p-4" aria-label="サイドナビゲーション">
    <div class="space-y-1">
      {#each navItems as item}
        <a
          href={item.href}
          class="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium min-h-[44px]
                 {currentPath === item.href
                   ? 'bg-primary/10 text-primary'
                   : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
                 transition-colors"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d={item.icon} clip-rule="evenodd" />
          </svg>
          <span>{item.label}</span>
        </a>
      {/each}
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
```

**Checklist:**
- [x] hidden lg:flex でモバイル非表示
- [x] Fixed positioning (lg:fixed lg:inset-y-0)
- [x] Width 256px (lg:w-64)
- [x] Header with logo
- [x] Navigation with overflow scroll
- [x] Footer with user info
- [x] Active route highlighting
- [x] min-h-[44px] タッチターゲット

### Step 4: Implement Mobile Drawer (90 min)

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
      <!-- Header with close button -->
      <div class="flex items-center justify-between h-16 px-6 border-b border-border">
        <a href="/" class="flex items-center gap-2 text-lg font-semibold text-foreground">
          <svg class="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" clip-rule="evenodd" />
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

      <!-- Navigation (same as desktop but with handleNavClick) -->
      <nav class="flex-1 overflow-y-auto p-4">
        <div class="space-y-1">
          {#each navItems as item}
            <a
              href={item.href}
              onclick={handleNavClick}
              class="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium min-h-[44px]
                     {currentPath === item.href
                       ? 'bg-primary/10 text-primary'
                       : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}
                     transition-colors"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d={item.icon} clip-rule="evenodd" />
              </svg>
              <span>{item.label}</span>
            </a>
          {/each}
        </div>
      </nav>

      <!-- Footer (same as desktop) -->
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
  </div>
{/if}
```

**Checklist:**
- [x] Backdrop with fade
- [x] Drawer with fly animation
- [x] Close button (lg:hidden)
- [x] role="dialog", aria-modal="true"
- [x] stopPropagation on drawer
- [x] handleNavClick closes drawer
- [x] Same navigation items as desktop

### Step 5: Export Component (5 min)

**File**: `components/index.ts`

```typescript
export { default as AppSidebar } from './AppSidebar.svelte';
```

**File**: `index.ts` (feature root)

```typescript
// Public API
export { AppSidebar } from './components';
export type { AppSidebarProps, NavigationItem, NavigationSection } from './types';
```

---

## Phase 4: Testing

### 4.1 Component Tests

**File**: `components/__tests__/AppSidebar.test.ts`

```typescript
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import AppSidebar from '../AppSidebar.svelte';

describe('AppSidebar', () => {
  it('renders navigation items', () => {
    render(AppSidebar, { props: { currentPath: '/', open: false } });
    // Desktop sidebar should exist (but hidden on mobile)
    expect(screen.getByLabelText('サイドナビゲーション')).toBeInTheDocument();
  });

  it('highlights active route', () => {
    render(AppSidebar, { props: { currentPath: '/tasks', open: false } });
    const tasksLink = screen.getByText('Tasks').closest('a');
    expect(tasksLink).toHaveClass('bg-primary/10');
  });

  it('renders mobile drawer when open', () => {
    render(AppSidebar, { props: { currentPath: '/', open: true } });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(AppSidebar, { props: { currentPath: '/', open: true, onClose } });

    const closeButton = screen.getByLabelText('サイドバーを閉じる');
    await fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on navigation item click', async () => {
    const onClose = vi.fn();
    render(AppSidebar, { props: { currentPath: '/', open: true, onClose } });

    // Click on Tasks link in mobile drawer
    const tasksLink = screen.getAllByText('Tasks')[0]; // Mobile drawer version
    await fireEvent.click(tasksLink);

    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape key', async () => {
    const onClose = vi.fn();
    render(AppSidebar, { props: { currentPath: '/', open: true, onClose } });

    await fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
});
```

### 4.2 Accessibility Tests

```typescript
import { axe } from 'jest-axe';

describe('AppSidebar Accessibility', () => {
  it('has no accessibility violations (desktop)', async () => {
    const { container } = render(AppSidebar, { props: { currentPath: '/', open: false } });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no accessibility violations (mobile open)', async () => {
    const { container } = render(AppSidebar, { props: { currentPath: '/', open: true } });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA attributes', () => {
    render(AppSidebar, { props: { currentPath: '/', open: true } });
    expect(screen.getByLabelText('ナビゲーションサイドバー')).toBeInTheDocument();
    expect(screen.getByLabelText('サイドバーを閉じる')).toBeInTheDocument();
  });
});
```

### 4.3 Manual Testing Checklist

- [ ] **Desktop (1280px)**
  - [ ] Sidebar always visible
  - [ ] Width 256px
  - [ ] Active route highlighted
  - [ ] Hover effects work
  - [ ] Scrollable navigation
  - [ ] Footer visible

- [ ] **Tablet (768px-1023px)**
  - [ ] Sidebar hidden
  - [ ] Modal drawer available
  - [ ] Drawer opens with button from header

- [ ] **Mobile (375px)**
  - [ ] Sidebar hidden
  - [ ] Drawer opens/closes smoothly
  - [ ] Drawer width appropriate (80% max 320px)
  - [ ] Touch targets ≥44×44px
  - [ ] Drawer closes on link click
  - [ ] Backdrop closes drawer

- [ ] **Accessibility**
  - [ ] Keyboard Tab navigation
  - [ ] Escape closes drawer
  - [ ] Focus trap in drawer
  - [ ] Screen reader announces drawer state
  - [ ] All interactive elements accessible

---

## Phase 5: Layout Integration

### 5.1 Create Main Layout Component

**File**: `apps/web/src/lib/components/layouts/MainLayout.svelte`

```svelte
<script lang="ts">
import { AppHeader } from '@/features/common/header';
import { AppSidebar } from '@/features/common/sidebar';

interface Props {
  currentPath?: string;
}

let { currentPath = '/' }: Props = $props();
let sidebarOpen = $state(false);

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
}

function closeSidebar() {
  sidebarOpen = false;
}
</script>

<div class="min-h-screen bg-background">
  <!-- Header -->
  <AppHeader {currentPath} onMenuClick={toggleSidebar} />

  <!-- Sidebar -->
  <AppSidebar {currentPath} open={sidebarOpen} onClose={closeSidebar} />

  <!-- Main Content -->
  <main class="lg:pl-64 pt-16 min-h-screen">
    <div class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </div>
  </main>
</div>
```

### 5.2 Update App.svelte

```svelte
<script lang="ts">
import MainLayout from './lib/components/layouts/MainLayout.svelte';
import TodoListPage from './features/todo-list/pages/TodoListPage.svelte';
import TaskDetailPage from './features/todo-detail/pages/TaskDetailPage.svelte';
import { onMount } from 'svelte';

// Simple routing
let currentPath = $state(window.location.pathname);
let taskId = $state<string | null>(null);

function navigate(path: string) {
  window.history.pushState({}, '', path);
  currentPath = path;
  updateRoute();
}

function updateRoute() {
  const taskMatch = currentPath.match(/^\/tasks\/(.+)$/);
  if (taskMatch) {
    taskId = taskMatch[1];
  } else {
    taskId = null;
  }
}

onMount(() => {
  updateRoute();
  window.addEventListener('popstate', () => {
    currentPath = window.location.pathname;
    updateRoute();
  });
});
</script>

<MainLayout {currentPath}>
  {#if taskId}
    <TaskDetailPage {taskId} onNavigateBack={() => navigate('/')} />
  {:else}
    <TodoListPage navigateToDetail={(id) => navigate(`/tasks/${id}`)} />
  {/if}
</MainLayout>
```

### 5.3 Verification

```bash
# Run dev server
cd /workspace/main/apps/web
bun run dev

# Open browser: http://localhost:5173

# Test:
# 1. Header + Sidebar integration
# 2. Mobile menu button opens sidebar
# 3. Sidebar closes on navigation
# 4. Desktop sidebar always visible
# 5. Content has proper offset (lg:pl-64)
```

---

## Phase 6: Completion Checklist

### Code Quality
- [ ] TypeScript型エラーなし: `bun run check:type`
- [ ] Lint/Formatエラーなし: `bun run check:biome`
- [ ] すべてのTODOコメント削除

### Design Compliance
- [ ] Material Design Navigation Drawer pattern
- [ ] Standard drawer (desktop)
- [ ] Modal drawer (mobile)
- [ ] 8px grid system
- [ ] Elevation levels 適切

### Responsive Design
- [ ] Mobile (<1024px): Modal drawer
- [ ] Desktop (≥1024px): Standard drawer
- [ ] Touch targets ≥44×44px
- [ ] Drawer width appropriate

### Accessibility
- [ ] WCAG 2.1 AA 準拠
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] ARIA attributes
- [ ] Focus trap (mobile drawer)
- [ ] Escape key closes drawer

### Integration
- [ ] MainLayout component created
- [ ] Header + Sidebar working together
- [ ] Content offset correct (lg:pl-64)
- [ ] Routing works
- [ ] Mobile menu button controls sidebar

### Documentation
- [ ] `design.md` 最終化
- [ ] `implementation-plan.md` 完了
- [ ] Usage example documented
- [ ] Props documented

---

## Timeline Estimate

| Phase | Task | Time |
|-------|------|------|
| 1 | Setup + Types | 30 min |
| 2 | Base Structure | 30 min |
| 3 | Desktop Sidebar | 60 min |
| 4 | Mobile Drawer | 90 min |
| 5 | Navigation Items | 45 min |
| 6 | Accessibility | 45 min |
| 7 | Testing | 90 min |
| 8 | Layout Integration | 60 min |
| 9 | Documentation | 30 min |
| 10 | Polish & Verification | 60 min |

**Total: 8-12 hours**

---

## Success Criteria

### Functional
✅ Desktop sidebar always visible
✅ Mobile drawer opens/closes
✅ Navigation works
✅ Active route highlighted
✅ Drawer closes on link click
✅ Escape closes drawer
✅ Header + Sidebar integration

### Design
✅ Material Design Navigation Drawer
✅ Standard drawer (desktop 256px)
✅ Modal drawer (mobile 80% max-w-sm)
✅ Proper elevation
✅ Smooth animations
✅ Touch targets ≥44×44px

### Accessibility
✅ WCAG 2.1 AA compliant
✅ Keyboard accessible
✅ Screen reader friendly
✅ Focus management
✅ ARIA labels

### Performance
✅ No layout shift
✅ Smooth animations
✅ Minimal bundle impact

---

## References

- **Design Document**: `design.md`
- **Project Guidelines**: `/workspace/main/.claude/rules/guideline.md`
- **Coding Standards**: `/workspace/main/.claude/rules/coding-rules.md`
- **Design Guide**: `/workspace/main/.claude/rules/design-guide.md`
- **Material Design**: https://m3.material.io/components/navigation-drawer
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
