<script lang="ts">
  import { Input } from "$lib/components/ui/input";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { bookmarkActions } from "../repositories/config/repository";

  let {
    value = $bindable(""),
    onAdd,
    inputElement = $bindable(null),
  }: {
    value: string;
    onAdd: (
      url: string,
      metadata?: {
        title: string;
        description: string;
        imageUrl: string;
        faviconUrl: string;
      } | null
    ) => Promise<void>;
    inputElement: HTMLInputElement | null;
  } = $props();

  let loading = $state(false);
  let previewData = $state<{
    title: string;
    description: string;
    imageUrl: string;
    faviconUrl: string;
  } | null>(null);
  let validationError = $state<string | null>(null);

  let timer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    const url = value.trim();
    clearTimeout(timer);

    if (!url) {
      previewData = null;
      validationError = null;
      return;
    }

    timer = setTimeout(async () => {
      const normalized = bookmarkActions.normalizeUrl(url);
      if (bookmarkActions.validateUrl(normalized)) {
        validationError = null;
        loading = true;
        try {
          previewData = await bookmarkActions.fetchMetadata(normalized);
        } catch {
          let hostname = normalized;
          try {
            hostname = new URL(normalized).hostname;
          } catch {
            // Ignored
          }
          previewData = {
            title: hostname,
            description: "",
            imageUrl: "",
            faviconUrl: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
          };
        } finally {
          loading = false;
        }
      } else {
        previewData = null;
        validationError = "Invalid URL format";
      }
    }, 400);
  });

  async function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      const url = value.trim();
      if (!url) {
        return;
      }

      const normalized = bookmarkActions.normalizeUrl(url);
      if (!bookmarkActions.validateUrl(normalized)) {
        validationError = "Invalid URL format";
        return;
      }

      clearTimeout(timer);
      const metadataToSend = previewData;

      // Reset local inputs first so user sees immediate feedback
      value = "";
      previewData = null;
      loading = false;
      validationError = null;

      try {
        await onAdd(normalized, metadataToSend);
      } catch (error: unknown) {
        validationError =
          error instanceof Error ? error.message : "Failed to add bookmark";
      }
    } else if (event.key === "Escape") {
      clearTimeout(timer);
      value = "";
      previewData = null;
      loading = false;
      validationError = null;
    }
  }
</script>

<div class="flex flex-col mb-4 shrink-0">
  <div
    class="flex items-center gap-2 px-3 py-1.5 border border-border bg-transparent text-sm"
  >
    <span class="text-primary font-bold select-none">$</span>
    <Input
      bind:ref={inputElement}
      bind:value
      type="text"
      placeholder="Paste link to add..."
      class="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground font-mono text-xs h-auto py-0 focus-visible:border-none focus-visible:ring-0 focus-visible:ring-offset-0"
      onkeydown={handleKeydown}
    />
    {#if loading}
      <span class="text-[9px] text-muted-foreground animate-pulse"
        >[loading...]</span
      >
    {/if}
  </div>

  {#if validationError}
    <div class="text-[9px] text-destructive mt-1 font-mono px-3">
      ✗ {validationError}
    </div>
  {/if}

  {#if loading || previewData}
    <div
      class="border border-dashed border-border bg-box-bg/30 p-3 mt-2 text-xs font-mono select-none animate-[pulse_3s_infinite_alternate]"
    >
      <div
        class="flex items-center justify-between border-b border-border border-dashed pb-1.5 mb-2 text-[9px] text-muted-foreground"
      >
        <span class="font-bold uppercase tracking-wider text-foreground/80">
          {#if loading}
            [ SCRAPING METADATA... ]
          {:else}
            [ LINK PREVIEW ]
          {/if}
        </span>
        {#if !loading}
          <span class="text-[8px] opacity-60"
            >Press ENTER to add / ESC to cancel</span
          >
        {/if}
      </div>

      {#if loading}
        <div class="flex flex-col gap-2 text-[10px] text-muted-foreground">
          <div class="flex items-center gap-2">
            <Skeleton class="size-4 bg-border/40 rounded-none shrink-0" />
            <Skeleton class="h-3 bg-border/40 w-28 rounded-none shrink-0" />
          </div>
          <Skeleton class="h-3.5 bg-border/40 w-3/4 rounded-none" />
          <Skeleton class="h-3 bg-border/40 w-full rounded-none" />
        </div>
      {:else if previewData}
        <div class="flex gap-3 text-xs items-start">
          {#if previewData.imageUrl}
            <div
              class="size-16 border border-border bg-background shrink-0 overflow-hidden flex items-center justify-center"
            >
              <img
                src={previewData.imageUrl}
                alt="preview"
                class="w-full h-full object-cover"
              >
            </div>
          {:else}
            <div
              class="size-16 border border-border bg-background shrink-0 flex flex-col items-center justify-center text-[8px] text-dim-foreground p-1 text-center select-none font-bold"
            >
              <span>[ NO ]</span>
              <span>[ IMAGE ]</span>
            </div>
          {/if}

          <div class="flex-1 min-w-0 flex flex-col gap-1">
            <div class="flex items-center gap-1.5 min-w-0 text-[10px]">
              {#if previewData.faviconUrl}
                <img
                  src={previewData.faviconUrl}
                  alt=""
                  class="size-3.5 object-contain shrink-0"
                  onerror={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                >
              {/if}
              <span class="truncate font-bold text-foreground"
                >{previewData.title}</span
              >
            </div>

            {#if previewData.description}
              <p
                class="text-[10px] text-muted-foreground line-clamp-2 leading-tight"
              >
                {previewData.description}
              </p>
            {:else}
              <p class="text-[10px] text-dim-foreground italic">
                No description found.
              </p>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
