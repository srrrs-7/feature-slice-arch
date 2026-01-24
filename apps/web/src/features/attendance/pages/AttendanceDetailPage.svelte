<script lang="ts">
import ArrowLeft from "@lucide/svelte/icons/arrow-left";
import { onMount } from "svelte";
import { Button } from "$lib/components/ui/button";
import { t } from "$lib/i18n";
import { AttendanceDetailCard, AttendanceTimeline } from "../components";
import { attendanceStore, error, isLoading, selectedRecord } from "../stores";
import { formatFullDate } from "../utils";

interface Props {
  date: string;
  onBack?: () => void;
}

let { date, onBack }: Props = $props();

onMount(() => {
  void attendanceStore.fetchByDate(date);
  return () => {
    selectedRecord.set(null);
  };
});

function handleBack() {
  if (onBack) {
    onBack();
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && onBack) {
    onBack();
  }
}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="py-4 sm:py-6 lg:py-8 max-w-4xl mx-auto px-4 sm:px-6">
  <!-- Back Button -->
  <div class="mb-4 sm:mb-6">
    <Button
      variant="ghost"
      size="sm"
      onclick={handleBack}
      class="min-h-[44px] -ml-2"
    >
      <ArrowLeft class="h-4 w-4 mr-2" />
      {$t.attendance.backToList}
    </Button>
  </div>

  <!-- Header -->
  <header class="mb-6 sm:mb-8">
    <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
      {formatFullDate(date)}
    </h1>
    <p class="text-sm sm:text-base text-muted-foreground mt-1">
      {$t.attendance.detail}
    </p>
  </header>

  <!-- Loading State -->
  {#if $isLoading}
    <div class="space-y-4" role="status" aria-label={$t.common.loading}>
      <div class="animate-pulse p-6 bg-muted rounded-xl h-48"></div>
      <div class="animate-pulse p-6 bg-muted rounded-xl h-64"></div>
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

    <!-- Content -->
  {:else if $selectedRecord}
    <div class="space-y-6">
      <!-- Timeline -->
      <AttendanceTimeline record={$selectedRecord} />

      <!-- Work Breakdown -->
      <AttendanceDetailCard record={$selectedRecord} />
    </div>
  {/if}
</div>
