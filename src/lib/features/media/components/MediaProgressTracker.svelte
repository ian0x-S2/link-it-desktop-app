<script lang="ts">
  import { Button } from '$lib/shared/components/ui/button';
  import { Input } from '$lib/shared/components/ui/input';
  import * as Popover from '$lib/shared/components/ui/popover';
  import * as DropdownMenu from '$lib/shared/components/ui/dropdown-menu';
  import { Calendar } from '$lib/shared/components/ui/calendar';
  import { parseDate, type DateValue } from '@internationalized/date';

  let {
    typeValue,
    progressValue = $bindable(),
    progressTotal = $bindable(),
    progressUnit = $bindable(),
    startedAtValue = $bindable(),
    finishedAtValue = $bindable(),
    autofilledEpisodes = $bindable(),
    autofilledSeasons = $bindable(),
  }: {
    typeValue: string;
    progressValue: number;
    progressTotal: number;
    progressUnit: string;
    startedAtValue: string;
    finishedAtValue: string;
    autofilledEpisodes: number | null;
    autofilledSeasons: number | null;
  } = $props();

  let startedAtDate = $state<DateValue | undefined>(undefined);
  let finishedAtDate = $state<DateValue | undefined>(undefined);

  $effect(() => {
    if (startedAtValue) {
      try {
        startedAtDate = parseDate(startedAtValue);
      } catch {
        startedAtDate = undefined;
      }
    } else {
      startedAtDate = undefined;
    }
  });

  $effect(() => {
    if (finishedAtValue) {
      try {
        finishedAtDate = parseDate(finishedAtValue);
      } catch {
        finishedAtDate = undefined;
      }
    } else {
      finishedAtDate = undefined;
    }
  });

  $effect(() => {
    const nextStr = startedAtDate ? startedAtDate.toString() : '';
    if (nextStr !== startedAtValue) {
      startedAtValue = nextStr;
    }
  });

  $effect(() => {
    const nextStr = finishedAtDate ? finishedAtDate.toString() : '';
    if (nextStr !== finishedAtValue) {
      finishedAtValue = nextStr;
    }
  });

  const isProgressSupported = $derived(typeValue === 'Series');

  const progressPercent = $derived(
    progressTotal > 0
      ? Math.min(100, Math.max(0, Math.round((progressValue / progressTotal) * 100)))
      : 0,
  );

  const progressBar = $derived.by(() => {
    const total = 20;
    const filled = Math.round((progressPercent / 100) * total);
    return `[${'█'.repeat(filled)}${'░'.repeat(total - filled)}] ${progressPercent}%`;
  });
</script>

<div
  class="w-full md:w-64 shrink-0 flex flex-col gap-3 border-t md:border-t-0 md:border-l border-dashed border-border-dim pt-3 md:pt-0 md:pl-6 justify-between"
