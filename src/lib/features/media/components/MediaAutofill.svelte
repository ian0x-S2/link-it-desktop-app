<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { Button } from '$lib/shared/components/ui/button';
  import { Input } from '$lib/shared/components/ui/input';
  import { Skeleton } from '$lib/shared/components/ui/skeleton';

  interface IMDbMedia {
    title: string;
    year: string;
    imageUrl: string;
    actors: string;
    imdbUrl: string;
    imdbId: string;
  }

  interface YouTubeMedia {
    title: string;
    author: string;
    imageUrl: string;
    description: string;
  }

  interface IMDbRawItem {
    '#TITLE'?: string;
    '#YEAR'?: number;
    '#IMG_POSTER'?: string;
    '#ACTORS'?: string;
    '#IMDB_URL'?: string;
    '#IMDB_ID'?: string;
  }

  interface TVmazeEpisode {
    season?: number;
  }

  interface AutofillMetadata {
    title?: string;
    creator?: string;
    imageUrl?: string;
    url?: string;
    description?: string;
    type?: 'Movie' | 'Series' | 'YouTube' | 'Other';
    progressValue?: number;
    progressTotal?: number;
    progressUnit?: string;
    autofilledEpisodes?: number | null;
    autofilledSeasons?: number | null;
  }

  let props = $props<{
    onImport: (metadata: AutofillMetadata) => void;
  }>();

  // Autofill metadata search local states
  let autofillSearchQuery = $state('');
  let imdbResults = $state<IMDbMedia[]>([]);
  let isSearching = $state(false);

  async function searchIMDb(query: string): Promise<IMDbMedia[]> {
    try {
      const response = await fetch(`https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) return [];
      const data = await response.json();
      if (!data.ok || !data.description) return [];
      return data.description.map((item: IMDbRawItem) => ({
        title: item['#TITLE'] || '',
        year: item['#YEAR'] ? String(item['#YEAR']) : '',
        imageUrl: item['#IMG_POSTER'] || '',
        actors: item['#ACTORS'] || '',
        imdbUrl: item['#IMDB_URL'] || '',
        imdbId: item['#IMDB_ID'] || '',
      }));
    } catch {
      return [];
    }
  }

  async function fetchYouTubeMetadata(url: string): Promise<YouTubeMedia | null> {
    try {
      const [oEmbedRes, backendRes] = await Promise.allSettled([
        fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`).then((r) =>
          r.ok ? r.json() : null
        ),
        invoke<{ title: string | null; description: string | null; image_url: string | null }>(
          'fetch_metadata',
          { url }
        ).catch(() => null),
      ]);

      const oEmbed = oEmbedRes.status === 'fulfilled' ? oEmbedRes.value : null;
      const backend = backendRes.status === 'fulfilled' ? backendRes.value : null;

      if (!oEmbed && !backend) return null;

      return {
        title: oEmbed?.title || backend?.title || '',
        author: oEmbed?.author_name || '',
        imageUrl: oEmbed?.thumbnail_url || backend?.image_url || '',
        description: backend?.description || '',
      };
    } catch {
      return null;
    }
  }

  async function handleSearchMedia() {
    const q = autofillSearchQuery.trim();
    if (!q) return;
    isSearching = true;
    imdbResults = [];
    try {
      const isYoutube = q.includes('youtube.com/') || q.includes('youtu.be/');
      if (isYoutube) {
        const ytData = await fetchYouTubeMetadata(q);
        if (ytData) {
          props.onImport({
            title: ytData.title,
            creator: ytData.author,
            imageUrl: ytData.imageUrl,
            description: ytData.description,
            url: q,
            type: 'YouTube',
          });
          autofillSearchQuery = '';
        }
      } else {
        imdbResults = await searchIMDb(q);
      }
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.error(e);
    } finally {
      isSearching = false;
    }
  }

  async function fetchWikipediaSummary(title: string): Promise<string> {
    try {
      const searchRes = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          title
        )}&format=json&origin=*`
      );
      if (!searchRes.ok) return '';
      const searchData = await searchRes.json();
      const firstResult = searchData.query?.search?.[0];
      if (!firstResult) return '';

      const summaryRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          firstResult.title
        )}`
      );
      if (!summaryRes.ok) return '';
      const summaryData = await summaryRes.json();
      if (summaryData.type === 'disambiguation') return '';
      return summaryData.extract || '';
    } catch {
      return '';
    }
  }

  async function fetchTVmazeInfo(imdbId: string): Promise<{ totalEpisodes: number; totalSeasons: number } | null> {
    try {
      if (!imdbId) return null;
      const lookupRes = await fetch(`https://api.tvmaze.com/lookup/shows?imdb=${imdbId}`);
      if (!lookupRes.ok) return null;
      const showData = await lookupRes.json();
      const showId = showData.id;
      if (!showId) return null;

      const episodesRes = await fetch(`https://api.tvmaze.com/shows/${showId}/episodes`);
      if (!episodesRes.ok) return null;
      const episodesData = await episodesRes.json();
      if (!Array.isArray(episodesData) || episodesData.length === 0) return null;

      const seasons: number[] = [];
      episodesData.forEach((ep: TVmazeEpisode) => {
        if (ep.season && !seasons.includes(ep.season)) {
          seasons.push(ep.season);
        }
      });

      return {
        totalEpisodes: episodesData.length,
        totalSeasons: seasons.length,
      };
    } catch {
      return null;
    }
  }

  async function applyIMDbMetadata(result: IMDbMedia) {
    props.onImport({
      title: result.title,
      creator: result.actors,
      imageUrl: result.imageUrl,
      url: result.imdbUrl,
      description: result.year ? `Released in ${result.year}.` : '',
      type: 'Movie',
      autofilledEpisodes: null,
      autofilledSeasons: null,
    });

    imdbResults = [];
    autofillSearchQuery = '';

    // Asynchronously fetch Wikipedia summary in the background
    fetchWikipediaSummary(result.title).then((wikiSummary) => {
      if (wikiSummary) {
        props.onImport({ description: wikiSummary });
      }
    });

    // Asynchronously check if it's a TV show on TVmaze to get episodes and seasons count
    if (result.imdbId) {
      fetchTVmazeInfo(result.imdbId).then((info) => {
        if (info !== null) {
          props.onImport({
            type: 'Series',
            progressTotal: info.totalEpisodes,
            progressValue: 0,
            progressUnit: 'episodes',
            autofilledEpisodes: info.totalEpisodes,
            autofilledSeasons: info.totalSeasons,
          });
        }
      });
    }
  }
