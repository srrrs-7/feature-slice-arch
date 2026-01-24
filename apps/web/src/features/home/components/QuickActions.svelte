<script lang="ts">
type QuickAction = {
  href: string;
  title: string;
  description: string;
  icon: string;
  color: string;
};

const actions: QuickAction[] = [
  {
    href: "/tasks",
    title: "タスク管理",
    description: "タスクの作成・管理",
    icon: "M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z",
    color: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
  },
  {
    href: "/stamp",
    title: "勤怠打刻",
    description: "出勤・退勤・休憩の記録",
    icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z",
    color: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
  },
];
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  {#each actions as action (action.href)}
    <a
      href={action.href}
      class="block p-6 rounded-xl border border-border {action.color} transition-colors"
    >
      <div class="flex items-start gap-4">
        <div class="p-3 rounded-lg bg-background">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d={action.icon} clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-semibold">{action.title}</h3>
          <p class="text-sm text-muted-foreground mt-1">{action.description}</p>
        </div>
      </div>
    </a>
  {/each}
</div>
