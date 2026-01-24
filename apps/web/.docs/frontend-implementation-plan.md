# Frontend Implementation Plan

このドキュメントはフロントエンドの包括的な実装計画を提供します。Material Design原則、レスポンシブデザイン、アクセシビリティに基づいた段階的な実装アプローチを定義します。

## 実装状況サマリー

### 完了済み機能

- ✅ **Todo List Feature** (`apps/web/src/features/todo-list`)
  - タスク一覧表示 (TaskList.svelte, TaskCard.svelte)
  - タスクフィルタリング (TaskFilterBar.svelte)
  - タスク作成ダイアログ (CreateTaskDialog.svelte)
  - ステータスバッジ (TaskStatusBadge.svelte)
  - API連携 (Hono RPC Client)
  - オプティミスティック更新

- ✅ **Todo Detail Feature** (`apps/web/src/features/todo-detail`)
  - タスク詳細表示 (TaskDetailPage.svelte)
  - インラインタイトル編集 (TaskDetailHeader.svelte)
  - 説明編集 (TaskDetailDescription.svelte)
  - メタデータ表示 (TaskDetailMetadata.svelte)
  - 削除確認ダイアログ (DeleteConfirmDialog.svelte)

### 未実装機能

- ❌ **Header Feature** (`apps/web/src/features/feature/header`)
  - グローバルヘッダー
  - レスポンシブナビゲーション
  - モバイルメニュー

- ❌ **Sidebar Feature** (`apps/web/src/features/feature/sidebar`)
  - サイドナビゲーション
  - Material Design Navigation Drawer
  - レスポンシブドロワー

- ❌ **Main Layout Component**
  - ヘッダー + サイドバー + コンテンツの統合
  - レスポンシブレイアウト管理

## 実装フェーズ

### Phase 1: Design Review & Fixes (2-3 days)

既存のTodo List/Detailコンポーネントのデザイン改善。

#### 1.1 Todo List Design Improvements

**Priority: HIGH**

**Issues to Address:**

1. **TaskCard.svelte - Touch Target Size** 🔴
   - **Problem**: Delete button may be below 44×44px
   - **Fix**:
   ```svelte
   <!-- Before -->
   <Button variant="outline" size="sm" onclick={handleDelete}>
     Delete
   </Button>

   <!-- After -->
   <Button variant="outline" size="sm" class="min-h-[44px] min-w-[44px]" onclick={handleDelete}>
     Delete
   </Button>
   ```

2. **TaskCard.svelte - Accessibility** 🔴
   - **Problem**: Status badge に keyboard eventがない
   - **Fix**:
   ```svelte
   <button
     onclick={handleStatusToggle}
     onkeydown={(e) => e.key === 'Enter' && handleStatusToggle()}
     class="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
     aria-label={`ステータスを${statusCycle[task.status]}に変更`}
   >
     <TaskStatusBadge status={task.status} clickable />
   </button>
   ```

3. **TodoListPage.svelte - Error Message** 🟡
   - **Problem**: エラーメッセージが具体的でない
   - **Fix**:
   ```svelte
   {#if $error}
     <div class="bg-destructive/10 border border-destructive/50 text-destructive rounded-lg p-4 mb-6 flex items-start gap-3">
       <svg class="w-5 h-5 flex-shrink-0 mt-0.5"><!-- Error icon --></svg>
       <div class="flex-1">
         <h3 class="font-semibold mb-1">エラーが発生しました</h3>
         <p class="text-sm">{$error}</p>
         <button class="mt-2 text-sm font-medium underline hover:no-underline" onclick={() => tasksStore.fetchAll()}>
           再試行
         </button>
       </div>
     </div>
   {/if}
   ```

4. **CreateTaskDialog.svelte - Form Validation Visual Feedback** 🟡
   - **Problem**: バリデーションエラーが視覚的に不明確
   - **Add**: input aria-invalid, error message styling

5. **TaskFilterBar.svelte - Active Tab Contrast** 🟡
   - **Problem**: アクティブタブのコントラスト確認
   - **Verify**: bg-primary/10のコントラスト比が4.5:1以上

#### 1.2 Todo Detail Design Improvements

**Priority: HIGH**

**Issues to Address:**

