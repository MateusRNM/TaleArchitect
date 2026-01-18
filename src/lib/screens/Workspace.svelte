<script lang="ts">
    import { onMount } from 'svelte';
    import { projectStore } from '$lib/stores/project.svelte';
    import { appState } from '$lib/stores/app.svelte';
    import { ArrowLeft, Save } from 'lucide-svelte';
    import { uiManager } from '$lib/stores/ui.svelte';
    import { commandRegistry } from '$lib/services/commands';
    import { registerWorkspaceCommands } from '$lib/controllers/workspaceController';
    import CommandPalette from '$lib/components/CommandPalette.svelte';
    import ToastContainer from '$lib/components/ToastContainer.svelte';
    let isSaving = $state(false);
    let activeTabDefinition = $derived(uiManager.tabs.find(t => t.id === appState.activeTab));

    onMount(() => {
        registerWorkspaceCommands();
    });

    $effect(() => {
        if(projectStore.current?.data.autosave && projectStore.current.changesUnsaved) {
            handleSave();
        }
    });

    async function handleSave() {
        isSaving = true;
        await commandRegistry.execute('project:save');
        setTimeout(() => isSaving = false, 800);
    }

    function handleKeydown(event: KeyboardEvent) {
        const target = event.target as HTMLElement;
        const isEditingText = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

        const isCtrl = event.ctrlKey || event.metaKey; 
        const key = event.key.toLowerCase();

        if (isCtrl && key === 'z' && !event.shiftKey && !isEditingText) {
            event.preventDefault();
            commandRegistry.execute('history:undo');
            return;
        }

        if (isCtrl && !isEditingText) {
            if (key === 'z' && event.shiftKey) {
                event.preventDefault();
                commandRegistry.execute('history:redo');
                return;
            }
        }
        
        if (isCtrl && key === 's') {
            event.preventDefault();
            handleSave();
        }
    }

    async function closeProject() {
        await commandRegistry.execute('project:close');
    }
</script>

<ToastContainer/>
<CommandPalette/>

<svelte:window onkeydown={handleKeydown} />

<div class="flex flex-col h-screen w-screen bg-background text-text-main">
    
    <header class="h-16 flex-none flex items-center justify-between px-4 bg-surface border-b border-text-muted/20 shadow-sm z-10">
        
        <div class="flex items-center gap-4 w-1/4">
            <button 
                onclick={closeProject}
                class="p-2 rounded-lg text-text-muted hover:bg-background hover:text-primary transition-colors cursor-pointer" 
                title="Fechar Projeto"
            >
                <ArrowLeft size={20} />
            </button>
            
            <div class="flex flex-col">
                <h1 class="font-serif font-bold text-lg leading-tight truncate max-w-50">
                    {projectStore.current?.data.name || 'Projeto Sem Nome'}
                </h1>
                <span class="text-[10px] text-text-muted uppercase tracking-wider font-mono">
                    TaleArchitect
                </span>
            </div>
        </div>

        <nav class="flex items-center gap-2 bg-background/50 p-1 rounded-lg border border-text-muted/10">
            {#each uiManager.sortedTabs as tab (tab.id)}
                <button 
                    onclick={() => commandRegistry.execute('ui:navigate', { tabId: tab.id })}
                    class="
                        flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer
                        {appState.activeTab === tab.id 
                            ? 'bg-primary text-background shadow-md' 
                            : 'text-text-muted hover:bg-surface hover:text-text-main'}
                    "
                >
                    <tab.icon size={16} strokeWidth={appState.activeTab === tab.id ? 2.5 : 2} />
                    {tab.label}
                </button>
            {/each}
        </nav>

        <div class="flex items-center justify-end gap-3 w-1/4">
            <div class="flex items-center gap-2 text-xs font-mono transition-colors duration-300
                {projectStore.current?.changesUnsaved ? 'text-secondary' : 'text-text-muted/50'}
            ">
                {#if isSaving}
                    <span class="animate-pulse">Salvando...</span>
                {:else if projectStore.current?.changesUnsaved}
                    <span>● Não salvo</span>
                {:else}
                    <span>Salvo</span>
                {/if}
            </div>

            <button 
                onclick={handleSave}
                class="p-2 rounded-lg text-text-muted hover:bg-background hover:text-primary transition-colors border border-transparent hover:border-text-muted/10 cursor-pointer"
                title="Salvar (Ctrl+S)"
            >
                <Save size={20} />
            </button>
        </div>
    </header>

    <main class="flex-1 relative bg-background overflow-x-hidden overflow-y-auto scrollbar-hide">
        
        {#if activeTabDefinition}
            <activeTabDefinition.component/>
        {:else}
            <div class="flex items-center justify-center h-full text-text-muted">Aba não encontrada</div>
        {/if}

    </main>

</div>