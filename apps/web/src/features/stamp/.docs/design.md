# Stamp (打刻) Feature Web UI Design Document

## Overview

勤怠管理のための打刻画面。現在の勤務状況を表示し、出勤・退勤・休憩開始・休憩終了の打刻操作を提供する。

## Requirements

### 必須要件
- 現在の勤務状況をリアルタイムで表示
- 状況に応じた適切なアクションボタンを表示
- 打刻成功/失敗のフィードバックを提供
- モバイルファーストのレスポンシブデザイン
- WCAG 2.1 AA準拠のアクセシビリティ

### ユーザーストーリー
- ユーザーとして、現在の勤務状況を一目で確認したい
- ユーザーとして、ワンタップで打刻したい
- ユーザーとして、打刻が成功したかどうかを明確に知りたい
- ユーザーとして、誤操作を防ぎたい

## API Integration

### Endpoints (from API)

```typescript
// GET /api/stamps/status
interface StatusResponse {
  status: WorkStatus;
  stamp: Stamp | null;
}

// POST /api/stamps
interface StampRequest {
  action: "clock_in" | "clock_out" | "break_start" | "break_end";
}

interface StampResponse {
  stamp: Stamp;
}
```

### Types

```typescript
type WorkStatus = "not_working" | "working" | "on_break" | "clocked_out";

interface Stamp {
  id: string;
  date: string;          // YYYY-MM-DD
  clockInAt: string;     // ISO 8601 UTC
  clockOutAt: string | null;
  breakStartAt: string | null;
  breakEndAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type StampAction = "clock_in" | "clock_out" | "break_start" | "break_end";
```

## UI Design

### Layout Structure

```
┌─────────────────────────────────────────┐
│           Stamp Page Header             │
│         (打刻 / Attendance)             │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │       Current Time Display        │  │
│  │          15:30:45                 │  │
│  │        2026年1月24日(金)          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │       Status Card                 │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │    Status Badge             │  │  │
│  │  │    [勤務中 / Working]       │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  出勤時刻: 09:00                  │  │
│  │  経過時間: 6時間30分             │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │       Action Buttons              │  │
│  │  ┌─────────────┐ ┌─────────────┐  │  │
│  │  │  休憩開始   │ │   退勤     │  │  │
│  │  │ Break Start │ │ Clock Out  │  │  │
│  │  └─────────────┘ └─────────────┘  │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Status States & Available Actions

| Status | Badge Color | Badge Text | Available Actions |
|--------|-------------|------------|-------------------|
| `not_working` | Gray | 未出勤 | 出勤 (clock_in) |
| `working` | Green | 勤務中 | 休憩開始 (break_start), 退勤 (clock_out) |
| `on_break` | Yellow | 休憩中 | 休憩終了 (break_end) |
| `clocked_out` | Blue | 退勤済み | (none - display only) |

### Color System

```css
/* Status Badge Colors */
--status-not-working: gray-500     /* 未出勤 */
--status-working: green-500        /* 勤務中 */
--status-on-break: amber-500       /* 休憩中 */
--status-clocked-out: blue-500     /* 退勤済み */

/* Action Button Colors */
--action-clock-in: green-600       /* 出勤 */
--action-clock-out: blue-600       /* 退勤 */
--action-break-start: amber-600    /* 休憩開始 */
--action-break-end: green-600      /* 休憩終了 */
```

### Typography

```css
/* Current Time */
.time-display {
  font-size: 3rem;        /* text-5xl */
  font-weight: 700;       /* font-bold */
  font-variant-numeric: tabular-nums;
}

/* Date Display */
.date-display {
  font-size: 1.125rem;    /* text-lg */
  color: gray-600;
}

/* Status Badge */
.status-badge {
  font-size: 1rem;        /* text-base */
  font-weight: 600;       /* font-semibold */
}

/* Time Info Labels */
.time-label {
  font-size: 0.875rem;    /* text-sm */
  color: gray-600;
}

