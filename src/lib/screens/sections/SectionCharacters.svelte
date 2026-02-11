<script lang="ts">
    import { projectStore } from '$lib/stores/project.svelte';
    import { convertFileSrc } from '@tauri-apps/api/core';
    import { Search, Plus, Filter, User, Trash2, Save, ArrowLeft, Image as ImageIcon } from 'lucide-svelte';
    import { commandRegistry } from '$lib/services/commands';
    import { charState } from '$lib/controllers/charactersController.svelte';
    import type { Event } from '$lib/models/project';
    import { timelineController } from '$lib/controllers/timelineController.svelte';
    import { join, dirname } from '@tauri-apps/api/path';

    let filteredCharacters = $derived.by(() => {
        if (!projectStore.current) return [];
    
        let list = projectStore.current.data.characters.filter(c => 
            c.name.toLowerCase().includes(charState.searchQuery.toLowerCase())
        );

        return list.sort((a, b) => {
            if (charState.sortBy === 'name') return a.name.localeCompare(b.name);
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    });

    let eventsOfSelectedCharacter: Event[] = $derived.by(() => {
        if(!charState.selectedId) return [];
        return timelineController.sortedEvents.filter((event) => event.characters.includes(charState.selectedId as string));
    });

    async function getImageUrl(relativePath: string | null) {
        if (!relativePath) return '';

        const projectDir = await dirname(projectStore.current?.data.projectdir as string);
        const fullPath = await join(projectDir, relativePath);
        return convertFileSrc(fullPath);
    }

    const cmd = commandRegistry.execute.bind(commandRegistry);
</script>

<div class="flex flex-col h-full overflow-hidden duration-300">
    
    {#if charState.view === 'list'}
        <div class="flex flex-col md:flex-row gap-4 justify-between items-center p-6 border-b border-text-muted/20 bg-surface/30">
            
            <div class="relative w-full md:w-96 group">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
                <input 
                    type="text" 
                    bind:value={charState.searchQuery}
                    placeholder="Buscar personagem..." 
                    class="w-full pl-10 pr-4 py-2 bg-background border border-text-muted/30 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-text-muted/50"
                />
            </div>

            <div class="flex gap-3 w-full md:w-auto">
                <div class="relative flex items-center bg-background border border-text-muted/30 rounded-lg px-3 overflow-hidden">
                    <Filter size={16} class="text-text-muted mr-2" />
                    <select 
                        bind:value={charState.sortBy}
                        class="bg-transparent text-text-main text-sm py-2 border-none ring-0 outline-none cursor-pointer w-full appearance-none"
                    >
                        <option value="date">Mais Recentes</option>
                        <option value="name">A-Z</option>
                    </select>
                </div>

                <button 
                    onclick={() => cmd('char:create')}
                    class="flex items-center gap-2 bg-primary text-background px-4 py-2 rounded-lg font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span class="hidden sm:inline">Novo</span>
                </button>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto p-6 scrollbar-hide">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {#each filteredCharacters as char (char.id)}
                    <button 
                        onclick={() => cmd('char:edit', { id: char.id })}
                        class="group flex flex-col bg-background border border-text-muted/20 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 text-left"
                    >
                        <div class="aspect-3/4 w-full bg-surface/50 relative overflow-hidden">
                            {#if char.image}
                                {#await getImageUrl(char.image) then src}
                                    <img 
                                        src={src} 
                                        alt={char.name} 
                                        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 object-top"
                                    />
                                {/await}
                            {:else}
                                <div class="w-full h-full flex items-center justify-center text-text-muted/30">
                                    <User size={64} />
                                </div>
                            {/if}
                            <div class="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        <div class="p-4 flex flex-col gap-1">
                            <h3 class="text-lg font-bold text-text-main font-serif truncate">{char.name}</h3>
                            <p class="text-xs text-text-muted line-clamp-2 min-h-[2.5em]">
                                {char.description || 'Sem descrição...'}
                            </p>
                        </div>
                    </button>
                {/each}

                {#if filteredCharacters.length === 0}
                    <div class="col-span-full flex flex-col items-center justify-center h-64 text-text-muted opacity-50">
                        <User size={48} class="mb-4" />
                        <p>Nenhum personagem encontrado.</p>
                    </div>
                {/if}
            </div>
        </div>

    {:else}
        <div class="max-w-4xl mx-auto w-full h-full flex flex-col p-6 animate-in slide-in-from-right-8 duration-300">
            
            <div class="flex items-center justify-between mb-8">
                <button onclick={() => cmd('char:cancel')} class="flex items-center gap-2 text-text-muted hover:text-primary transition-colors cursor-pointer">
                    <ArrowLeft size={20} />
                    Voltar
                </button>
                
                <div class="flex gap-3">
                    {#if charState.selectedId}
                        <button onclick={() => cmd('char:delete', { id: charState.selectedId })} class="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors cursor-pointer" title="Deletar">
                            <Trash2 size={20} />
                        </button>
                    {/if}
                    <button onclick={() => cmd('char:save')} class="flex items-center gap-2 bg-primary text-background px-6 py-2 rounded-lg font-bold shadow-md hover:brightness-110 cursor-pointer">
                        <Save size={18} />
                        Salvar
                    </button>
                </div>
            </div>

            <div class="flex flex-col md:flex-row gap-8 flex-1 overflow-y-auto scrollbar-hide p-1">
                
                <div class="w-full md:w-1/3 flex flex-col gap-4">
                    <div class="aspect-3/4 rounded-xl border-2 border-dashed border-text-muted/30 bg-surface/50 overflow-hidden relative group">
                        {#if charState.formData.image}
                            {#await getImageUrl(charState.formData.image) then src}
                                <img src={src} alt="Preview" class="w-full h-full object-cover object-top" />
                            {/await}
                        {:else}
                            <div class="w-full h-full flex flex-col items-center justify-center text-text-muted/50">
                                <ImageIcon size={48} />
                                <span class="text-sm mt-2 font-medium">Sem Imagem</span>
                            </div>
                        {/if}

                        <button 
                            onclick={() => cmd('char:image:pick')}
                            class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-all cursor-pointer backdrop-blur-sm"
                        >
                            Alterar Imagem
                        </button>
                    </div>

                    <button 
                        onclick={() => cmd('char:image:remove')}
                        class="bg-background border border-red-300 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm cursor-pointer"
                    >
                        Remover imagem
                    </button>

                    {#if eventsOfSelectedCharacter.length > 0}

                        <label class="text-sm font-bold text-text-muted uppercase text-center">Eventos participados:</label>

                        <div class="flex flex-col gap-4 overflow-y-auto scrollbar-hide p-4 border border-primary rounded-xl max-h-60">

                            {#each eventsOfSelectedCharacter as event}
                                <div class="
                                    flex flex-col p-3 rounded-lg border border-text-muted/10 shadow-sm bg-surface/80 backdrop-blur-sm
                                    group-hover:shadow-lg group-hover:border-primary/30 group-hover:-translate-y-1 transition-all
                                    text-left items-start cursor-pointer"
                                    onclick={() => cmd('timeline:edit', { id: event.id })}
                                >
                                    <span class="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                                        {event.date.day} / {event.date.month} / {event.date.year} - {event.date.hour}:{event.date.minute}
                                    </span>
                                    <h3 class="font-bold text-text-main font-serif leading-tight">{event.name}</h3>
                                    {#if event.description}
                                        <p class="text-xs text-text-muted line-clamp-2 mt-1 opacity-80">{event.description}</p>
                                    {/if}
                                </div>
                            {/each}

                        </div>

                    {:else}
                        <label class="text-sm font-bold text-text-muted uppercase text-center">Esse personagem não participou de nenhum evento</label>
                    {/if}

                </div>

                <div class="flex-1 space-y-6">
                    <div class="space-y-2">
                        <label class="text-sm font-bold text-text-muted uppercase">Nome do Personagem</label>
                        <input 
                            bind:value={charState.formData.name}
                            type="text" 
                            placeholder="Ex: Arthur Pendragon"
                            class="w-full bg-background border border-text-muted/30 rounded-lg p-4 text-2xl font-serif text-text-main focus:ring-2 focus:ring-primary outline-none placeholder:text-text-muted/30"
                        />
                    </div>

                    <div class="space-y-2 h-full flex flex-col">
                        <label class="text-sm font-bold text-text-muted uppercase">Descrição</label>
                        <textarea 
                            bind:value={charState.formData.description}
                            placeholder="Escreva os detalhes do personagem..."
                            class="w-full flex-1 min-h-50 bg-background border border-text-muted/30 rounded-lg p-4 text-text-main placeholder:text-text-main focus:ring-2 focus:ring-primary outline-none resize-none leading-relaxed scrollbar-thin scrollbar-thumb-text-muted/20 scrollbar-hide"
                        ></textarea>
                    </div>
                </div>

            </div>
        </div>
    {/if}
</div>