</script>

<div class="flex flex-col gap-2 border-b border-dashed border-border-dim pb-3">
  <div class="flex flex-wrap items-center gap-2">
    <span class="text-tui-2xs font-bold text-primary select-none uppercase tracking-widest"
      >// Import Metadata:</span
    >
    <Input
      type="text"
      bind:value={autofillSearchQuery}
      onkeydown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSearchMedia();
        }
      }}
      placeholder="Search Movie/Series or paste YouTube link..."
      class="bg-transparent border border-border text-foreground font-mono text-xs px-2 py-0.5 outline-none focus:border-primary flex-1 max-w-md h-auto"
    />
    <Button
      variant="outline"
      size="xs"
      onclick={handleSearchMedia}
      disabled={isSearching}
      class="px-2 py-0.5 border border-primary text-primary hover:bg-primary hover:text-background transition-colors text-tui-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono cursor-pointer h-auto"
    >
      {isSearching ? '[searching...]' : '[search / autofill]'}
    </Button>
  </div>

  {#if isSearching}
    <div
      class="border border-border p-2 bg-box-bg flex flex-col gap-1.5 max-h-48 overflow-y-auto mt-1 font-mono"
    >
      <div
        class="text-tui-xs text-muted-foreground font-bold select-none border-b border-border pb-1 uppercase tracking-wider animate-pulse"
      >
        // Searching...
      </div>
      {#each Array(3) as _, i (i)}
        <div class="p-1.5 flex gap-3 items-center">
          <Skeleton class="w-7 h-10 bg-muted/20 shrink-0" />
          <div class="flex-1 flex flex-col gap-1.5">
            <Skeleton class="h-3.5 w-1/2 bg-muted/20" />
            <Skeleton class="h-2.5 w-1/3 bg-muted/20" />
          </div>
        </div>
      {/each}
    </div>
  {:else if imdbResults.length > 0}
    <div
      class="border border-border p-2 bg-box-bg flex flex-col gap-1.5 max-h-48 overflow-y-auto mt-1"
    >
      <div
        class="text-tui-xs text-muted-foreground font-bold select-none border-b border-border pb-1 flex justify-between uppercase"
      >
        <span>Select a match to import details:</span>
        <Button
          variant="ghost"
          size="xs"
          onclick={() => (imdbResults = [])}
          class="text-destructive font-bold hover:underline cursor-pointer p-0 h-auto hover:bg-transparent bg-transparent shadow-none"
          >[close]</Button
        >
      </div>
      {#each imdbResults as result, index (result.title + result.year + index)}
        <Button
          variant="ghost"
          size="xs"
          onclick={() => applyIMDbMetadata(result)}
          class="text-left w-full hover:bg-primary/10 p-1.5 flex gap-3 items-center text-tui-xs transition-colors border-b border-border/30 last:border-none cursor-pointer h-auto rounded-none justify-start shadow-none"
        >
          {#if result.imageUrl}
            <img
              src={result.imageUrl}
              alt="poster"
              class="w-7 h-10 object-cover border border-border shrink-0"
            />
          {:else}
            <div
              class="w-7 h-10 border border-border border-dashed flex items-center justify-center text-[8px] text-dim-foreground font-bold shrink-0"
            >
              [NO COV]
            </div>
          {/if}
          <div class="flex-1 min-w-0">
            <div class="font-bold truncate text-foreground font-mono">
              {result.title} {#if result.year}({result.year}){/if}
            </div>
            <div class="text-tui-xs text-muted-foreground truncate font-mono">
              Cast: {result.actors || 'Unknown'}
            </div>
          </div>
        </Button>
      {/each}
    </div>
  {/if}
</div>
