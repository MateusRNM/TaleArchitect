<script lang="ts">
    import { projectStore } from '$lib/stores/project.svelte';
    import { appState } from '$lib/stores/app.svelte';
    import { save, open } from '@tauri-apps/plugin-dialog';
    import { onMount } from 'svelte';
    import { Folder, Calendar, Clock, ArrowRight, FolderOpen, Plus, ArrowLeft } from 'lucide-svelte';
    import { exists } from '@tauri-apps/plugin-fs';
    import type { RecentProject } from '$lib/models/project';

    let recentProjects: RecentProject[] = $state([]);
    let creatingProject: boolean = $state(false);
    let newProjectName: string = $state("");
    let errorMsg: string = $state("");

    function sortAndSaveProjects() {
        recentProjects.sort((a, b) => {
            return new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime();
        });
        localStorage.setItem('recentProjects', JSON.stringify(recentProjects));
    }

    onMount(async () => {
        const saved = localStorage.getItem('recentProjects');
        if(saved){
            recentProjects = JSON.parse(saved);
            const checkExistence = await Promise.all(
                recentProjects.map(async (p) => {
                    const fileExists = await exists(p.dir);
                    return fileExists ? p : null;
                })
            );
            recentProjects = checkExistence.filter((p) => p !== null) as RecentProject[];
            sortAndSaveProjects();
        } 
    });

    function manageCreateProject() {
        if(!creatingProject) {
            creatingProject = true;
            newProjectName = "";
            errorMsg = "";
        } else {
            creatingProject = false;
            newProjectName = "";
            errorMsg = "";
        }
    }

    async function handleCreate() {
        errorMsg = "";
        if(newProjectName === '') {
            errorMsg = "Digite um nome para o projeto.";
            return;
        }

        const path = await save({
            filters: [{ name: 'Projeto TaleArchitect', extensions: ['talearc'] }]
        });

        if (path) {            
            try {
                await projectStore.create(newProjectName, path);
                recentProjects.push({
                    name: projectStore.current?.data.name || '',
                    dir: path,
                    createdAt: projectStore.current?.data.createdAt || '',
                    lastOpenedAt: projectStore.current?.data.lastOpenedAt || '',
                });
                sortAndSaveProjects();
                appState.goToWorkspace();
            } catch (e) {
                console.error(e);
            }
        }
    }

    async function handleOpen(pathdir: string | null) {
        let path;
        if(!pathdir) {
            path = await open({
                multiple: false,
                filters: [{ name: 'Projeto TaleArchitect', extensions: ['talearc'] }]
            });
        } else {
            path = pathdir;
        }

        if (path && typeof path === 'string') {
            try {
                await projectStore.load(path);
                let inList = recentProjects.findIndex((v: RecentProject) => v.dir === path);
                if(inList !== -1) {
                    recentProjects[inList].lastOpenedAt = projectStore.current?.data.lastOpenedAt || '';
                    if(projectStore.current?.data.name) {
                        recentProjects[inList].name = projectStore.current.data.name;
                    }
                } else {
                    recentProjects.push({
                        name: projectStore.current?.data.name || '',
                        dir: path,
                        createdAt: projectStore.current?.data.createdAt || '',
                        lastOpenedAt: projectStore.current?.data.lastOpenedAt || '',
                    });
                }
                sortAndSaveProjects();
                appState.goToWorkspace();
            } catch (e) {
            }
        }
    }
</script>

