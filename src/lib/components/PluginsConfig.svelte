<script lang="ts">
    import { pluginLoader } from '$lib/services/pluginLoader';
    import { FolderOpen, RefreshCw, Package } from 'lucide-svelte';
    
    let plugins = $state(Array.from(pluginLoader.loadedPlugins.values()));
    let isLoading = $state(false);

    async function handleOpenFolder() {
        await pluginLoader.openPluginsFolder();
    }

    async function handleReload() {
        isLoading = true;
        pluginLoader.loadedPlugins.clear();
        
        await pluginLoader.init();
        
        plugins = Array.from(pluginLoader.loadedPlugins.values());
        setTimeout(() => isLoading = false, 500);
    }
</script>

<div class="p-8 max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-8">
        <div>
            <h2 class="text-2xl font-serif font-bold text-text-main">Plugins Instalados</h2>
        </div>
        
        <div class="flex gap-2">
            <button 
                onclick={handleOpenFolder}
                class="flex items-center gap-2 px-4 py-2 bg-surface border border-text-muted/20 rounded-lg hover:bg-surface-hover transition-colors text-sm font-bold cursor-pointer"
            >
                <FolderOpen size={16} /> Abrir Pasta
            </button>
            <button 
                onclick={handleReload}
                class="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg hover:brightness-110 transition-colors text-sm font-bold cursor-pointer"
                disabled={isLoading}
            >
                <RefreshCw size={16} class={isLoading ? 'animate-spin' : ''} /> 
                {isLoading ? 'Carregando...' : 'Recarregar'}
            </button>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each plugins as plugin}
            <div class="bg-surface p-4 rounded-xl border border-text-muted/10 flex items-start gap-4">
                <div class="bg-primary/10 p-3 rounded-lg text-primary">
                    <Package size={24} />
                </div>
                <div>
                    <h3 class="font-bold text-text-main">{plugin.name}</h3>
                    <div class="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                        <span class="bg-surface-secondary px-1.5 py-0.5 rounded border border-text-muted/10">v{plugin.version}</span>
                        <span>{plugin.id}</span>
                    </div>
                    {#if plugin.description}
                        <p class="text-sm text-text-muted mt-2 leading-relaxed">{plugin.description}</p>
                    {/if}
                </div>
            </div>
        {/each}

        {#if plugins.length === 0}
            <div class="col-span-full py-12 text-center text-text-muted border-2 border-dashed border-text-muted/10 rounded-xl">
                <p>Nenhum plugin detectado.</p>
                <p class="text-sm mt-2">Clique em "Abrir Pasta" e instale seus plugins lá.</p>
            </div>
        {/if}
    </div>
</div>