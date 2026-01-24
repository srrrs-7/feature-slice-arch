<script lang="ts">
import { onDestroy, onMount } from "svelte";

let currentTime = new Date();
let interval: ReturnType<typeof setInterval> | undefined;

onMount(() => {
  interval = setInterval(() => {
    currentTime = new Date();
  }, 1000);
});

onDestroy(() => {
  if (interval) clearInterval(interval);
});

$: timeString = currentTime.toLocaleTimeString("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

$: dateString = currentTime.toLocaleDateString("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});
</script>

<div class="text-center py-4 sm:py-6" aria-live="polite" aria-atomic="true">
  <time
    class="text-4xl sm:text-5xl lg:text-6xl font-mono font-bold text-foreground tabular-nums"
    datetime={currentTime.toISOString()}
  >
    {timeString}
  </time>
  <p class="text-base sm:text-lg lg:text-xl text-muted-foreground mt-1 sm:mt-2">
    {dateString}
  </p>
</div>
