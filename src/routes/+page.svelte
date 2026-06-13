<script lang="ts">
  import { onMount } from "svelte";
  import { bookmarkStore } from "$lib/stores/bookmark.svelte";
  import type { Bookmark } from "$lib/types/bookmark";

 
  onMount(() => {
  bookmarkStore.load();
  });

  function addTestBookmark() {

    bookmarkStore.create({
      title: "Google",
      url: "https://www.google.com",
      imageUrl: "",
      faviconUrl: "https://www.google.com/favicon.ico",
      description: "The search engine",
      tags: ["search", "test"],
      isFavorite: false,
    });
  }
</script>

<main>
  <h1>Meus Bookmarks</h1>

  <button class="bg-red-500" onclick={addTestBookmark}> + Add Bookmark </button>

  <hr />

  {#if bookmarkStore.items.length === 0}
    <p>Nenhum bookmark salvo ainda. Clique no botão acima!</p>
  {:else}
    
    <ul>
      {#each bookmarkStore.items as bookmark (bookmark.id)}
        <li>
          <div class="bookmark-info">
            <strong>{bookmark.title}</strong>
            <span class="fav">{bookmark.isFavorite ? "★" : "☆"}</span>
            <br />
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
              {bookmark.url}
            </a>
            {#if bookmark.tags.length > 0}
              <div class="tags">
                {#each bookmark.tags as tag}
                  <span class="tag">#{tag}</span>
                {/each}
              </div>
            {/if}
          </div>

          <div class="actions">
            <button onclick={() => bookmarkStore.toggleFavorite(bookmark.id)}>
              Toggle Favorito
            </button>
            <button
              class="danger"
              onclick={() => bookmarkStore.delete(bookmark.id)}
            >
              Deletar
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</main>
