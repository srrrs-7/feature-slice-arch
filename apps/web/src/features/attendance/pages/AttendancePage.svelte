<script lang="ts">
import { onMount } from "svelte";
import { t } from "$lib/i18n";
import {
  AttendanceCard,
  AttendanceSummaryCard,
  AttendanceTable,
  MonthSelector,
} from "../components";
import {
  attendanceStore,
  dateRange,
  error,
  isLoading,
  records,
  selectedMonth,
  selectedYear,
  summary,
} from "../stores";

interface Props {
  onNavigateToDetail?: (date: string) => void;
}

let { onNavigateToDetail }: Props = $props();

// Fetch data when date range changes
$effect(() => {
  const { from, to } = $dateRange;
  void attendanceStore.fetchByDateRange(from, to);
});

onMount(() => {
  return () => {
    attendanceStore.clear();
  };
});

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
      onPrevMonth={attendanceStore.prevMonth}
      onNextMonth={attendanceStore.nextMonth}
      onThisMonth={attendanceStore.goToThisMonth}
    />
  </div>

  <!-- Loading State -->
  {#if $isLoading}
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
  {:else if $error}
    <div
      class="bg-destructive/15 border border-destructive text-destructive-foreground p-4 rounded-lg"
      role="alert"
    >
      <p class="font-medium">{$t.common.error}</p>
      <p class="mt-1 text-sm">{$error}</p>
    </div>

    <!-- Empty State -->
  {:else if $records.length === 0}
    <div class="text-center py-12">
      <p class="text-muted-foreground text-lg">{$t.attendance.noRecord}</p>
    </div>

    <!-- Content -->
  {:else}
    <!-- Summary Card -->
    {#if $summary}
      <div class="mb-6 sm:mb-8">
        <AttendanceSummaryCard summary={$summary} />
      </div>
    {/if}

    <!-- Mobile: Card List -->
    <div class="sm:hidden space-y-3">
      {#each $records as record (record.id)}
        <AttendanceCard {record} onclick={() => handleSelectDate(record.date)} />
      {/each}
    </div>

    <!-- Desktop: Table -->
    <div class="hidden sm:block bg-card rounded-xl border shadow-sm overflow-hidden">
      <AttendanceTable records={$records} onSelectDate={handleSelectDate} />
    </div>
  {/if}
</div>