>
  <!-- Watching Progress: Only visible if Series -->
  {#if isProgressSupported}
    <div class="flex flex-col gap-2">
      <span
        class="text-tui-2xs uppercase text-muted-foreground font-bold tracking-wider select-none"
        >Watching Progress</span
      >

      <div class="flex flex-col gap-1.5 mb-1">
        <span class="text-tui-2xs text-dim-foreground font-bold uppercase select-none"
          >Progress Unit</span
        >
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button
                variant="outline"
                size="xs"
                {...props}
                class="w-full text-left bg-transparent border border-border text-foreground font-mono text-xs px-2 py-1 outline-none focus:border-primary flex justify-between items-center cursor-pointer select-none font-bold h-auto shadow-none"
              >
                <span>{progressUnit}</span>
                <span class="text-primary font-bold">▼</span>
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            class="bg-box-bg border border-border rounded-none font-mono text-xs w-(--bits-dropdown-menu-anchor-width) min-w-(--bits-dropdown-menu-anchor-width) shadow-lg"
          >
            <DropdownMenu.RadioGroup
              value={progressUnit}
              onValueChange={(val) => {
                progressUnit = val;
                if (val === 'seasons' && autofilledSeasons !== null) {
                  progressTotal = autofilledSeasons;
                } else if (val === 'episodes' && autofilledEpisodes !== null) {
                  progressTotal = autofilledEpisodes;
                }
              }}
            >
              <DropdownMenu.RadioItem value="episodes">episodes</DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value="seasons">seasons</DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value="minutes">minutes</DropdownMenu.RadioItem>
              <DropdownMenu.RadioItem value="percent">percent</DropdownMenu.RadioItem>
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </div>

      <div class="grid grid-cols-2 gap-2">
        <div class="flex flex-col gap-0.5">
          <span class="text-tui-2xs text-dim-foreground font-bold uppercase select-none"
            >Watched</span
          >
          <Input
            type="number"
            bind:value={progressValue}
            min={0}
            class="w-full bg-transparent border border-border text-foreground font-mono text-xs px-2 py-1 outline-none focus:border-primary h-auto"
          />
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-tui-2xs text-dim-foreground font-bold uppercase select-none">Total</span
          >
          <Input
            type="number"
            bind:value={progressTotal}
            min={0}
            class="w-full bg-transparent border border-border text-foreground font-mono text-xs px-2 py-1 outline-none focus:border-primary h-auto"
          />
        </div>
      </div>

      <!-- TUI Progress Bar -->
      <div class="mt-1 text-xs font-mono font-bold text-primary select-none whitespace-pre">
        {progressBar}
      </div>
    </div>
  {:else}
    <div
      class="flex-1 flex items-center justify-center p-4 border border-border border-dashed text-center min-h-35 select-none text-dim-foreground font-mono text-tui-2xs uppercase font-bold"
    >
      // Progress tracking<br />not applicable for<br />movies / other
    </div>
  {/if}

  <div class="flex flex-col gap-2 border-t border-dashed border-border-dim pt-2">
    <div class="grid grid-cols-2 gap-2">
      <div class="flex flex-col gap-0.5">
        <span class="text-tui-2xs text-dim-foreground font-bold uppercase select-none"
          >Date Started</span
        >
        <Popover.Root>
          <Popover.Trigger>
            {#snippet child({ props })}
              <Button
                variant="outline"
                size="xs"
                {...props}
                class="w-full text-left bg-transparent border border-border text-foreground font-mono text-tui-xs px-2 py-1 outline-none focus:border-primary flex justify-between items-center cursor-pointer select-none font-bold h-auto shadow-none"
              >
                <span>{startedAtValue ? startedAtValue : 'Select Date'}</span>
                <span class="text-primary font-bold">📅</span>
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content
            class="p-0 border border-border bg-box-bg rounded-none shadow-lg w-auto"
            align="center"
          >
            <Calendar type="single" bind:value={startedAtDate} class="bg-box-bg rounded-none" />
            <div class="px-3 pb-3 pt-1 text-right flex justify-end">
              <Button
                variant="ghost"
                size="xs"
                onclick={() => {
                  startedAtDate = undefined;
                }}
                class="text-tui-2xs text-destructive hover:text-red-400 font-bold uppercase tracking-wider font-mono p-0 h-auto bg-transparent"
              >
                [Clear]
              </Button>
            </div>
          </Popover.Content>
        </Popover.Root>
      </div>

      <div class="flex flex-col gap-0.5">
        <span class="text-tui-2xs text-dim-foreground font-bold uppercase select-none"
          >Date Finished</span
        >
        <Popover.Root>
          <Popover.Trigger>
            {#snippet child({ props })}
              <Button
                variant="outline"
                size="xs"
                {...props}
                class="w-full text-left bg-transparent border border-border text-foreground font-mono text-tui-xs px-2 py-1 outline-none focus:border-primary flex justify-between items-center cursor-pointer select-none font-bold h-auto shadow-none"
              >
                <span>{finishedAtValue ? finishedAtValue : 'Select Date'}</span>
                <span class="text-primary font-bold">📅</span>
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content
            class="p-0 border border-border bg-box-bg rounded-none shadow-lg w-auto"
            align="end"
          >
            <Calendar type="single" bind:value={finishedAtDate} class="bg-box-bg rounded-none" />
            <div class="px-3 pb-3 pt-1 text-right flex justify-end">
              <Button
                variant="ghost"
                size="xs"
                onclick={() => {
                  finishedAtDate = undefined;
                }}
                class="text-tui-2xs text-destructive hover:text-red-400 font-bold uppercase tracking-wider font-mono p-0 h-auto bg-transparent"
              >
                [Clear]
              </Button>
            </div>
          </Popover.Content>
        </Popover.Root>
      </div>
    </div>
  </div>
</div>
