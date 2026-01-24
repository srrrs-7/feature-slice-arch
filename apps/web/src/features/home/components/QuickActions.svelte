<script lang="ts">
import { t } from "$lib/i18n";

type QuickAction = {
  href: string;
  titleKey: "viewTasks" | "recordAttendance" | "viewAttendance";
  descriptionKey: "subtitle";
  section: "tasks" | "stamp" | "attendance";
  icon: string;
  color: string;
};

const actions: QuickAction[] = [
  {
    href: "/tasks",
    titleKey: "viewTasks",
    descriptionKey: "subtitle",
    section: "tasks",
    icon: "M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z",
    color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
  },
  {
    href: "/stamp",
    titleKey: "recordAttendance",
    descriptionKey: "subtitle",
    section: "stamp",
    icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z",
    color: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
  },
  {
    href: "/attendance",
    titleKey: "viewAttendance",
    descriptionKey: "subtitle",
    section: "attendance",
    icon: "M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z",
    color: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
  },
];

function getTitle(
  key: "viewTasks" | "recordAttendance" | "viewAttendance",
): string {
  return $t.home[key];
}

function getDescription(section: "tasks" | "stamp" | "attendance"): string {
  return $t[section].subtitle;
}
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
  {#each actions as action (action.href)}
    <a
      href={action.href}
      class="block p-4 sm:p-6 rounded-xl border border-border {action.color} transition-all hover:shadow-md active:scale-[0.98]"
    >
      <div class="flex items-start gap-3 sm:gap-4">
        <div class="p-2 sm:p-3 rounded-lg bg-background flex-shrink-0">
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d={action.icon} clip-rule="evenodd" />
          </svg>
        </div>
        <div class="min-w-0">
          <h3 class="text-base sm:text-lg font-semibold">{getTitle(action.titleKey)}</h3>
          <p class="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            {getDescription(action.section)}
          </p>
        </div>
      </div>
    </a>
  {/each}
</div>
