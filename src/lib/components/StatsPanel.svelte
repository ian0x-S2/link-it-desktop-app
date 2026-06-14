<script lang="ts">
  import type { Bookmark } from "../types/bookmark";

  let { bookmarks = [] }: { bookmarks: Bookmark[] } = $props();

  let chartType = $state<"bar" | "line">("bar");
  let hoveredIdx = $state<number | null>(null);

  // Generate last 7 days chronologically (oldest to newest)
  const last7Days = $derived(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      const fullDate = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
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

  const maxCount = $derived(() => {
    const counts = last7Days().map((d) => d.count);
    const max = Math.max(...counts, 0);
    return max === 0 ? 4 : max; // default minimum max value of 4 for nice spacing
  });

  // Calculate SVG coordinates
  const svgWidth = 260;
  const svgHeight = 110;
  const paddingLeft = 20;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 15;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const points = $derived(() => {
    const days = last7Days();
    const maxVal = maxCount();

    return days.map((day, idx) => {
      const x = paddingLeft + (idx / (days.length - 1)) * chartWidth;
      const y = svgHeight - paddingBottom - (day.count / maxVal) * chartHeight;
      return { x, y, ...day };
    });
  });

  // SVG Line path string
  const linePath = $derived(() => {
    const pts = points();
    if (pts.length === 0) {
      return "";
    }
    return pts
      .map(
        (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      )
      .join(" ");
  });

  // SVG Area path string
  const areaPath = $derived(() => {
    const pts = points();
    if (pts.length === 0) {
      return "";
    }
    const firstX = pts[0].x;
    const lastX = pts[pts.length - 1].x;
    const baseY = svgHeight - paddingBottom;
    const path = pts
      .map(
        (p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
      )
      .join(" ");
    return `${path} L ${lastX.toFixed(1)} ${baseY} L ${firstX.toFixed(1)} ${baseY} Z`;
  });

  // Summary counts
  const totalCount = $derived(bookmarks.length);
  const favoriteCount = $derived(bookmarks.filter((b) => b.isFavorite).length);
</script>

<div
  class="relative p-4 flex flex-col bg-box-bg border border-border lg:flex-[2.5] min-h-[180px] lg:min-h-0 select-none font-mono"
>
  <span
    class="absolute px-1.5 text-[10px] font-bold uppercase tracking-wider -top-[7px] left-[10px] bg-background text-primary"
    >Statistics</span
  >

  <!-- Title & Chart Toggle -->
  <div
    class="flex items-center justify-between text-[9px] font-bold uppercase text-dim-foreground tracking-wider border-b border-dashed border-border-dim pb-1 mb-2 shrink-0"
  >
    <span>7-Day Activity</span>
    <div class="flex items-center gap-1.5">
      <button
        onclick={() => chartType = "bar"}
        class="cursor-pointer transition-colors hover:text-foreground {chartType === 'bar' ? 'text-primary' : 'text-muted-foreground'}"
      >
        [bar]
      </button>
      <button
        onclick={() => chartType = "line"}
        class="cursor-pointer transition-colors hover:text-foreground {chartType === 'line' ? 'text-primary' : 'text-muted-foreground'}"
      >
        [line]
      </button>
    </div>
  </div>

  <!-- Chart Container -->
  <div class="relative flex-1 w-full min-h-0 flex items-center justify-center">
    <svg
      viewBox="0 0 {svgWidth} {svgHeight}"
      class="w-full h-full text-muted-foreground"
    >
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.25" />
          <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.0" />
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      {#each [0, 0.25, 0.5, 0.75, 1] as ratio}
        {@const y = paddingTop + ratio * chartHeight}
        <line
          x1={paddingLeft}
          y1={y}
          x2={svgWidth - paddingRight}
          y2={y}
          stroke="var(--border-dim)"
          stroke-dasharray="2 2"
        />
      {/each}

      <!-- Y axis mini indicators (max & 0) -->
      <text
        x={paddingLeft - 4}
        y={paddingTop + 3}
        class="fill-dim-foreground text-[7px] text-right font-bold"
        text-anchor="end"
      >
        {maxCount()}
      </text>
      <text
        x={paddingLeft - 4}
        y={svgHeight - paddingBottom + 2}
        class="fill-dim-foreground text-[7px] text-right font-bold"
        text-anchor="end"
      >
        0
      </text>

      {#if chartType === "bar"}
        <!-- Bar Rendering -->
        {#each points() as p, idx}
          {@const barWidth = Math.max((chartWidth / 7) * 0.6, 8)}
          {@const barHeight = Math.max(svgHeight - paddingBottom - p.y, 1)}
          <!-- svelte-ignore a11y_mouse_events_have_key_events -->
          <rect
            x={p.x - barWidth / 2}
            y={p.y}
            width={barWidth}
            height={barHeight}
            fill={hoveredIdx === idx ? "var(--accent-foreground)" : "var(--primary)"}
            class="transition-colors duration-150 cursor-pointer"
            onmouseover={() => hoveredIdx = idx}
            onmouseleave={() => hoveredIdx = null}
          />
        {/each}
      {:else}
        <!-- Line/Area Rendering -->
        <path d={areaPath()} fill="url(#chartGradient)" />
        <path
          d={linePath()}
          fill="none"
          stroke="var(--primary)"
          stroke-width="1.5"
        />

        {#each points() as p, idx}
          <!-- svelte-ignore a11y_mouse_events_have_key_events -->
          <circle
            cx={p.x}
            cy={p.y}
            r={hoveredIdx === idx ? 4 : 2.5}
            fill="var(--background)"
            stroke="var(--primary)"
            stroke-width="1.5"
            class="cursor-pointer transition-all duration-150"
            onmouseover={() => hoveredIdx = idx}
            onmouseleave={() => hoveredIdx = null}
          />
        {/each}
      {/if}

      <!-- X Axis labels -->
      {#each points() as p}
        <text
          x={p.x}
          y={svgHeight - paddingBottom + 10}
          class="fill-dim-foreground text-[7px] text-center font-bold"
          text-anchor="middle"
        >
          {p.label}
        </text>
      {/each}
    </svg>

    <!-- Tooltip Overlay -->
    {#if hoveredIdx !== null}
      {@const p = points()[hoveredIdx]}
      {@const tooltipLeft = Math.min(p.x, svgWidth - 65)}
      {@const tooltipTop = Math.max(p.y - 28, 5)}
      <div
        class="absolute bg-card border border-border px-1.5 py-0.5 text-[8px] pointer-events-none z-20 font-mono shadow-md text-foreground flex flex-col leading-normal"
        style="left: calc({(tooltipLeft / svgWidth) * 100}% - 20px); top: calc({(tooltipTop / svgHeight) * 100}%);"
      >
        <span class="font-bold text-muted-foreground">{p.fullDate}</span>
        <span class="text-primary">{p.count} added</span>
      </div>
    {/if}
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
