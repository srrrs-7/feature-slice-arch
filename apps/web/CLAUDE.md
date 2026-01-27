# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Svelte 5 SPA with Vite, Tailwind CSS 4, and shadcn-svelte UI components.

| Technology | Version |
|------------|---------|
| Runtime | Bun 1.3.5 |
| Framework | Svelte 5.48 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn-svelte (bits-ui) |
| API Client | Hono RPC |

## Commands

```bash
# Development
bun run dev              # Start dev server with HMR (port 5173)

# Build & Type Check
bun run build            # Build for production
bun run check:type       # Type check with svelte-check

# Preview
bun run preview          # Preview production build
```

## Architecture

Feature-Sliced Architecture:

```
src/
├── features/           # Feature modules
│   ├── task/               # Task management
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   ├── queries/        # TanStack Query hooks
│   │   ├── stores/
│   │   └── types/
│   ├── stamp/              # Time stamping (clock in/out)
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   ├── queries/
│   │   ├── stores/
│   │   └── types/          # Re-exports from @api/features/attendance/domain/stamp
│   ├── attendance/         # Attendance records view
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   ├── queries/
│   │   └── types/
│   ├── common/             # Shared components (auth, sidebar)
│   └── home/               # Home page
├── components/         # Global shared components
│   └── ui/             # shadcn-svelte components
├── lib/
│   ├── api/            # Shared API client setup
│   ├── query/          # TanStack Query configuration
│   ├── i18n/           # Internationalization
│   │   ├── index.ts    # i18n store and helpers
│   │   ├── types.ts    # Type definitions
│   │   └── locales/    # Translation files (ja.ts, en.ts)
│   └── utils/          # Utility functions
│       ├── index.ts    # cn() helper
│       └── date.ts     # Date formatting
├── App.svelte          # Root component with routing
├── app.css             # Global styles (Tailwind)
└── main.ts             # Entry point
```

### API Type Imports

Web features import API types from their corresponding API feature domains:

```typescript
// Task types
import type { Task, TaskId } from "@api/features/tasks/domain/task";

// Stamp types (from attendance feature on API side)
import type { Stamp, StampId, WorkStatus } from "@api/features/attendance/domain/stamp";

// Attendance types
import type { AttendanceRecord, AttendanceSummary } from "@api/features/attendance/domain/attendance";
```

## Svelte 5 Patterns

### Runes

```svelte
<script lang="ts">
  // Props with $props()
  let {
    ref = $bindable(null),
    task,
    onEdit,
    class: className,
    children,
    ...restProps
  } = $props();

  // Reactive state with $state()
  let count = $state(0);
  let items = $state<string[]>([]);

  // Derived values with $derived()
  let doubled = $derived(count * 2);
  let total = $derived(items.length);

  // Effects with $effect()
  $effect(() => {
    console.log("Count changed:", count);
  });
</script>
```

### Event Handlers

```svelte
<!-- Svelte 5: use onclick (not on:click) for components -->
<Button onclick={handleClick}>Click me</Button>

<!-- Native elements still use on:click -->
<button on:click={handleClick}>Click</button>
```

### Store Usage

```svelte
<script lang="ts">
  import { tasks, isLoading, tasksStore } from "../stores";
  import { onMount } from "svelte";

  onMount(() => {
    void tasksStore.fetchAll();
  });
</script>

<!-- Use $ prefix for store values -->
{#if $isLoading}
  <p>Loading...</p>
{:else}
  {#each $tasks as task (task.id)}
    <div>{task.title}</div>
  {/each}
{/if}
```

## API Integration

### Hono RPC Client (Type-Safe)

```typescript
// api/client.ts
import { hc } from "hono/client";
import type { AppType } from "@api/index";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const client = hc<AppType>(apiUrl);
export const tasksApi = client.api.tasks;
```

### API Wrapper Functions

```typescript
// api/index.ts
import type { Task, CreateTaskInput } from "../types";

export async function getTasks(): Promise<{ tasks: Task[] }> {
  const res = await tasksApi.$get();
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  return await res.json();
}

export async function createTask(input: CreateTaskInput): Promise<{ task: Task }> {
  const res = await tasksApi.$post({ json: input });
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  return await res.json();
}
```

### Store with Optimistic Updates

