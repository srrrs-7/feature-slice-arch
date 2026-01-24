<script lang="ts">
import { onDestroy, onMount } from "svelte";
import StampActionButton from "../components/StampActionButton.svelte";
import StampClock from "../components/StampClock.svelte";
import StampHeader from "../components/StampHeader.svelte";
import StampHistory from "../components/StampHistory.svelte";
import StampStatusCard from "../components/StampStatusCard.svelte";
import {
  currentStamp,
  currentStatus,
  error,
  isLoading,
  stampStore,
} from "../stores";

onMount(() => {
  void stampStore.fetchStatus();
});

onDestroy(() => {
  stampStore.clear();
});

async function handleClockIn() {
  try {
    await stampStore.clockIn();
  } catch (err) {
    console.error("Clock in failed:", err);
  }
}

async function handleClockOut() {
  try {
    await stampStore.clockOut();
  } catch (err) {
    console.error("Clock out failed:", err);
  }
}

async function handleBreakStart() {
  try {
    await stampStore.breakStart();
  } catch (err) {
    console.error("Break start failed:", err);
  }
}

async function handleBreakEnd() {
  try {
    await stampStore.breakEnd();
  } catch (err) {
    console.error("Break end failed:", err);
  }
}
</script>

<div class="container mx-auto py-8 px-4 max-w-4xl">
  <StampHeader />

  {#if $isLoading && !$currentStamp && $currentStatus === "not_working"}
    <div class="flex justify-center items-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
        role="status"
        aria-label="読み込み中"
      ></div>
    </div>
  {:else}
    <!-- Clock -->
    <StampClock />

    <!-- Error Message -->
    {#if $error}
      <div
        class="bg-destructive/15 border border-destructive text-destructive-foreground px-4 py-3 rounded-lg mb-6"
        role="alert"
      >
        <strong>エラー:</strong>
        {$error}
      </div>
    {/if}

    <!-- Status Card -->
    <div class="my-6">
      <StampStatusCard status={$currentStatus} stamp={$currentStamp} />
    </div>

    <!-- Action Buttons -->
    <div class="my-6">
      <StampActionButton
        status={$currentStatus}
        isLoading={$isLoading}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        onBreakStart={handleBreakStart}
        onBreakEnd={handleBreakEnd}
      />
    </div>

    <!-- History -->
    <StampHistory stamp={$currentStamp} />
  {/if}
</div>
