<script lang="ts">
interface Props {
  size?: "sm" | "md" | "lg";
  class?: string;
}

let { size = "md", class: className = "" }: Props = $props();

const sizeClasses = {
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

const sizeClass = $derived(sizeClasses[size]);
</script>

<svg
  class="{sizeClass} {className}"
  viewBox="0 0 32 32"
  fill="none"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="app-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6" />
      <stop offset="100%" style="stop-color:#8b5cf6" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#app-logo-grad)" />
  <path
    d="M16 6L17.5 12.5L24 14L17.5 15.5L16 22L14.5 15.5L8 14L14.5 12.5L16 6Z"
    fill="white"
  />
  <circle cx="22" cy="8" r="2" fill="white" opacity="0.8" />
  <circle cx="10" cy="22" r="1.5" fill="white" opacity="0.6" />
</svg>