<div class="flex h-full flex-col items-center justify-center gap-6 bg-background p-4">
    
    <div class="object-cover w-32 h-32 md:w-40 md:h-40 mb-2 drop-shadow-xl transition-transform hover:scale-105 duration-500">
        <img class="w-full h-full" src="images/icon.png" alt="Logo TaleArchitect">
    </div>

    <div class="flex flex-col justify-between items-center gap-4 rounded-xl border border-text-muted/30 shadow-2xl w-full max-w-lg h-150 p-6 bg-surface">
        
        {#if !creatingProject}
            <div class="w-full space-y-4 flex flex-col h-full overflow-hidden">
                
                <div class="flex items-center justify-between px-1 border-b border-text-muted/20 pb-2">
                    <h2 class="text-xl font-serif font-bold text-text-main">Projetos Recentes</h2>
                    
                    <span class="text-xs text-text-muted uppercase tracking-wider font-bold bg-background px-2 py-1 rounded-full shadow-sm">
                        {recentProjects.length} Encontrados
                    </span>
                </div>

                <div class="flex flex-col gap-3 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-text-muted/50 scrollbar-hide">
                    {#each recentProjects as project}
                        <button onclick={() => handleOpen(project.dir)} class="group flex flex-col gap-2 rounded-lg border border-text-muted/20 bg-background p-4 text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.98] cursor-pointer w-full focus:outline-none focus:ring-2 focus:ring-primary/50">
                            
                            <div class="flex w-full items-start justify-between">
                                <div class="overflow-hidden">
                                    <h3 class="font-bold text-lg text-text-main group-hover:text-primary transition-colors truncate w-full">
                                        {project.name}
                                    </h3>
                                    <p class="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                                        <Clock size={12} />
                                        Aberto em {new Date(project.lastOpenedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                
                                <ArrowRight class="text-secondary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 shrink-0" size={18} />
                            </div>

                            <div class="flex items-center justify-between border-t border-text-muted/10 pt-2 mt-1">
                                <div class="flex items-center gap-1.5 text-xs text-text-muted font-mono opacity-80" title={project.dir}>
                                    <Folder size={12} class="shrink-0" />
                                    <span class="truncate max-w-45">
                                        {project.dir}
                                    </span>
                                </div>
                                
                                <div class="hidden sm:flex items-center gap-1.5 text-xs text-text-muted" title="Data de Criação">
                                    <Calendar size={12} />
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </button>
                    {/each}
                    
                    {#if recentProjects.length === 0}
                        <div class="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-text-muted/30 text-text-muted/70 gap-2">
                            <FolderOpen size={48} strokeWidth={1} class="opacity-50"/>
                            <p class="font-serif italic text-sm">Nenhum projeto encontrado...</p>
                        </div>
                    {/if}
                </div>
            </div>

            <div class="w-full flex flex-col gap-3 mt-2">
                <button onclick={manageCreateProject} class="flex items-center justify-center gap-2 bg-primary text-background p-3 rounded-lg font-bold shadow-md hover:brightness-110 active:translate-y-0.5 transition-all w-full focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer">
                    <Plus size={20} strokeWidth={2.5} />
                    Criar Novo Projeto
                </button>
                
                <button onclick={() => handleOpen(null)} class="flex items-center justify-center gap-2 bg-secondary text-background p-3 rounded-lg font-bold shadow-md hover:brightness-110 active:translate-y-0.5 transition-all w-full focus:ring-2 focus:ring-offset-2 focus:ring-secondary cursor-pointer">
                    <FolderOpen size={20} strokeWidth={2.5} />
                    Abrir Existente
                </button>
            </div>
        {:else}
            <button onclick={manageCreateProject} class="relative -left-1/2 text-secondary transition-all shrink-0 hover:text-primary cursor-pointer hover:-translate-y-1">
                <ArrowLeft size={20} strokeWidth={2.5}/>
            </button>
            <p class="text-primary h-5 transition-all">{errorMsg}</p>
            <input bind:value={newProjectName} autocomplete="off" spellcheck="false" class="border border-text-muted rounded-lg bg-surface text-text-main transition-all placeholder:text-text-main focus:-translate-y-1 focus:shadow-2xl" placeholder="Nome do projeto...">
            <button onclick={handleCreate} class="flex items-center justify-center gap-2 bg-primary text-background p-3 rounded-lg font-bold shadow-md hover:brightness-110 active:translate-y-0.5 transition-all w-full focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer">
                <Plus size={20} strokeWidth={2.5} />
                Criar
            </button>
        {/if}
    </div>
</div>