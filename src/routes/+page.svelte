<script lang="ts">
  import { onMount } from 'svelte';
  // No SvelteKit, prefira usar o alias $lib em vez de caminhos relativos
  import { bookmarkStore } from '$lib/stores/bookmark.svelte';
  import type { Bookmark } from '$lib/types/bookmark';

  // 1. onMount é CRUCIAL aqui.
  // O SvelteKit tenta renderizar a página no servidor (Node.js) por padrão.
  // Como o SQLite do Tauri só existe no navegador (cliente), chamá-lo fora do 
  // onMount causará um erro de "Plugin não encontrado" ou "window is not defined".
  onMount(() => {
    bookmarkStore.load();
  });

  function addTestBookmark() {
    // 2. Preenchendo todos os campos exigidos pelo Omit<Bookmark, "id" | "createdAt" | "updatedAt">
    // para evitar erros de tipagem do TypeScript.
    bookmarkStore.create({
      title: 'Google',
      url: 'https://www.google.com',
      imageUrl: '',
      faviconUrl: 'https://www.google.com/favicon.ico',
      description: 'The search engine',
      tags: ['search', 'test'],
      isFavorite: false
    });
  }
</script>

<main>
  <h1>Meus Bookmarks</h1>

  <button onclick={addTestBookmark}>
    + Add Bookmark
  </button>

  <hr />

  {#if bookmarkStore.items.length === 0}
    <p>Nenhum bookmark salvo ainda. Clique no botão acima!</p>
  {:else}
    <!-- 3. Adicionamos (bookmark.id) no each. Isso é uma "key" que ajuda o Svelte 
         a otimizar as atualizações da DOM quando deletamos ou alteramos um item. -->
    <ul>
      {#each bookmarkStore.items as bookmark (bookmark.id)}
        <li>
          <div class="bookmark-info">
            <strong>{bookmark.title}</strong> 
            <span class="fav">{bookmark.isFavorite ? '★' : '☆'}</span>
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
            <button class="danger" onclick={() => bookmarkStore.delete(bookmark.id)}>
              Deletar
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }
  
  button {
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid #ccc;
    background: #f4f4f4;
  }
  
  button:hover {
    background: #e2e2e2;
  }

  .danger {
    background: #ffdddd;
    border-color: #ff9999;
    color: #cc0000;
  }

  ul {
    list-style: none;
    padding: 0;
    margin-top: 2rem;
  }

  li {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .fav {
    color: gold;
    font-size: 1.2rem;
    margin-left: 0.5rem;
  }

  .tags {
    margin-top: 0.5rem;
  }

  .tag {
    background: #e0f7fa;
    color: #006064;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
    margin-right: 4px;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>