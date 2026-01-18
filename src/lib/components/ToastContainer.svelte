<script lang="ts">
    import { toastStore } from '$lib/stores/toasts.svelte';
    import { fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-svelte';

    const styles = {
        success: { icon: CheckCircle, class: 'border-green-500/50 bg-green-500/10 text-green-600' },
        error:   { icon: XCircle,     class: 'border-red-500/50 bg-red-500/10 text-red-600' },
        warning: { icon: AlertCircle, class: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600' },
        info:    { icon: Info,        class: 'border-blue-500/50 bg-blue-500/10 text-blue-600' }
    };
</script>

<div class="fixed bottom-4 right-4 z-200 flex flex-col gap-2 w-full max-w-sm pointer-events-none p-4">
    
    {#each toastStore.items as toast (toast.id)}
        {@const style = styles[toast.type]}
        
        <div 
            animate:flip={{ duration: 300 }}
            transition:fly={{ y: 20, duration: 300 }}
            class="pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-md bg-surface/95 {style.class}"
        >
            <style.icon size={20} class="shrink-0 mt-0.5" />
            
            <div class="flex-1 text-sm font-medium text-text-main">
                {toast.message}
            </div>

            <button 
                onclick={() => toastStore.remove(toast.id)} 
                class="opacity-50 hover:opacity-100 transition-opacity"
            >
                <X size={16} />
            </button>
        </div>
    {/each}

</div>