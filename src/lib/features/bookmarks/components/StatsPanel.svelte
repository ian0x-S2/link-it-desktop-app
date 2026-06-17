<script lang="ts">
  import { AreaChart, BarChart, Tooltip } from 'layerchart';
  import { Button } from '$lib/shared/components/ui/button';
  import * as Chart from '$lib/shared/components/ui/chart/index.js';
  import type { Bookmark } from '../types/bookmark';

  let { bookmarks = [] }: { bookmarks: Bookmark[] } = $props();

  let chartType = $state<'bar' | 'line'>('bar');

  // Generate last 7 days chronologically (oldest to newest)
  const last7Days = $derived(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const fullDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const count = bookmarks.filter((b) => {
        try {
          const cb = new Date(b.createdAt);
          return cb.toDateString() === d.toDateString();
        } catch (e) {
          return false;
        }
      }).length;

      days.push({ label, fullDate, count });
    }
    return days;
  });

  const chartData = $derived(last7Days());

  const config = {
    count: {
      label: 'added',
      color: 'var(--primary)',
    },
  } satisfies Chart.ChartConfig;

  const series = [
    {
      key: 'count',
      label: 'added',
      color: 'var(--color-count)',
    },
  ];

  // Summary counts
  const totalCount = $derived(bookmarks.length);
  const favoriteCount = $derived(bookmarks.filter((b) => b.isFavorite).length);
</script>

<div
  class="relative p-4 flex flex-col bg-box-bg border border-border lg:flex-[2.5] min-h-45 lg:min-h-0 select-none font-mono"
>
  <span
    class="absolute px-1.5 text-[10px] font-bold uppercase tracking-wider -top-1.75 left-2.5 bg-background text-primary"
    >Statistics</span
  >

  <!-- Title & Chart Toggle -->
  <div
    class="flex items-center justify-between text-[9px] font-bold uppercase text-dim-foreground tracking-wider border-b border-dashed border-border-dim pb-1 mb-2 shrink-0"
  >
    <span>7-Day Activity</span>
    <div class="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="xs"
        onclick={() => (chartType = 'bar')}
        class="cursor-pointer transition-colors hover:text-foreground h-auto p-0 font-mono text-[9px] uppercase tracking-wider select-none bg-transparent hover:bg-transparent {chartType ===
        'bar'
          ? 'text-primary font-bold'
          : 'text-muted-foreground'}"
      >
        [bar]
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onclick={() => (chartType = 'line')}
        class="cursor-pointer transition-colors hover:text-foreground h-auto p-0 font-mono text-[9px] uppercase tracking-wider select-none bg-transparent hover:bg-transparent {chartType ===
        'line'
          ? 'text-primary font-bold'
          : 'text-muted-foreground'}"
      >
        [line]
      </Button>
    </div>
  </div>

  <!-- Chart Container -->
  <div class="relative flex-1 w-full min-h-0 flex items-center justify-center">
    <Chart.Container {config} class="w-full h-full aspect-auto">
      {#if chartType === 'bar'}
        <BarChart
          data={chartData}
          x="label"
          y="count"
          {series}
          props={{
            grid: { y: { style: 'stroke-dasharray: 2 2; stroke: var(--border-dim);' } },
            yAxis: { ticks: 3 },
          }}
        >
          {#snippet tooltip()}
            <Tooltip.Root variant="none">
              {#snippet children({ data })}
                <div
                  class="border border-border bg-card px-2 py-1 text-[8px] font-mono text-foreground flex flex-col"
                >
                  <span class="font-bold text-muted-foreground">{data.fullDate}</span>
                  <span class="text-primary">{data.count} added</span>
                </div>
              {/snippet}
            </Tooltip.Root>
          {/snippet}
        </BarChart>
      {:else}
        <AreaChart
          data={chartData}
          x="label"
          y="count"
          {series}
          props={{
            grid: { y: { style: 'stroke-dasharray: 2 2; stroke: var(--border-dim);' } },
            yAxis: { ticks: 3 },
          }}
        >
          {#snippet tooltip()}
            <Tooltip.Root variant="none">
              {#snippet children({ data })}
                <div
                  class="border border-border bg-card px-2 py-1 text-[8px] font-mono text-foreground flex flex-col"
                >
                  <span class="font-bold text-muted-foreground">{data.fullDate}</span>
                  <span class="text-primary">{data.count} added</span>
                </div>
              {/snippet}
            </Tooltip.Root>
          {/snippet}
        </AreaChart>
      {/if}
    </Chart.Container>
  </div>

  <!-- Bottom quick summary stats -->
  <div
    class="mt-2 pt-2 border-t border-dashed border-border-dim flex items-center justify-between text-[9px] shrink-0 text-dim-foreground"
  >
    <div class="flex items-center gap-1">
      <span>Total:</span>
      <span class="text-foreground font-bold">{totalCount}</span>
    </div>
    <div class="flex items-center gap-1">
      <span>Starred:</span>
      <span class="text-foreground font-bold">{favoriteCount}</span>
    </div>
  </div>
</div>