1. **TaskDetailHeader.svelte - Edit Mode UX** 🟡
   - **Problem**: 編集モードの視覚的フィードバック不足
   - **Fix**:
   ```svelte
   <!-- Add visual indicator -->
   <div class="relative">
     {#if isEditingTitle}
       <input ... />
       <p class="text-xs text-muted-foreground mt-1">
         Enter to save • Esc to cancel
       </p>
     {/if}
   </div>
   ```

2. **TaskDetailDescription.svelte - Placeholder State** 🟡
   - **Problem**: 説明がnullの時の表示改善
   - **Fix**: "No description" → "Click to add description" + icon

3. **TaskDetailMetadata.svelte - Date Formatting** 🔵
   - **Improvement**: 相対時間 + 絶対時間両方表示
   - **Add**: Tooltip with full timestamp

4. **DeleteConfirmDialog.svelte - Warning Icon** 🟡
   - **Add**: ⚠️ アイコンで視覚的に警告

#### 1.3 Responsive Design Testing

**Test Breakpoints:**
- 320px (iPhone SE)
- 375px (iPhone 12)
- 768px (iPad Mini)
- 1024px (iPad Pro)
- 1280px (Desktop)

**Checklist:**
- [ ] TaskCard padding scales appropriately
- [ ] Filter tabs wrap on mobile
- [ ] Dialog max-width適切
- [ ] Font sizes scale (text-2xl → text-3xl → text-4xl)
- [ ] Touch targets ≥44×44px on all screens

#### 1.4 Accessibility Audit

**Tools:**
- axe DevTools
- WAVE
- Lighthouse

**Focus Areas:**
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader labels (NVDA, VoiceOver)
- [ ] Color contrast ratios
- [ ] Focus visible states
- [ ] ARIA labels/roles

**Estimated Time: 2-3 days**

---

### Phase 2: Header Feature Implementation (1-2 days)

**Reference**: `/workspace/main/apps/web/src/features/feature/header/.docs/design.md`

#### 2.1 Component Structure Setup

```bash
cd apps/web/src/features/feature/header
mkdir -p components pages stores types api
touch components/AppHeader.svelte
touch components/index.ts
```

#### 2.2 AppHeader.svelte Implementation

**Tasks:**
1. Create base layout structure
   ```svelte
   <header class="sticky top-0 z-40 w-full bg-background shadow-md">
     <div class="container mx-auto px-4 sm:px-6 lg:px-8">
       <div class="flex items-center justify-between h-16">
         <!-- Logo -->
         <!-- Desktop Nav -->
         <!-- Mobile Menu Button -->
       </div>
     </div>
   </header>
   ```

2. Implement Logo component
   - Responsive: icon only on mobile, icon+text on desktop
   - Hover effect: transition-colors

3. Implement Desktop Navigation
   - Hidden on mobile (hidden md:flex)
   - Active route highlighting
   - min-h-[44px] for touch targets

4. Implement Mobile Menu Button
   - Hamburger ⇄ × icon transition
   - aria-label, aria-expanded
   - min-h-[44px] min-w-[44px]

5. Implement Mobile Menu Drawer
   - Backdrop: bg-black/50
   - Drawer: slide from left
   - Svelte transitions (fade, fly)
   - Focus trap
   - Escape key handler

**Implementation Steps:**

```typescript
// Step 1: State management
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
```

```svelte
<!-- Step 2: Desktop nav -->
<nav class="hidden md:flex items-center gap-1" aria-label="メインナビゲーション">
  <a
    href="/"
    class="px-4 py-2 rounded-md text-sm font-medium min-h-[44px] flex items-center
           {currentPath === '/' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}
           transition-colors"
  >
    Home
  </a>
</nav>
```

```svelte
<!-- Step 3: Mobile drawer -->
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
    >
      <!-- Navigation content -->
    </div>
  </div>
{/if}
```

#### 2.3 Testing

- [ ] Desktop navigation works (click, keyboard)
- [ ] Mobile menu opens/closes smoothly
- [ ] Active route highlights correctly
- [ ] Escape key closes menu
- [ ] Backdrop click closes menu
- [ ] Focus trap works in menu
- [ ] Responsive at all breakpoints

**Estimated Time: 1-2 days**

---

### Phase 3: Sidebar Feature Implementation (1-2 days)

**Reference**: `/workspace/main/apps/web/src/features/feature/sidebar/.docs/design.md`

#### 3.1 Component Structure Setup

