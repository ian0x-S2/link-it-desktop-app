<script lang="ts">
 import {bookmarkStore} from "../lib/stores/bookmark.svelte"

 bookmarkStore.load()

  </script>


  <div>
    <button onclick={()=>{
      bookmarkStore.create({
        title:"test",
        url:"https://www.google.com",
        tags:[],
      })
    }}>
      add bookmark
    </button>

    {#each bookmarkStore.items as bookmark}
      <div>
        {bookmark.title} - {bookmark.url}
      </div>
      
    {/each}
  </div>