<svelte:options runes={true} />

<script lang="ts">
import dayjs from "dayjs";
import { t } from "$lib/i18n";
import {
  AttendanceCard,
  AttendanceSummaryCard,
  AttendanceTable,
  MonthSelector,
} from "../components";
import { createAttendanceListQuery } from "../queries";
import { selectedMonth, selectedYear } from "../stores";

interface Props {
  onNavigateToDetail?: (date: string) => void;
}

let { onNavigateToDetail }: Props = $props();

// Calculate date range from selected year and month
const dateRange = $derived.by(() => {
  const year = $selectedYear;
  const month = $selectedMonth;
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = dayjs(from).endOf("month").date();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
});

// Use TanStack Query for data fetching
const attendanceQuery = createAttendanceListQuery(() => dateRange);

// Navigation functions
function prevMonth(): void {
  selectedMonth.update((m) => {
    if (m === 1) {
      selectedYear.update((y) => y - 1);
      return 12;
    }
    return m - 1;
  });
}

function nextMonth(): void {
  selectedMonth.update((m) => {
    if (m === 12) {
      selectedYear.update((y) => y + 1);
      return 1;
    }
    return m + 1;
  });
}

function goToThisMonth(): void {
  const now = dayjs();
  selectedYear.set(now.year());
  selectedMonth.set(now.month() + 1);
}

function handleSelectDate(date: string) {
  if (onNavigateToDetail) {
    onNavigateToDetail(date);
  }
}
</script>

<div class="py-4 sm:py-6 lg:py-8 max-w-6xl mx-auto px-4 sm:px-6">
  <!-- Header -->
  <header class="mb-6 sm:mb-8">
    <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
      {$t.attendance.title}
    </h1>
    <p class="text-sm sm:text-base text-muted-foreground mt-1">
      {$t.attendance.subtitle}
    </p>
  </header>

  <!-- Month Selector -->
  <div class="mb-6 sm:mb-8">
    <MonthSelector
      year={$selectedYear}
      month={$selectedMonth}
      onPrevMonth={prevMonth}
      onNextMonth={nextMonth}
      onThisMonth={goToThisMonth}
    />
  </div>

  <!-- Loading State -->
  {#if attendanceQuery.isPending}
    <div class="space-y-4" role="status" aria-label={$t.common.loading}>
      <!-- Summary Skeleton -->
      <div class="animate-pulse p-6 bg-muted rounded-xl h-32"></div>
      <!-- Table/Cards Skeleton -->
      {#each Array(5) as _}
        <div class="animate-pulse">
          <div class="h-16 bg-muted rounded-lg"></div>
        </div>
      {/each}
      <span class="sr-only">{$t.common.loading}</span>
    </div>

    <!-- Error State -->
  {:else if attendanceQuery.isError}
    <div
      class="bg-destructive/15 border border-destructive text-destructive-foreground p-4 rounded-lg"
      role="alert"
    >
      <p class="font-medium">{$t.common.error}</p>
      <p class="mt-1 text-sm">{attendanceQuery.error?.message || "Failed to fetch attendance"}</p>
    </div>

    <!-- Empty State -->
  {:else if (attendanceQuery.data?.records ?? []).length === 0}
    <div class="text-center py-12">
      <p class="text-muted-foreground text-lg">{$t.attendance.noRecord}</p>
    </div>

    <!-- Content -->
  {:else}
    <!-- Summary Card -->
    {#if attendanceQuery.data?.summary}
      <div class="mb-6 sm:mb-8">
        <AttendanceSummaryCard summary={attendanceQuery.data.summary} />
      </div>
    {/if}

    <!-- Mobile: Card List -->
    <div class="sm:hidden space-y-3">
      {#each attendanceQuery.data?.records ?? [] as record (record.id)}
        <AttendanceCard {record} onclick={() => handleSelectDate(record.date)} />
      {/each}
    </div>

    <!-- Desktop: Table -->
    <div class="hidden sm:block bg-card rounded-xl border shadow-sm overflow-hidden">
      <AttendanceTable records={attendanceQuery.data?.records ?? []} onSelectDate={handleSelectDate} />
    </div>
  {/if}
</div>