```typescript
// stores/index.ts
import { writable, derived, get } from "svelte/store";
import type { Task } from "../types";
import * as api from "../api";

export const tasks = writable<Task[]>([]);
export const isLoading = writable(false);
export const error = writable<string | null>(null);

// Derived store
export const completedTasks = derived(tasks, ($tasks) =>
  $tasks.filter((t) => t.status === "completed")
);

export const tasksStore = {
  async fetchAll() {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.getTasks();
      tasks.set(data.tasks);
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Unknown error");
    } finally {
      isLoading.set(false);
    }
  },

  async update(id: string, input: UpdateTaskInput) {
    // Optimistic update
    let original: Task | undefined;
    tasks.update((items) => {
      original = items.find((t) => t.id === id);
      return items.map((t) => (t.id === id ? { ...t, ...input } : t));
    });

    try {
      const data = await api.updateTask(id, input);
      tasks.update((items) => items.map((t) => (t.id === id ? data.task : t)));
    } catch (err) {
      // Rollback on error
      if (original) {
        tasks.update((items) => items.map((t) => (t.id === id ? original! : t)));
      }
      throw err;
    }
  },
};
```

## Internationalization (i18n)

Store-based i18n system without external libraries.

### Usage

```svelte
<script lang="ts">
  import { t, locale, formatDate, formatTime, setLocale } from "$lib/i18n";
</script>

<!-- Translations -->
<h1>{$t.home.title}</h1>
<button>{$t.common.save}</button>

<!-- Date/Time formatting (locale-aware) -->
<time>{formatDate(task.createdAt)}</time>
<time>{formatTime(new Date())}</time>

<!-- Change locale -->
<button onclick={() => setLocale("en")}>English</button>
<button onclick={() => setLocale("ja")}>日本語</button>
```

### Adding Translations

```typescript
// lib/i18n/locales/ja.ts
export const ja: Translations = {
  common: {
    save: "保存",
    cancel: "キャンセル",
  },
  tasks: {
    title: "タスク一覧",
    createTask: "タスクを作成",
  },
};

// lib/i18n/locales/en.ts
export const en: Translations = {
  common: {
    save: "Save",
    cancel: "Cancel",
  },
  tasks: {
    title: "Task List",
    createTask: "Create Task",
  },
};
```

## Styling

### Tailwind CSS 4

```css
/* app.css */
@import "tailwindcss";

@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  --color-primary: oklch(0.205 0.155 254.128);
}
```

### shadcn-svelte Components

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import * as Card from "$lib/components/ui/card";
  import { cn } from "$lib/utils";
</script>

<Button variant="destructive" size="sm" onclick={handleDelete}>
  Delete
</Button>

<Card.Root>
  <Card.Header>
    <Card.Title>Title</Card.Title>
  </Card.Header>
  <Card.Content>Content</Card.Content>
</Card.Root>
```

### Responsive Design (Mobile First)

```svelte
<!-- Mobile first: base → sm → md → lg → xl -->
<div class="
  px-4 py-6
  sm:px-6 sm:py-8
  lg:px-8 lg:py-12
  max-w-screen-2xl mx-auto
">
  <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold">
    Title
  </h1>
</div>

<!-- Touch targets: minimum 44×44px (48×48px recommended) -->
<button class="min-h-[48px] min-w-[48px] px-6 py-3">
  Action
</button>

<!-- Responsive grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {#each items as item}
    <Card>{item.title}</Card>
  {/each}
</div>
```

## Import Aliases

```typescript
// App components
import Component from "@/features/task/Component.svelte";

// API types (from API workspace)
import type { AppType } from "@api/index";
import type { Task } from "@api/features/tasks/domain/task";
import type { Stamp, WorkStatus } from "@api/features/attendance/domain/stamp";
import type { AttendanceRecord } from "@api/features/attendance/domain/attendance";

// shadcn-svelte components
import { Button } from "$lib/components/ui/button";
import { cn } from "$lib/utils";

// i18n
import { t, locale, formatDate } from "$lib/i18n";
```

## Environment Variables

```bash
VITE_API_URL=http://localhost:8080
```

## Best Practices

### Floating Promises

Use `void` operator for fire-and-forget async calls:

```typescript
onMount(() => {
  void tasksStore.fetchAll();
});
```

### Timezone Handling

API returns UTC timestamps. Convert to local timezone for display:

```typescript
const createdAtLocal = new Date(task.createdAt).toLocaleString();
// Or use i18n formatDate
const formatted = formatDate(task.createdAt);
```

### Accessibility

```svelte
<!-- Semantic HTML -->
<main>
  <article>
    <h1>Title</h1>
  </article>
</main>

<!-- ARIA labels -->
<button aria-label={$t.a11y.deleteTask}>
  <TrashIcon />
</button>

<!-- Keyboard navigation -->
<div
  role="button"
  tabindex="0"
  on:click={handleClick}
  on:keydown={(e) => e.key === "Enter" && handleClick()}
>
  Clickable
</div>
```

## Related Documentation

- [Root CLAUDE.md](/workspace/main/CLAUDE.md) - Project overview
- [.claude/rules/design-guide.md](/workspace/main/.claude/rules/design-guide.md) - UI/UX design guidelines
- [.claude/rules/coding-rules.md](/workspace/main/.claude/rules/coding-rules.md) - Coding rules
