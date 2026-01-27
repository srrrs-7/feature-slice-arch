<script lang="ts">
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { onDestroy, onMount } from "svelte";

dayjs.locale("ja");

let currentTime = dayjs();
let interval: ReturnType<typeof setInterval> | undefined;

onMount(() => {
  interval = setInterval(() => {
    currentTime = dayjs();
  }, 1000);
});

onDestroy(() => {
  if (interval) clearInterval(interval);
});

$: timeString = currentTime.format("HH:mm:ss");
$: dateString = currentTime.format("YYYY年M月D日 dddd");
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
