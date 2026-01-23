# Task Detail View Design Document

## Overview

タスク詳細画面 (Task Detail View) は、個々のタスクの詳細情報を表示・編集するためのページです。ユーザーはタスクリストからタスクをクリックして詳細画面に遷移し、タスクの完全な情報を閲覧・編集できます。

## Requirements

### Functional Requirements

- **FR1**: タスクの詳細情報を表示 (タイトル、説明、ステータス、タイムスタンプ)
- **FR2**: インライン編集 (タイトル、説明)
- **FR3**: ステータス変更 (ステータスバッジクリック)
- **FR4**: タスク削除 (確認ダイアログ)
- **FR5**: ナビゲーション (Back to list)

### Non-Functional Requirements

- **NFR1**: レスポンシブデザイン
- **NFR2**: オプティミスティックアップデート
- **NFR3**: ローディング状態表示
- **NFR4**: エラーハンドリング (404, API errors)

## User Stories

- **US1**: タスクリストからタスクをクリックして詳細を表示
- **US2**: タイトルと説明をインラインで編集
- **US3**: ステータスバッジをクリックして状態変更
- **US4**: タスクを削除して一覧に戻る
- **US5**: "Back" ボタンで一覧に戻る

## Architecture

### Component Structure

\`\`\`
src/features/todo-detail/
├── api/
│   └── index.ts                       # API wrappers (reuse todo-list)
├── components/
│   ├── TaskDetailHeader.svelte        # Title, badge, buttons
│   ├── TaskDetailDescription.svelte   # Description edit
│   ├── TaskDetailMetadata.svelte      # Timestamps
│   └── DeleteConfirmDialog.svelte     # Delete confirmation
├── pages/
│   └── TaskDetailPage.svelte          # Main page
├── stores/
│   ├── task-detail.ts                 # Task detail state
│   └── index.ts
├── types/
│   └── index.ts                       # Type definitions
└── .docs/
    ├── design.md
    └── TODO.md
\`\`\`

## Routing Strategy

Use simple URL-based routing:
- List: \`/\`
- Detail: \`/tasks/:id\`

Implement with:
- URL pattern matching
- Browser history API
- Navigate via \`window.location.href\` or history.pushState

## Component Specifications

### TaskDetailPage.svelte

Main orchestration component:
- Load task from URL parameter on mount
- Handle loading/error states
- Compose all child components

### TaskDetailHeader.svelte

Features:
- Editable title (click to edit)
- Status badge (clickable)
- Back button
- Delete button

### TaskDetailDescription.svelte

Features:
- Display/edit description
- Handle null (show placeholder)
- Auto-save on blur

### TaskDetailMetadata.svelte

Display:
- Created date/time
- Updated date/time  
- Task ID

## Store: taskDetailStore

\`\`\`typescript
export const currentTask = writable<Task | null>(null);
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);

export const taskDetailStore = {
  fetchById(id: string): Promise<void>,
  updateTitle(id: string, title: string): Promise<void>,
  updateDescription(id: string, desc: string | null): Promise<void>,
  updateStatus(id: string, status: TaskStatus): Promise<void>,
  deleteTask(id: string): Promise<void>,
  clear(): void,
};
\`\`\`

All update operations use optimistic updates with rollback on error.

## Implementation Plan

1. Setup (15 min) - Directory structure
2. Types & API (15 min) - Reuse from todo-list
3. Stores (30 min) - task-detail store with optimistic updates
4. Components (90 min) - All 5 components
5. Routing (30 min) - Simple routing logic
6. Testing (30 min) - Manual testing

**Total: 3-4 hours**

## Acceptance Criteria

- [ ] Navigate from list to detail
- [ ] Display all task info
- [ ] Edit title inline
- [ ] Edit description inline
- [ ] Change status via badge
- [ ] Delete with confirmation
- [ ] Back navigation works
- [ ] Loading states shown
- [ ] Errors handled
- [ ] Optimistic updates work
- [ ] 404 for invalid IDs
- [ ] Responsive design