/* Time Info Values */
.time-value {
  font-size: 1.25rem;     /* text-xl */
  font-weight: 600;       /* font-semibold */
}
```

## Component Structure

```
features/stamp/
├── .docs/
│   └── design.md           # This file
├── pages/
│   └── StampPage.svelte    # Main page component
├── components/
│   ├── CurrentTime.svelte      # Real-time clock display
│   ├── StatusCard.svelte       # Status display card
│   ├── StatusBadge.svelte      # Status indicator badge
│   ├── TimeInfo.svelte         # Clock-in time, elapsed time
│   ├── ActionButtons.svelte    # Action button group
│   └── StampButton.svelte      # Individual action button
├── api/
│   ├── client.ts           # Hono RPC client setup
│   └── index.ts            # API wrapper functions
├── stores/
│   └── index.ts            # Stamp store (status, stamp, actions)
└── types/
    └── index.ts            # Type definitions
```

## Component Specifications

### 1. StampPage.svelte

**Purpose:** Main container for the stamp feature

**Structure:**
```svelte
<div class="container mx-auto py-8 px-4 max-w-lg">
  <header>Page Title</header>
  <CurrentTime />
  <StatusCard />
  <ActionButtons />
</div>
```

**Responsibilities:**
- Initialize store and fetch current status on mount
- Auto-refresh status every 60 seconds
- Handle loading and error states

### 2. CurrentTime.svelte

**Purpose:** Display real-time clock and current date

**Features:**
- Update every second using `setInterval`
- Tabular numerals for consistent width
- Japanese date format (YYYY年MM月DD日(曜日))

**Accessibility:**
- `aria-live="polite"` for time updates
- `aria-label` describing the time display

**Code Pattern:**
```svelte
<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  let currentTime = $state(new Date());
  let intervalId: ReturnType<typeof setInterval>;

  onMount(() => {
    intervalId = setInterval(() => {
      currentTime = new Date();
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(intervalId);
  });

  const timeString = $derived(
    currentTime.toLocaleTimeString("ja-JP", { hour12: false })
  );

  const dateString = $derived(
    currentTime.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    })
  );
