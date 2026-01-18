<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { onMount } from "svelte";
  let { children } = $props();
  import "./app.css";

  onMount(() => {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            const isCtrl = e.ctrlKey || e.metaKey;
            const isShift = e.shiftKey;

            if (
                key === 'f5' ||                    
                (isCtrl && key === 'r') ||              
                key === 'f12' ||                        
                (isCtrl && isShift && key === 'i') ||   
                (isCtrl && isShift && key === 'c') ||    
                (isCtrl && key === 'p') ||               
                (isCtrl && key === 'u')                  
            ) {
                e.preventDefault();
            }
        });
    });
</script> 

<main class="flex h-screen w-screen overflow-x-hidden scrollbar-hide">
  <section class="flex-1 relative min-w-0"  in:fly out:fade>
    {@render children()}
  </section>
</main>