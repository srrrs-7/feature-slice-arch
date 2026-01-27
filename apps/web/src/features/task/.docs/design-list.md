# Todo-List Feature Design Document

## Overview

A full-featured todo-list application that allows users to create, read, update, and delete tasks with a modern, responsive UI built as a Single Page Application (SPA) using Svelte, shadcn-svelte, and Vite.

## Architecture Decisions

### Technology Stack
- **Build Tool**: Vite with Svelte plugin
- **Frontend Framework**: Svelte 5+ with TypeScript
- **UI Library**: shadcn-svelte (Bits UI primitives + Tailwind CSS)
- **HTTP Client**: Hono RPC Client (`hono/client`) for type-safe API calls
- **State Management**: Svelte stores (writable, derived) + reactive statements
- **Styling**: Tailwind CSS (required by shadcn-svelte)
- **Routing**: SPA routing with svelte-spa-router or @sveltejs/kit (optional)

### Design Philosophy
- **Feature-Sliced Architecture**: Organize by feature, not by technical layer
- **Type Safety**: Leverage TypeScript for compile-time safety
- **Optimistic Updates**: Immediate UI feedback, revert on error
- **Reactive Programming**: Svelte's reactive statements and stores for state management
- **Responsive Design**: Mobile-first approach with desktop enhancements

## UI/UX Design

### Design Principles (Material Design)

#### Material is the Metaphor
- **Card-based layout**: タスクは明確な境界を持つカード
- **Elevation**: hover時にshadow-lgで浮き上がる
- **視覚的階層**: タイトル > 説明 > メタデータ

#### Bold, Graphic, Intentional
- **明確なタイポグラフィ階層**: text-4xl (見出し) → text-lg (タスクタイトル) → text-sm (説明)
- **意味のある色使い**: ステータスバッジでセマンティックカラー使用
- **適切なコントラスト**: WCAG AA基準準拠 (4.5:1以上)

#### Motion Provides Meaning
- **フィードバック**: 作成・削除時のアニメーション
- **状態変化**: ステータス変更時のスムーズな遷移
- **関係性**: カードホバー時のshadow変化

### Desktop Layout (≥768px)

```
┌─────────────────────────────────────────────────────────────┐
│  Todo List                                     [+ New Task]  │
│  Manage your tasks efficiently                               │
├─────────────────────────────────────────────────────────────┤
│  [All] [Pending] [In Progress] [Completed]                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Buy groceries              [Pending ▾]      [Delete]  │  │
│  │ Milk, eggs, bread...                                  │  │
│  │ Created: 2 hours ago                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Write report               [In Progress ▾]  [Delete]  │  │
│  │ Q4 analysis and projections                           │  │
│  │ Created: 1 day ago                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Showing 2 of 5 tasks                                        │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout (<768px)

```
┌───────────────────────────┐
│  Todo List   [+ New Task] │
│  Manage tasks             │
├───────────────────────────┤
│ [All] [Pending] [In Prog] │
├───────────────────────────┤
│ ┌───────────────────────┐ │
│ │ Buy groceries         │ │
│ │ [Pending ▾]  [Delete] │ │
│ │ Milk, eggs...         │ │
│ │ 2 hours ago           │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │ Write report          │ │
│ │ [In Prog ▾]  [Delete] │ │
│ │ Q4 analysis...        │ │
│ │ 1 day ago             │ │
│ └───────────────────────┘ │
└───────────────────────────┘
```

### Create Task Dialog

```
┌─────────────────────────────┐
│  Create New Task        [×] │
├─────────────────────────────┤
│                             │
│  Title *                    │
│  ┌─────────────────────────┐│
│  │ Buy groceries          ││
│  └─────────────────────────┘│
│                             │
│  Description                │
│  ┌─────────────────────────┐│
│  │ Milk, eggs, bread...   ││
│  │                        ││
│  └─────────────────────────┘│
│                             │
│  [Cancel]      [Create]     │
└─────────────────────────────┘
```

## Component Structure

### Component Hierarchy

```
App.svelte
└── TodoListPage.svelte
    ├── TodoListHeader.svelte
    │   └── CreateTaskButton.svelte → CreateTaskDialog.svelte
    ├── TaskFilterBar.svelte
    │   └── FilterButton (Tabs component from shadcn-svelte)
    ├── TaskTable.svelte (Desktop)
    │   ├── TableHeader
    │   └── TaskRow.svelte[]
    │       ├── TaskStatusBadge.svelte
    │       └── TaskActions.svelte
    │           ├── EditButton → EditTaskDialog.svelte
    │           └── DeleteButton → DeleteConfirmDialog.svelte
    ├── TaskList.svelte (Mobile)
    │   └── TaskCard.svelte[]
    │       ├── TaskStatusBadge.svelte
    │       └── TaskActions.svelte
    └── TaskStats.svelte
