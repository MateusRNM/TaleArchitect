<script lang="ts">
    import { projectStore } from '$lib/stores/project.svelte';
    import { appState } from '$lib/stores/app.svelte';
    import { ask } from "@tauri-apps/plugin-dialog";
    import { Map, Calendar, Users, Settings, ArrowLeft, Save } from 'lucide-svelte';
    import SectionMap from './sections/SectionMap.svelte';
    import SectionTimeline from './sections/SectionTimeline.svelte';
    import SectionCharacters from './sections/SectionCharacters.svelte';
    import SectionSettings from './sections/SectionSettings.svelte';

    let isSaving = $state(false);

    async function handleSave() {
        if (projectStore.current) {
            isSaving = true;
            await projectStore.save();
            setTimeout(() => isSaving = false, 800);
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            handleSave();
        }
    }

    async function closeProject() {
        if(projectStore.current?.changesUnsaved) {
            const confirmed = await ask('O seu projeto possui alterações que não foram salvas. Deseja salvar antes de sair?', {
                title: 'Alterações não salvas',
                kind: 'warning'
            });
            if(confirmed) { 
                await projectStore.save();
            }
        }
        projectStore.close();
        appState.goToLauncher();
    }
</script>

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
            {#snippet tabButton(id, label, Icon)}
                <button 
                    onclick={() => appState.activeTab = id}
                    class="
                        flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer
                        {appState.activeTab === id 
                            ? 'bg-primary text-background shadow-md' 
                            : 'text-text-muted hover:bg-surface hover:text-text-main'}
                    "
                >
                    <Icon size={16} strokeWidth={appState.activeTab === id ? 2.5 : 2} />
                    {label}
                </button>
            {/snippet}

            {@render tabButton('map', 'Mapa', Map)}
            {@render tabButton('timeline', 'Timeline', Calendar)}
            {@render tabButton('characters', 'Personagens', Users)}
            {@render tabButton('settings', 'Configurações', Settings)}
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

    <main class="flex-1 relative bg-background">
        {#if appState.activeTab === 'map'}
            <SectionMap />
        {:else if appState.activeTab === 'timeline'}
            <SectionTimeline />
        {:else if appState.activeTab === 'characters'}
            <SectionCharacters />
        {:else if appState.activeTab === 'settings'}
            <SectionSettings />
        {/if}
    </main>

</div>