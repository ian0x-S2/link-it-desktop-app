<script lang="ts">
  import { Button } from "$lib/components/ui/button";

  let {
    selectedCategory = $bindable(),
    bookmarkCount = 0,
    favoriteCount = 0,
    currentTheme,
    themes = [],
    changeTheme,
    onAddLinkClick,
  }: {
    selectedCategory: "inbox" | "favorites" | "trash";
    bookmarkCount: number;
    favoriteCount: number;
    currentTheme: string;
    themes: readonly string[];
    changeTheme: (theme: any) => void;
    onAddLinkClick: () => void;
  } = $props();
</script>

<aside class="flex w-full h-full flex-col gap-4 select-none shrink-0">
  <!-- WORKSPACES Box -->
  <div class="relative p-4 flex flex-col bg-box-bg border border-border">
    <span
      class="absolute px-1.5 text-[10px] font-bold uppercase tracking-wider -top-[7px] left-[10px] bg-background text-primary"
      >Workspaces</span
    >
    <div class="space-y-1 text-xs">
      <div class="flex items-center justify-between text-primary font-bold">
        <span>* My Workspace</span>
        <span class="text-[10px] text-muted-foreground">@my-workspace</span>
      </div>
      <div class="text-dim-foreground hover:text-foreground cursor-pointer">
        * New workspace...
      </div>
    </div>
  </div>

  <!-- CATEGORIES Box -->
  <div
    class="relative flex flex-col bg-box-bg border border-border flex-1 min-h-0"
  >
    <span
      class="absolute px-1.5 text-[10px] font-bold uppercase tracking-wider -top-[7px] left-[10px] bg-background text-primary z-10"
      >Categories</span
    >
    <div
      class="flex-1 overflow-y-auto p-4 min-h-0 [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-primary"
    >
      <div class="space-y-1 text-xs">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={() => selectedCategory = 'inbox'}
          class="flex items-center justify-between cursor-pointer py-0.5 px-1.5 transition-colors {selectedCategory === 'inbox' ? 'bg-primary text-background font-bold' : 'text-foreground hover:bg-accent'}"
        >
          <span>1 Inbox</span>
          <span
            class={selectedCategory === 'inbox' ? 'text-background' : 'text-muted-foreground'}
            >[{bookmarkCount}]</span
          >
        </div>

        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={() => selectedCategory = 'favorites'}
          class="flex items-center justify-between cursor-pointer py-0.5 px-1.5 transition-colors {selectedCategory === 'favorites' ? 'bg-primary text-background font-bold' : 'text-foreground hover:bg-accent'}"
        >
          <span>2 Favorites</span>
          <span
            class={selectedCategory === 'favorites' ? 'text-background' : 'text-muted-foreground'}
            >[{favoriteCount}]</span
          >
        </div>

        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          onclick={() => selectedCategory = 'trash'}
          class="flex items-center justify-between cursor-pointer py-0.5 px-1.5 transition-colors {selectedCategory === 'trash' ? 'bg-primary text-background font-bold' : 'text-foreground hover:bg-accent'}"
        >
          <span>3 Trash</span>
          <span
            class={selectedCategory === 'trash' ? 'text-background' : 'text-muted-foreground'}
            >[0]</span
          >
        </div>
      </div>
    </div>
  </div>

  <!-- ACTIONS Box -->
  <div
    class="relative p-4 flex flex-col bg-box-bg border border-border gap-2 shrink-0"
  >
    <span
      class="absolute px-1.5 text-[10px] font-bold uppercase tracking-wider -top-[7px] left-[10px] bg-background text-primary"
      >Actions</span
    >
    <Button
      onclick={onAddLinkClick}
      size="sm"
      class="font-mono uppercase tracking-[0.05em] text-[0.65rem] rounded-none shadow-none border border-primary bg-primary text-background font-bold transition-all duration-100 ease-linear cursor-pointer h-auto py-0.5 px-2 hover:bg-foreground hover:border-foreground hover:text-background w-full"
    >
      [a] Add Link
    </Button>
    <Button
      onclick={() => {
        const nextIdx = (themes.indexOf(currentTheme) + 1) % themes.length;
        changeTheme(themes[nextIdx]);
      }}
      size="sm"
      class="font-mono uppercase tracking-[0.05em] text-[0.65rem] rounded-none shadow-none border border-border bg-transparent text-muted-foreground transition-all duration-100 ease-linear cursor-pointer h-auto py-0.5 px-2 hover:border-primary hover:bg-accent hover:text-primary w-full"
    >
      [t] Toggle Theme: {currentTheme}
    </Button>

    <div class="space-y-0.5 text-[10px] text-muted-foreground mt-1 select-none">
      <div>e Export Links</div>
      <div>i Import Links</div>
      <div>, Settings</div>
    </div>
  </div>
</aside>