```bash
cd apps/web/src/features/feature/sidebar
mkdir -p components pages stores types api
touch components/AppSidebar.svelte
touch components/index.ts
```

#### 3.2 AppSidebar.svelte Implementation

**Tasks:**

1. Create Desktop Sidebar (Standard Drawer)
   ```svelte
   <aside class="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-30 bg-background border-r border-border">
     <!-- Sidebar Header -->
     <!-- Navigation -->
     <!-- Footer -->
   </aside>
   ```

2. Create Mobile Sidebar (Modal Drawer)
   ```svelte
   {#if open}
     <div class="fixed inset-0 z-50 lg:hidden" transition:fade>
       <!-- Backdrop -->
       <div class="absolute inset-0 bg-black/50"></div>
       <!-- Drawer -->
       <aside class="absolute inset-y-0 left-0 w-4/5 max-w-sm bg-background shadow-2xl" transition:fly>
         <!-- Content -->
       </aside>
     </div>
   {/if}
   ```

3. Implement Sidebar Header
   - Logo + App name
   - Close button (mobile only)

4. Implement Navigation Items
   - Icon + Label layout
   - Active route highlighting
   - min-h-[44px] touch targets
   - onclick closes mobile drawer

5. Implement Sidebar Footer
   - User info display
   - Avatar + Name + Email

**Implementation Steps:**

```typescript
// Props
interface Props {
  currentPath?: string;
  open?: boolean;
  onClose?: () => void;
}

let { currentPath = '/', open = false, onClose }: Props = $props();

function handleNavClick() {
  if (onClose) onClose();
}
```

```svelte
<!-- Navigation item template -->
<a
  href="/tasks"
  onclick={handleNavClick}
  class="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium min-h-[44px]
         {currentPath === '/tasks' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}
         transition-colors"
>
  <svg class="w-5 h-5 flex-shrink-0"><!-- Icon --></svg>
  <span>Tasks</span>
</a>
```

#### 3.3 Testing

- [ ] Desktop sidebar always visible
- [ ] Mobile drawer opens/closes
- [ ] Navigation works (click, keyboard)
- [ ] Active route highlights
- [ ] Drawer animations smooth
- [ ] Escape closes drawer
- [ ] Focus trap works

**Estimated Time: 1-2 days**

---

### Phase 4: Main Layout Integration (1 day)

統合されたレイアウトコンポーネントの作成。

#### 4.1 Create MainLayout.svelte

```bash
touch apps/web/src/lib/components/layouts/MainLayout.svelte
```

**Implementation:**

```svelte
<script lang="ts">
import AppHeader from '@/features/common/header/components/AppHeader.svelte';
import AppSidebar from '@/features/common/sidebar/components/AppSidebar.svelte';

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

#### 4.2 Update App.svelte

```svelte
<script lang="ts">
import MainLayout from './lib/components/layouts/MainLayout.svelte';
import TodoListPage from './features/todo-list/pages/TodoListPage.svelte';
import TaskDetailPage from './features/todo-detail/pages/TaskDetailPage.svelte';

// Simple routing logic
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

#### 4.3 Testing

- [ ] Header + Sidebar + Content統合確認
- [ ] モバイルメニューボタンがサイドバーを開く
- [ ] ルーティング動作確認
- [ ] レイアウトが全画面サイズで正常
- [ ] スクロール動作確認

**Estimated Time: 1 day**

---

### Phase 5: Final Polish & Testing (1-2 days)

#### 5.1 Performance Optimization

1. **Lazy Loading**
   - 大きなコンポーネントの遅延ロード
   - 画像最適化 (WebP, srcset)

2. **Bundle Size**
   - Analyze with `bun run build`
   - Remove unused dependencies
   - Tree-shaking verification

3. **Lighthouse Audit**
   - Performance score ≥90
   - Accessibility score ≥90
   - Best Practices score ≥90
   - SEO score ≥90

#### 5.2 Cross-Browser Testing

**Browsers:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

**Test:**
- [ ] レイアウト崩れなし
- [ ] アニメーション動作
- [ ] タッチ操作
- [ ] フォーム送信

#### 5.3 Accessibility Final Check

**Tools:**
- [ ] axe DevTools (0 violations)
- [ ] WAVE (0 errors)
- [ ] Lighthouse Accessibility (≥90)
- [ ] Manual keyboard navigation
- [ ] Screen reader testing (NVDA/VoiceOver)

