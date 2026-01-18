<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import "./app.css";
  let { children } = $props();

  function handleKeyDown(event: KeyboardEvent) {
    if(event.key == 'F5') {
      event.preventDefault();
    }
  }
</script> 

<svelte:window onkeydown={handleKeyDown}/>

<main class="flex h-screen w-screen overflow-x-hidden scrollbar-hide">
  <section class="flex-1 relative min-w-0"  in:fly out:fade>
    {@render children()}
  </section>
</main>