```

## File/Folder Structure

```
apps/web/src/features/todo-list/
├── .docs/
│   └── design.md                    # This document
├── types/
│   └── index.ts                     # TypeScript types
├── api/
│   ├── client.ts                    # Base fetch wrapper
│   └── index.ts                     # Task API methods
├── stores/
│   ├── tasks.ts                     # Writable store for tasks list
│   ├── filter.ts                    # Writable store for filter state
│   ├── dialogs.ts                   # Store for dialog open/close state
│   └── index.ts                     # Re-exports
├── components/
│   ├── TodoListHeader.svelte
│   ├── TaskFilterBar.svelte
│   ├── TaskTable.svelte
│   ├── TaskList.svelte
│   ├── TaskCard.svelte
│   ├── TaskRow.svelte
│   ├── TaskStatusBadge.svelte
│   ├── TaskActions.svelte
│   ├── CreateTaskDialog.svelte
│   ├── EditTaskDialog.svelte
│   ├── DeleteConfirmDialog.svelte
│   └── TaskStats.svelte
├── pages/
│   └── TodoListPage.svelte          # Main page component
└── index.ts                         # Feature public API (if needed)
```

## shadcn-svelte Components to Use

### Installation Steps

1. Initialize shadcn-svelte:
```bash
cd /workspace/main/apps/web
npx shadcn-svelte@latest init
```

2. Install required components:
```bash
npx shadcn-svelte@latest add table button badge dialog alert-dialog input textarea select card tabs label
```

### Component List

- **Table** - Task list (desktop)
- **Button** - All actions
- **Badge** - Task status indicator
- **Dialog** - Create/Edit modals
- **Alert Dialog** - Delete confirmation
- **Input** - Task title field
- **Textarea** - Task description
- **Select** - Status dropdown
- **Card** - Task card (mobile)
- **Tabs** - Filter tabs
- **Label** - Form labels

### Note on shadcn-svelte

shadcn-svelte is the Svelte port of shadcn/ui, using:
- **Bits UI** instead of Radix UI (Svelte-native accessible primitives)
- **Tailwind CSS** for styling (same as shadcn/ui)
- **.svelte** components instead of .tsx

## API Integration with Hono RPC

### Hono RPC Client Setup

Hono RPC provides end-to-end type safety between the API and frontend. Instead of using plain `fetch`, we'll use the Hono RPC client which infers types from the API routes.

**Benefits:**
- **Type Safety**: API route types are automatically inferred on the client
- **Autocomplete**: Full IDE support for request/response types
- **Runtime Validation**: Type mismatches caught at compile time
- **No Code Generation**: No need for OpenAPI or manual type definitions

**Installation:**
```bash
bun add hono
```

**Client Setup:**
```typescript
// api/client.ts
import { hc } from 'hono/client';
import type { AppType } from '@api/index'; // Import API app type

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const client = hc<AppType>(apiUrl);
```

**Usage Example:**
```typescript
// Type-safe API calls
const res = await client.api.tasks.$get();
const data = await res.json(); // data.tasks is fully typed

const createRes = await client.api.tasks.$post({
  json: { title: 'New Task', description: 'Description' }
});
const newTask = await createRes.json(); // newTask.task is fully typed
```

### API Endpoints

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Task Type

Types are automatically inferred from the API, but for reference:

```typescript
interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
}

interface CreateTaskInput {
  title: string;
  description?: string | null;
}

interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: "pending" | "in_progress" | "completed";
}
```

### API Type Export

The API must export its route types for the client:

```typescript
// apps/api/src/index.ts
const app = new Hono()
  .route('/api/tasks', taskRoutes)
  .get('/health', (c) => c.json({ status: 'ok' }));

export type AppType = typeof app;
export default app;
```

## State Management with Svelte Stores

### Store Structure

```typescript
// stores/tasks.ts
import { writable, derived } from 'svelte/store';

export const tasks = writable<Task[]>([]);
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);

// Derived store for filtered tasks
export const filteredTasks = derived(
  [tasks, currentFilter],
  ([$tasks, $filter]) => {
    if ($filter === 'all') return $tasks;
    return $tasks.filter(task => task.status === $filter);
  }
);
```

### Reactive Statements

Svelte's reactive statements (`$:`) automatically re-run when dependencies change:

```svelte
<script lang="ts">
  import { tasks } from '../stores';

  // Automatically updates when tasks change
  $: taskCount = $tasks.length;
  $: completedCount = $tasks.filter(t => t.status === 'completed').length;
