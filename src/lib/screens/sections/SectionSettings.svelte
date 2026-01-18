<script lang="ts">
    import { projectStore } from '$lib/stores/project.svelte';
    import { commandRegistry } from '$lib/services/commands';
    import { Trash2, Calendar, Type, AlertTriangle, RotateCcw, X, Plus } from 'lucide-svelte';
  import PluginsConfig from '$lib/components/PluginsConfig.svelte';
    
    const cmd = commandRegistry.execute.bind(commandRegistry);

    let totalDays = $derived(
        projectStore.current?.data.calendar.months.reduce((acc, m) => acc + m.days, 0) || 0
    );
</script>

<div class="w-full max-w-3xl mx-auto p-8 space-y-8 overflow-y-auto pb-20">
    
    <div class="border-b border-text-muted/20 pb-4">
        <h2 class="text-2xl font-serif font-bold text-text-main">Configurações do Projeto</h2>
    </div>

    {#if projectStore.current}
        <section class="space-y-4">
            <h3 class="text-lg font-bold text-text-main flex items-center gap-2">
                <Type size={18} />
                Geral
            </h3>
            
            <div class="bg-surface p-6 rounded-xl border border-text-muted/20 shadow-sm space-y-6">
                <div class="flex flex-col gap-2">
                    <label for="pname" class="text-sm font-semibold text-text-muted uppercase tracking-wider">Nome do Projeto</label>
                    <input 
                        id="pname"
                        type="text" 
                        minlength="1"
                        bind:value={projectStore.current.data.name}
                        autocomplete="off" 
                        spellcheck="false"
                        oninput={() => cmd('project:rename')}
                        class="w-full bg-background border border-text-muted/30 rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-serif text-lg"
                    />
                </div>

                <div class="flex items-center justify-between border-t border-text-muted/10 pt-4">
                    <div class="flex flex-col">
                        <span class="font-bold text-text-main">Salvamento Automático</span>
                        <span class="text-xs text-text-muted">Salvar alterações automaticamente ao modificar dados.</span>
                    </div>
                    
                    <button 
                        onclick={async () => { 
                            if(projectStore.current) {
                                cmd('project:config:update', { key: 'autosave', value: !projectStore.current.data.autosave });
                                await projectStore.save();
                            }
                        }}
                        class="relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
                        class:bg-primary={projectStore.current.data.autosave}
                        class:bg-text-muted={!projectStore.current.data.autosave}
                    >
                        <span 
                            class="absolute left-1 top-1 w-4 h-4 bg-background rounded-full transition-transform duration-200"
                            class:translate-x-6={projectStore.current.data.autosave}
                        ></span>
                    </button>
                </div>
            </div>
        </section>

        <section class="space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-text-main flex items-center gap-2">
                    <Calendar size={18} /> Calendário
                </h3>
                <span class="text-xs font-mono bg-surface border border-text-muted/20 px-2 py-1 rounded text-text-muted">
                    Total: {totalDays} dias/ano
                </span>
            </div>

            <div class="bg-surface p-6 rounded-xl border border-text-muted/20 shadow-sm space-y-6">
                <p class="text-sm text-text-muted bg-background/50 p-3 rounded border-l-4 border-secondary italic">
                    Configure o calendário do seu mundo. A ordem aqui define a passagem de tempo.
                </p>

                <div class="grid grid-cols-12 gap-4 text-xs font-bold text-text-muted uppercase tracking-wider px-2">
                    <div class="col-span-1 text-center">#</div>
                    <div class="col-span-7">Nome do Mês</div>
                    <div class="col-span-3">Duração (Dias)</div>
                    <div class="col-span-1"></div>
                </div>

                <div class="space-y-2">
                    {#each projectStore.current.data.calendar.months as month, index}
                        <div class="grid grid-cols-12 gap-4 items-center group">
                            <div class="col-span-1 text-center font-mono text-text-muted text-sm">
                                {index + 1}
                            </div>

                            <div class="col-span-7">
                                <input 
                                    type="text" 
                                    value={month.name}
                                    oninput={(e) => cmd('project:calendar:update_month', { index, field: 'name', value: e.currentTarget.value })}
                                    class="w-full bg-background border border-text-muted/30 rounded-lg p-2 text-text-main focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </div>

                            <div class="col-span-3">
                                <input 
                                    type="number" 
                                    min="1"
                                    value={month.days}
                                    oninput={(e) => cmd('project:calendar:update_month', { index, field: 'days', value: parseInt(e.currentTarget.value) })}
                                    class="w-full bg-background border border-text-muted/30 rounded-lg p-2 text-text-main focus:ring-2 focus:ring-primary outline-none font-mono text-center"
                                />
                            </div>

                            <div class="col-span-1 flex justify-center">
                                <button 
                                    onclick={() => cmd('project:calendar:remove', { index })}
                                    class="text-text-muted hover:text-red-500 p-2 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                    title="Remover mês"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-text-muted/10">
                    <button 
                        onclick={() => cmd('project:calendar:reset')}
                        class="text-xs text-text-muted hover:text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                        <RotateCcw size={12} />
                        Resetar para Gregoriano
                    </button>

                    <button 
                        onclick={() => cmd('project:calendar:add')}
                        class="flex items-center gap-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
                    >
                        <Plus size={16} />
                        Adicionar Mês
                    </button>
                </div>
            </div>
        </section>

        <PluginsConfig/>

        <section class="space-y-4 pt-4">
            <h3 class="text-lg font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle size={18} /> Zona de Perigo
            </h3>
            <div class="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center justify-between">
                <div class="flex flex-col">
                    <span class="font-bold text-red-800">Excluir Projeto</span>
                    <span class="text-xs text-red-600/80 max-w-md">Esta ação apagará o arquivo do disco permanentemente.</span>
                </div>
                <button onclick={() => cmd('project:delete')} class="flex items-center gap-2 bg-background border border-red-300 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm cursor-pointer">
                    <Trash2 size={18} /> Excluir
                </button>
            </div>
        </section>
    {/if}
</div>