</script>
```

### 3. StatusCard.svelte

**Purpose:** Display current work status with time information

**Props:**
```typescript
interface StatusCardProps {
  status: WorkStatus;
  stamp: Stamp | null;
  isLoading: boolean;
}
```

**Features:**
- Status badge with appropriate color
- Clock-in time display (if applicable)
- Elapsed work time (calculated from clockInAt minus break time)
- Skeleton loading state

**Accessibility:**
- Status changes announced via `aria-live="polite"`
- Semantic time elements with `datetime` attribute

### 4. StatusBadge.svelte

**Purpose:** Visual indicator of current work status

**Props:**
```typescript
interface StatusBadgeProps {
  status: WorkStatus;
}
```

**Variants:**
```svelte
{#if status === "not_working"}
  <Badge class="bg-gray-100 text-gray-700">未出勤</Badge>
{:else if status === "working"}
  <Badge class="bg-green-100 text-green-700">勤務中</Badge>
{:else if status === "on_break"}
  <Badge class="bg-amber-100 text-amber-700">休憩中</Badge>
{:else if status === "clocked_out"}
  <Badge class="bg-blue-100 text-blue-700">退勤済み</Badge>
{/if}
```

### 5. TimeInfo.svelte

**Purpose:** Display time-related information

**Props:**
```typescript
interface TimeInfoProps {
  label: string;
  value: string;
  datetime?: string;  // For <time> element
}
```

**Example Usage:**
```svelte
<TimeInfo label="出勤時刻" value="09:00" datetime="2026-01-24T00:00:00Z" />
<TimeInfo label="経過時間" value="6時間30分" />
<TimeInfo label="休憩時間" value="1時間00分" />
```

### 6. ActionButtons.svelte

**Purpose:** Container for action buttons based on current status

**Props:**
```typescript
interface ActionButtonsProps {
  status: WorkStatus;
  isLoading: boolean;
  onAction: (action: StampAction) => Promise<void>;
}
```

**Logic:**
```typescript
const availableActions = $derived(() => {
  switch (status) {
    case "not_working":
      return [{ action: "clock_in", label: "出勤", variant: "default" }];
    case "working":
      return [
        { action: "break_start", label: "休憩開始", variant: "secondary" },
        { action: "clock_out", label: "退勤", variant: "outline" },
      ];
    case "on_break":
      return [{ action: "break_end", label: "休憩終了", variant: "default" }];
    case "clocked_out":
      return [];
  }
});
```

### 7. StampButton.svelte

**Purpose:** Individual action button with loading and confirmation

**Props:**
```typescript
interface StampButtonProps {
  action: StampAction;
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  isLoading: boolean;
  requireConfirmation?: boolean;
  onClick: () => Promise<void>;
}
```

**Features:**
- Large touch target (min 48x48px)
- Loading spinner during action
- Optional confirmation dialog for destructive actions
- Disabled state during other actions

**Accessibility:**
- Clear `aria-label` describing the action
- `aria-busy` during loading
- Focus management

## Store Design

### stamp/stores/index.ts

```typescript
import { writable, derived } from "svelte/store";
import type { WorkStatus, Stamp, StampAction } from "../types";
import * as api from "../api";

// State
export const status = writable<WorkStatus>("not_working");
export const stamp = writable<Stamp | null>(null);
export const isLoading = writable<boolean>(false);
export const error = writable<string | null>(null);
export const actionInProgress = writable<StampAction | null>(null);

// Derived
export const canClockIn = derived(status, ($status) => $status === "not_working");
export const canClockOut = derived(status, ($status) => $status === "working");
export const canStartBreak = derived(status, ($status) => $status === "working");
export const canEndBreak = derived(status, ($status) => $status === "on_break");

// Elapsed time calculation
export const elapsedWorkTime = derived(stamp, ($stamp) => {
  if (!$stamp || !$stamp.clockInAt) return null;
  // Calculate elapsed time minus break time
  // ...
});

// Actions
export const stampStore = {
  async fetchStatus() {
    isLoading.set(true);
    error.set(null);
    try {
      const data = await api.getStatus();
      status.set(data.status);
      stamp.set(data.stamp);
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      isLoading.set(false);
    }
  },

  async performAction(action: StampAction) {
    actionInProgress.set(action);
    error.set(null);
    try {
      const data = await api.recordStamp(action);
      stamp.set(data.stamp);
      // Update status based on action
      const newStatus = getStatusAfterAction(action);
      status.set(newStatus);
    } catch (err) {
      error.set(err instanceof Error ? err.message : "Failed to record stamp");
      throw err;
    } finally {
      actionInProgress.set(null);
    }
  },
};

function getStatusAfterAction(action: StampAction): WorkStatus {
  switch (action) {
    case "clock_in": return "working";
    case "clock_out": return "clocked_out";
    case "break_start": return "on_break";
    case "break_end": return "working";
  }
}
```

## Responsive Design

### Breakpoints

```css
/* Mobile (default) */
.container { max-width: 100%; padding: 1rem; }
.time-display { font-size: 2.5rem; }
.action-button { width: 100%; min-height: 56px; }

/* sm (640px+) */
@media (min-width: 640px) {
  .container { max-width: 480px; padding: 2rem; }
  .time-display { font-size: 3rem; }
  .action-button { width: auto; min-width: 160px; }
}

/* md (768px+) */
@media (min-width: 768px) {
  .container { max-width: 512px; }
}
```

### Touch Targets

- All interactive elements: min 44x44px (WCAG) / 48x48px (Material Design)
- Action buttons: 56px height on mobile, 48px on desktop
- Adequate spacing between buttons: 16px gap

## Accessibility Requirements

### WCAG 2.1 AA Compliance

1. **Perceivable**
   - Color contrast ratio: 4.5:1 for text, 3:1 for large text
   - Status not conveyed by color alone (use icons + text)
   - Time updates accessible to screen readers

2. **Operable**
   - All actions keyboard accessible
   - Focus visible on all interactive elements
   - No time limits on actions

3. **Understandable**
   - Clear labels in Japanese
   - Consistent navigation
   - Error messages with recovery guidance

4. **Robust**
   - Semantic HTML elements
   - ARIA attributes where needed
   - Works with assistive technologies

### Specific ARIA Usage

```svelte
<!-- Status announcement -->
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  現在のステータス: {statusLabel}
</div>

<!-- Time display -->
<time
  datetime={currentTime.toISOString()}
  aria-label="現在時刻"
>
  {timeString}
</time>

<!-- Action button -->
<button
  aria-label="{actionLabel}を記録"
  aria-busy={isLoading}
  aria-disabled={isDisabled}
>
  {actionLabel}
</button>

<!-- Loading state -->
<div
  role="status"
  aria-live="polite"
>
  {#if isLoading}
    <span class="sr-only">読み込み中...</span>
  {/if}
</div>
```

## Error Handling

### Error States

1. **Network Error**
   - Display error message with retry button
   - Preserve last known status if available

2. **API Error (400)**
   - Display specific error message from API
   - Example: "すでに出勤済みです"

3. **Server Error (500)**
   - Display generic error message
   - Offer retry action

### Error Message Pattern

```svelte
{#if $error}
  <div
    role="alert"
    class="bg-destructive/15 border border-destructive rounded-lg p-4"
  >
    <div class="flex items-start gap-3">
      <svg class="w-5 h-5 text-destructive flex-shrink-0">
        <!-- Error icon -->
      </svg>
      <div>
        <p class="font-medium text-destructive">{$error}</p>
        <button
          onclick={handleRetry}
          class="mt-2 text-sm underline"
        >
          もう一度試す
        </button>
      </div>
    </div>
  </div>
{/if}
```

## Animation & Transitions

### Status Change Animation

```svelte
<script>
  import { fade, fly } from "svelte/transition";
</script>

<!-- Status badge transition -->
{#key status}
  <div transition:fade={{ duration: 200 }}>
    <StatusBadge {status} />
  </div>
{/key}

<!-- Success feedback -->
{#if showSuccess}
  <div
    transition:fly={{ y: -20, duration: 300 }}
    class="bg-green-100 text-green-800 rounded-lg p-4"
  >
    打刻しました
  </div>
{/if}
```

### Button Loading State

```svelte
<button disabled={isLoading}>
  {#if isLoading}
    <svg class="animate-spin h-5 w-5 mr-2">
      <!-- Spinner -->
    </svg>
  {/if}
  {label}
</button>
```

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create feature directory structure
- [ ] Define TypeScript types
- [ ] Set up Hono RPC client
- [ ] Create API wrapper functions

### Phase 2: State Management
- [ ] Implement stamp store
- [ ] Add derived stores for calculated values
- [ ] Implement store actions

### Phase 3: Components
- [ ] CurrentTime component
- [ ] StatusBadge component
- [ ] TimeInfo component
- [ ] StatusCard component
- [ ] StampButton component
- [ ] ActionButtons component
- [ ] StampPage component

### Phase 4: Styling & UX
- [ ] Apply Tailwind CSS styles
- [ ] Add animations and transitions
- [ ] Implement loading states
- [ ] Implement error handling UI

### Phase 5: Accessibility
- [ ] Add ARIA attributes
- [ ] Test keyboard navigation
- [ ] Test with screen reader
- [ ] Verify color contrast

### Phase 6: Testing
- [ ] Store unit tests
- [ ] Component tests
- [ ] E2E tests (optional)

## Design Review Checklist

### Responsive Design (8 checks)
- [ ] Mobile-first approach (base -> sm: -> md:)
- [ ] Touch targets >= 44x44px
- [ ] Responsive typography
- [ ] Responsive spacing
- [ ] No horizontal overflow
- [ ] Works at 320px width
- [ ] Works at 768px width
- [ ] Works at 1280px width

### Accessibility (12 checks)
- [ ] Semantic HTML
- [ ] Heading hierarchy
- [ ] ARIA labels
- [ ] ARIA roles
- [ ] ARIA states
- [ ] Color contrast (4.5:1)
- [ ] Keyboard navigation
- [ ] Focus states visible
- [ ] Screen reader tested
- [ ] Alternative text for icons
- [ ] Form labels (if any)
- [ ] Error announcements

### Color & Typography (5 checks)
- [ ] Tailwind color classes used
- [ ] Semantic colors for status
- [ ] Clear text hierarchy
- [ ] Readable font sizes (min 14px)
- [ ] Consistent spacing (8px grid)

### Components (7 checks)
- [ ] Button variants correct
- [ ] Button sizes with min-height
- [ ] Loading states clear
- [ ] Error states with messages
- [ ] Success feedback
- [ ] Empty state (if applicable)
- [ ] Disabled states clear

### Animation (4 checks)
- [ ] Transitions 200-300ms
- [ ] Transform/opacity only
- [ ] Smooth status changes
- [ ] Loading spinner

## References

- API Design: `/workspace/main/apps/api/src/features/stamp/.docs/design.md`
- Design Guide: `/workspace/main/.claude/rules/design-guide.md`
- Material Design: https://m3.material.io/
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