</script>
```

## Implementation Checklist

### Setup Phase
- [ ] Initialize Vite + Svelte + TypeScript project
- [ ] Install Tailwind CSS
- [ ] Initialize shadcn-svelte
- [ ] Install required shadcn-svelte components
- [ ] Set up project structure (src/features/todo-list)
- [ ] Configure Vite for SPA routing
- [ ] Set up environment variables for API URL

### Type Definitions
- [ ] Define Task type
- [ ] Define CreateTaskInput type
- [ ] Define UpdateTaskInput type
- [ ] Define TaskStatus type
- [ ] Define API response types

### API Client (Hono RPC)
- [ ] Ensure API exports AppType from main app
- [ ] Create Hono RPC client with inferred types
- [ ] Create wrapper functions for all endpoints (getTasks, getTaskById, createTask, updateTask, deleteTask)
- [ ] Add error handling and response parsing
- [ ] Set up environment variable for API URL (VITE_API_URL)

### Svelte Stores
- [ ] Create tasks store (writable)
- [ ] Create filter store (writable)
- [ ] Create dialogs store (writable)
- [ ] Create derived stores (filteredTasks, taskStats)
- [ ] Create store actions (fetchTasks, createTask, updateTask, deleteTask)

### UI Components
- [ ] Create TodoListPage.svelte
- [ ] Create TodoListHeader.svelte
- [ ] Create TaskFilterBar.svelte
- [ ] Create TaskTable.svelte (desktop view)
- [ ] Create TaskList.svelte (mobile view)
- [ ] Create TaskCard.svelte
- [ ] Create TaskRow.svelte
- [ ] Create TaskStatusBadge.svelte
- [ ] Create TaskActions.svelte
- [ ] Create CreateTaskDialog.svelte
- [ ] Create EditTaskDialog.svelte
- [ ] Create DeleteConfirmDialog.svelte
- [ ] Create TaskStats.svelte
- [ ] Implement responsive design
- [ ] Add loading states
- [ ] Add error handling

### Testing
- [ ] Write unit tests for API client
- [ ] Write unit tests for stores
- [ ] Write component tests with @testing-library/svelte
- [ ] Write E2E tests with Playwright

## Svelte-Specific Patterns

### Component Props

```svelte
<script lang="ts">
  export let task: Task;
  export let onEdit: (task: Task) => void;
  export let onDelete: (id: string) => void;
</script>
```

### Event Dispatching

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    edit: Task;
    delete: string;
  }>();

  function handleEdit() {
    dispatch('edit', task);
  }
</script>

<button on:click={handleEdit}>Edit</button>
```

### Two-Way Binding

```svelte
<script lang="ts">
  let title = '';
  let description = '';
</script>

<input bind:value={title} />
<textarea bind:value={description} />
```

### Conditional Rendering

```svelte
{#if $isLoading}
  <div>Loading...</div>
{:else if $error}
  <div>Error: {$error}</div>
{:else}
  <TaskTable tasks={$filteredTasks} />
{/if}
```

### List Rendering

```svelte
{#each $tasks as task (task.id)}
  <TaskRow {task} />
{/each}
```

## Project Setup Commands

```bash
# Create Vite + Svelte + TypeScript project
cd /workspace/main/apps/web
bun create vite . --template svelte-ts

# Install dependencies
bun install

# Install Hono for RPC client
bun add hono

# Install Tailwind CSS
bun add -D tailwindcss postcss autoprefixer
bunx tailwindcss init -p

# Initialize shadcn-svelte
bunx shadcn-svelte@latest init

# Install shadcn-svelte components
bunx shadcn-svelte@latest add table button badge dialog alert-dialog input textarea select card tabs label

# Set up environment variables
echo "VITE_API_URL=http://localhost:8080" > .env

# Development server
bun run dev

# Build for production
bun run build
```

## Summary

This design provides a production-ready todo-list feature with:

1. Modern UI using shadcn-svelte
2. Svelte SPA with Vite
3. Feature-Sliced Architecture
4. Full CRUD operations
5. Responsive design
6. Type-safe TypeScript
7. Optimistic updates with Svelte stores
8. Comprehensive error handling
9. Reactive programming with Svelte's reactivity system

Implementation should start with core functionality (view, create, edit, delete) and progressively add enhancements.
