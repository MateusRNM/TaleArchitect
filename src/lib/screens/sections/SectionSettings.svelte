<script lang="ts">
    import { projectStore } from '$lib/stores/project.svelte';
    import { commandRegistry } from '$lib/services/commands';
    import { Trash2, Calendar, Type, AlertTriangle, RotateCcw } from 'lucide-svelte';
    
    function updateConfig(key: string, value: any, subkey?: string) {
        commandRegistry.execute('project:config:update', { key, value, subkey });
    }

    function handleRename() {
        commandRegistry.execute('project:rename');
    }

    function handleDelete() {
        commandRegistry.execute('project:delete');
    }
    
    function handleResetCalendar() {
        commandRegistry.execute('project:calendar:reset');
    }
</script>

<div class="w-full max-w-3xl mx-auto p-8 space-y-8 overflow-y-auto">
    
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
                        oninput={handleRename}
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
                                updateConfig('autosave', !projectStore.current.data.autosave);
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
            <h3 class="text-lg font-bold text-text-main flex items-center gap-2">
                <Calendar size={18} />
                Cronologia & Calendário
            </h3>

            <div class="bg-surface p-6 rounded-xl border border-text-muted/20 shadow-sm space-y-6">
                <p class="text-sm text-text-muted bg-background/50 p-3 rounded border-l-4 border-secondary italic">
                    Defina como o tempo passa no seu projeto. Isso afetará como a Timeline organiza seus eventos.
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col gap-2">
                        <label for="monthDur" class="text-xs font-bold text-text-muted uppercase">Dias por Mês</label>
                        <div class="relative">
                            <input 
                                id="monthDur"
                                type="number" 
                                min="1"
                                autocomplete="off" 
                                spellcheck="false"
                                bind:value={projectStore.current.data.calendar.monthDuration}
                                oninput={(e) => updateConfig('calendar', parseInt(e.currentTarget.value), 'monthDuration')}
                                class="w-full bg-background border border-text-muted/30 rounded-lg p-3 pl-4 text-text-main focus:ring-2 focus:ring-secondary outline-none font-mono"
                            />
                            <span class="absolute right-4 top-3 text-xs text-text-muted">Dias</span>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2">
                        <label for="yearDur" class="text-xs font-bold text-text-muted uppercase">Meses por Ano</label>
                        <div class="relative">
                            <input 
                                id="yearDur"
                                type="number" 
                                min="1"
                                autocomplete="off" 
                                spellcheck="false"
                                bind:value={projectStore.current.data.calendar.yearDuration}
                                oninput={(e) => updateConfig('calendar', parseInt(e.currentTarget.value), 'yearDuration')}
                                class="w-full bg-background border border-text-muted/30 rounded-lg p-3 pl-4 text-text-main focus:ring-2 focus:ring-secondary outline-none font-mono"
                            />
                            <span class="absolute right-4 top-3 text-xs text-text-muted">Meses</span>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end">
                     <button 
                        onclick={handleResetCalendar}
                        class="text-xs text-secondary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                        <RotateCcw size={12} />
                        Restaurar padrão Gregoriano (30/12)
                    </button>
                </div>
            </div>
        </section>

        <section class="space-y-4 pt-4">
            <h3 class="text-lg font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle size={18} />
                Zona de Perigo
            </h3>

            <div class="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center justify-between">
                <div class="flex flex-col">
                    <span class="font-bold text-red-800">Excluir Projeto</span>
                    <span class="text-xs text-red-600/80 max-w-md">
                        Isso apagará o arquivo 
                        <code class="bg-red-100 px-1 rounded text-red-800 font-mono text-[10px]">{projectStore.current.data.projectdir}</code> 
                        permanentemente do seu computador. Essa ação não pode ser desfeita.
                    </span>
                </div>

                <button 
                    onclick={handleDelete}
                    class="flex items-center gap-2 bg-background border border-red-300 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm cursor-pointer"
                >
                    <Trash2 size={18} />
                    Excluir
                </button>
            </div>
        </section>
    {/if}
</div>