**Focus Areas:**
- [ ] すべてのインタラクティブ要素がキーボードで操作可能
- [ ] フォーカス順序が論理的
- [ ] すべてのフォームにラベル
- [ ] すべてのボタンにaria-label
- [ ] カラーコントラスト基準準拠
- [ ] 画像にalt属性

#### 5.4 Design Consistency Review

**Checklist:**
- [ ] 8pxグリッドシステム遵守
- [ ] タイポグラフィ階層一貫性
- [ ] カラー使用一貫性 (primary, secondary, semantic)
- [ ] スペーシング一貫性 (p-4, p-6, p-8)
- [ ] Elevationレベル一貫性 (shadow-md, shadow-lg)
- [ ] ボーダー半径一貫性 (rounded-md, rounded-lg)
- [ ] ホバー/フォーカス状態一貫性

#### 5.5 Documentation Update

- [ ] CLAUDE.md更新 (新機能追加)
- [ ] design.md最終化
- [ ] コンポーネント使用例追加
- [ ] トラブルシューティングガイド

**Estimated Time: 1-2 days**

---

## Implementation Timeline

### Week 1

| Day | Phase | Tasks | Hours |
|-----|-------|-------|-------|
| Mon | Phase 1.1 | Todo List design fixes | 8 |
| Tue | Phase 1.2-1.3 | Todo Detail fixes + Responsive testing | 8 |
| Wed | Phase 1.4 | Accessibility audit + fixes | 8 |
| Thu | Phase 2.1-2.2 | Header component implementation | 8 |
| Fri | Phase 2.3 + Phase 3.1 | Header testing + Sidebar setup | 8 |

### Week 2

| Day | Phase | Tasks | Hours |
|-----|-------|-------|-------|
| Mon | Phase 3.2 | Sidebar implementation | 8 |
| Tue | Phase 3.3 + Phase 4 | Sidebar testing + Layout integration | 8 |
| Wed | Phase 5.1-5.2 | Performance + Cross-browser testing | 8 |
| Thu | Phase 5.3-5.4 | Accessibility + Design review | 8 |
| Fri | Phase 5.5 | Documentation + Buffer | 8 |

**Total: 80 hours (2 weeks)**

---

## Success Criteria

### Functional Requirements

- ✅ すべての機能が動作 (CRUD, navigation, filtering)
- ✅ レスポンシブデザイン (320px - 2560px)
- ✅ エラーハンドリング適切
- ✅ ローディング状態表示
- ✅ オプティミスティック更新動作

### Design Requirements

- ✅ Material Design原則遵守
- ✅ 8pxグリッドシステム
- ✅ タイポグラフィ階層明確
- ✅ セマンティックカラー使用
- ✅ Elevation適切
- ✅ アニメーション200-300ms

### Accessibility Requirements (WCAG 2.1 AA)

- ✅ キーボード操作可能
- ✅ スクリーンリーダー対応
- ✅ カラーコントラスト4.5:1以上
- ✅ タッチターゲット44×44px以上
- ✅ フォーカス状態明確
- ✅ ARIAラベル適切

### Performance Requirements

- ✅ Lighthouse Performance ≥90
- ✅ First Contentful Paint <2s
- ✅ Time to Interactive <3s
- ✅ Bundle size <500KB

### Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers

---

## Risk Assessment

### High Risk

1. **Accessibility Compliance**
   - **Risk**: WCAG AA基準を満たさない
   - **Mitigation**: 各フェーズでaxe DevToolsチェック

2. **Responsive Design Issues**
   - **Risk**: 特定の画面サイズで崩れる
   - **Mitigation**: すべてのブレークポイントでテスト

### Medium Risk

3. **Performance Degradation**
   - **Risk**: バンドルサイズ増加
   - **Mitigation**: Lazy loading, tree-shaking

4. **Cross-Browser Compatibility**
   - **Risk**: 一部ブラウザで動作しない
   - **Mitigation**: BrowserStackでテスト

### Low Risk

5. **Design Inconsistencies**
   - **Risk**: コンポーネント間で不一致
   - **Mitigation**: Design systemガイド厳守

---

## References

- [Design Guide](/workspace/main/.claude/rules/design-guide.md)
- [Coding Rules](/workspace/main/.claude/rules/coding-rules.md)
- [Testing Rules](/workspace/main/.claude/rules/testing.md)
- [Material Design](https://m3.material.io/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
