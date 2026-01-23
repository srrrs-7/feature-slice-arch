# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Web Application

Svelte 5 SPA with Vite, Tailwind CSS 4, and shadcn-svelte UI components.

## Commands

```bash
# Development
bun run dev              # Start dev server with HMR (port 3000)

# Build & Type Check
bun run build            # Build for production
bun run check:type       # Type check with svelte-check

# Preview
bun run preview          # Preview production build

# Clean
bun run clean            # Remove dist and node_modules
```

## Architecture

Feature-Sliced Architecture:

```
src/
├── features/           # Feature modules
│   └── {feature}/
│       ├── .docs/          # Feature documentation
│       │   └── design.md
│       ├── pages/          # Page components
│       ├── components/     # UI components
│       ├── api/            # Hono RPC client
│       │   ├── client.ts   # API client setup
│       │   └── index.ts    # API wrapper functions
│       ├── stores/         # Svelte stores
│       │   └── index.ts
│       └── types/          # Type definitions
│           └── index.ts
├── lib/
│   ├── components/ui/  # shadcn-svelte components
│   └── utils/          # Utility functions
│       ├── index.ts    # cn() helper, types
│       └── date.ts     # Date formatting
├── App.svelte          # Root component
├── app.css             # Global styles (Tailwind)
└── main.ts             # Entry point
```

## Tech Stack

- **Framework**: Svelte 5.48 with runes (`$props()`, `$state()`, `$derived()`)
- **Build**: Vite 7
- **Styling**: Tailwind CSS 4 with `@tailwindcss/postcss`
- **UI Components**: shadcn-svelte (bits-ui based)
- **API Client**: Hono RPC Client (type-safe)
- **State Management**: Svelte stores (writable, derived)

## Svelte 5 Patterns

### Component Props

```svelte
<script lang="ts">
  // Use $props() for component props (Svelte 5 runes)
  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  } = $props();
</script>
```

### Event Handlers

```svelte
<!-- Use onclick instead of on:click for Svelte 5 -->
<Button onclick={handleClick}>Click me</Button>

<!-- Native elements still use on:click -->
<button on:click={handleClick}>Click</button>
```

### Stores

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

### Hono RPC Client

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
export async function getTasks(): Promise<{ tasks: Task[] }> {
  const res = await tasksApi.$get();
  if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
  return await res.json();
}
```

## Styling

### Tailwind CSS 4

```css
/* app.css */
@import "tailwindcss";

@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  /* ... */
}
```

### shadcn-svelte Components

```svelte
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Dialog from "$lib/components/ui/dialog";
  import { cn } from "$lib/utils";
</script>

<Button variant="destructive" size="sm" onclick={handleDelete}>
  Delete
</Button>
```

## Import Aliases

```typescript
// App components
import Component from "@/features/todo-list/Component.svelte";

// API types (from API workspace)
import type { AppType } from "@api/index";
import type { Task } from "@api/features/tasks/domain/task";

// shadcn-svelte components
import { Button } from "$lib/components/ui/button";
import { cn } from "$lib/utils";
```

## Environment Variables

```bash
VITE_API_URL=http://localhost:8080
```

## Timezone Handling

- API returns timestamps in UTC (ISO 8601)
- Convert to local timezone for display:

```typescript
const createdAtLocal = new Date(task.createdAt).toLocaleString();
```

## Best Practices

1. **Floating Promises**: Use `void` operator for fire-and-forget async calls
   ```typescript
   onMount(() => {
     void tasksStore.fetchAll();
   });
   ```

2. **Optimistic Updates**: Update UI immediately, rollback on error
   ```typescript
   // Store method with optimistic update
   let original: Task | null = null;
   tasks.update((items) => {
     original = items.find((t) => t.id === id);
     return items.map((t) => (t.id === id ? { ...t, ...input } : t));
   });
   ```

3. **Error Handling**: Set error state in stores
   ```typescript
   catch (err) {
     error.set(err instanceof Error ? err.message : "Unknown error");
   }
   ```
