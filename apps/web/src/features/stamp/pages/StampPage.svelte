<svelte:options runes={true} />

<script lang="ts">
import StampActionButton from "../components/StampActionButton.svelte";
import StampClock from "../components/StampClock.svelte";
import StampHeader from "../components/StampHeader.svelte";
import StampHistory from "../components/StampHistory.svelte";
import StampStatusCard from "../components/StampStatusCard.svelte";
import { createStampMutation, createStatusQuery } from "../queries";

// Use TanStack Query for data fetching
const statusQuery = createStatusQuery();
const stampMutation = createStampMutation();

async function handleClockIn() {
  try {
    await stampMutation.mutateAsync("clock_in");
  } catch (err) {
    console.error("Clock in failed:", err);
  }
}

async function handleClockOut() {
  try {
    await stampMutation.mutateAsync("clock_out");
  } catch (err) {
    console.error("Clock out failed:", err);
  }
}

async function handleBreakStart() {
  try {
    await stampMutation.mutateAsync("break_start");
  } catch (err) {
    console.error("Break start failed:", err);
  }
}

async function handleBreakEnd() {
  try {
    await stampMutation.mutateAsync("break_end");
  } catch (err) {
    console.error("Break end failed:", err);
  }
}

// Derive status and stamp from query
const currentStatus = $derived(statusQuery.data?.status ?? "not_working");
const currentStamp = $derived(statusQuery.data?.stamp ?? null);
</script>

<div class="py-4 sm:py-6 lg:py-8 max-w-2xl mx-auto">
  <StampHeader />

  {#if statusQuery.isPending && !statusQuery.data}
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
    {#if statusQuery.isError}
      <div
        class="bg-destructive/15 border border-destructive text-destructive-foreground px-4 py-3 rounded-lg mb-6"
        role="alert"
      >
        <strong>エラー:</strong>
        {statusQuery.error?.message || "Failed to fetch status"}
      </div>
    {/if}

    {#if stampMutation.isError}
      <div
        class="bg-destructive/15 border border-destructive text-destructive-foreground px-4 py-3 rounded-lg mb-6"
        role="alert"
      >
        <strong>エラー:</strong>
        {stampMutation.error?.message || "Failed to record stamp"}
      </div>
    {/if}

    <!-- Status Card -->
    <div class="my-6">
      <StampStatusCard status={currentStatus} stamp={currentStamp} />
    </div>

    <!-- Action Buttons -->
    <div class="my-6">
      <StampActionButton
        status={currentStatus}
        isLoading={stampMutation.isPending}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        onBreakStart={handleBreakStart}
        onBreakEnd={handleBreakEnd}
      />
    </div>

    <!-- History -->
    <StampHistory stamp={currentStamp} />
  {/if}
</div>
