<script lang="ts">
    import { commandRegistry, type PaletteItem } from '$lib/services/commands';
    import { Search, ChevronRight, Command, CornerDownLeft } from 'lucide-svelte';

    let isOpen = $state(false);
    let mode = $state<'commands' | 'arguments'>('commands');
    let searchQuery = $state('');
    let selectedIndex = $state(0);

    let pendingCommandId = $state<string | null>(null);
    let argumentItems = $state<PaletteItem[]>([]);

    let filteredCommands = $derived.by(() => {
        if (mode !== 'commands') return [];
        
        return Array.from(commandRegistry.commands.entries())
            .map(([id, entry]) => ({ id, ...entry.options }))
            .filter(cmd => {
                const text = `${cmd.id} ${cmd.description || ''}`.toLowerCase();
                return text.includes(searchQuery.toLowerCase());
            });
    });

    let filteredArgs = $derived.by(() => {
        if (mode !== 'arguments') return [];
        return argumentItems.filter(item => 
            item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    });

    let displayList = $derived(mode === 'commands' ? filteredCommands : filteredArgs);

    function open() {
        isOpen = true;
        reset();
    }

    function close() {
        isOpen = false;
        reset();
    }

    function reset() {
        mode = 'commands';
        searchQuery = '';
        selectedIndex = 0;
        pendingCommandId = null;
        argumentItems = [];
    }

    async function selectItem(index: number) {
        const item = displayList[index];
        if (!item) return;

        if (mode === 'commands') {
            const cmd = item as any; 
        
            if (cmd.argsProvider) {
                pendingCommandId = cmd.id;
                argumentItems = cmd.argsProvider();
                mode = 'arguments';
                searchQuery = '';
                selectedIndex = 0;
            } else {
                close();
                await commandRegistry.execute(cmd.id);
            }
        } else {
            if (pendingCommandId) {
                const argItem = item as PaletteItem;
                const commandIdToExecute = pendingCommandId;
                close();
                await commandRegistry.execute(commandIdToExecute, argItem.value);
            }
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            isOpen ? close() : open();
            return;
        }

        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % displayList.length;
                document.getElementById(`cmd-item-${selectedIndex}`)?.scrollIntoView({ block: 'nearest' });
                break;
            
            case 'ArrowUp':
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + displayList.length) % displayList.length;
                document.getElementById(`cmd-item-${selectedIndex}`)?.scrollIntoView({ block: 'nearest' });
                break;

            case 'Enter':
                e.preventDefault();
                selectItem(selectedIndex);
                break;

            case 'Escape':
                e.preventDefault();
                if (mode === 'arguments') {
                    mode = 'commands';
                    searchQuery = '';
                    selectedIndex = 0;
                    pendingCommandId = null;
                } else {
                    close();
                }
                break;
                
            case 'Backspace':
                if (mode === 'arguments' && searchQuery === '') {
                    mode = 'commands';
                    pendingCommandId = null;
                }
                break;
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
    <div class="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-[2px]" onclick={close}>
        
        <div 
            class="w-full max-w-xl bg-surface rounded-xl shadow-2xl border border-text-muted/20 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 ring-1 ring-white/10"
            onclick={(e) => e.stopPropagation()} 
        >
            <div class="flex items-center px-4 py-3 border-b border-text-muted/10 gap-3">
                
                {#if mode === 'arguments'}
                    <span class="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded flex items-center gap-1 shrink-0">
                        {pendingCommandId} <ChevronRight size={12}/>
                    </span>
                {:else}
                    <Search class="text-text-muted shrink-0" size={20} />
                {/if}
                
                <input 
                    type="text" 
                    bind:value={searchQuery}
                    placeholder={mode === 'commands' ? "Digite um comando..." : "Selecione uma opção..."}
                    class="flex-1 bg-transparent outline-none text-lg text-text-main placeholder:text-text-muted/50"
                    autofocus
                    spellcheck="false"
                    autocomplete="off"
                />

                <div class="hidden sm:flex items-center gap-1 text-[10px] text-text-muted border border-text-muted/20 px-1.5 py-0.5 rounded">
                    <span class="font-mono">ESC</span>
                </div>
            </div>

            <div class="max-h-[300px] overflow-y-auto scrollbar-hide py-2">
                {#if displayList.length === 0}
                    <div class="p-8 text-center text-text-muted text-sm">
                        Nenhum resultado encontrado para "{searchQuery}"
                    </div>
                {:else}
                    {#each displayList as item, i}
                        <button 
                            id="cmd-item-{i}"
                            onclick={() => selectItem(i)}
                            onmouseenter={() => selectedIndex = i}
                            class="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors cursor-pointer border-l-2
                            {i === selectedIndex 
                                ? 'bg-primary/5 border-primary text-primary' 
                                : 'border-transparent text-text-main hover:bg-surface-hover'}"
                        >
                            <div class="shrink-0 {i === selectedIndex ? 'text-primary' : 'text-text-muted'}">
                                {#if mode === 'arguments' && item.icon}
                                    <item.icon size={18} />
                                {:else}
                                    <Command size={18} />
                                {/if}
                            </div>
                            
                            <div class="flex flex-col flex-1 min-w-0">
                                <span class="font-bold text-sm truncate">
                                    {mode === 'commands' ? item.id : item.label}
                                </span>
                                {#if item.description}
                                    <span class="text-xs opacity-70 truncate">{item.description}</span>
                                {/if}
                            </div>

                            {#if i === selectedIndex}
                                <div class="shrink-0 text-text-muted opacity-50 animate-in fade-in duration-200">
                                    {#if mode === 'commands' && item.argsProvider}
                                        <ChevronRight size={16} />
                                    {:else}
                                        <CornerDownLeft size={16} />
                                    {/if}
                                </div>
                            {/if}
                        </button>
                    {/each}
                {/if}
            </div>
            
            {#if mode === 'commands'}
                <div class="bg-surface-secondary/50 px-4 py-2 text-[10px] text-text-muted border-t border-text-muted/10 flex justify-between items-center">
                    <span><b>Dica:</b> Use ↑↓ para navegar e Enter para selecionar</span>
                    <span class="font-mono opacity-50">TaleArchitect</span>
                </div>
            {/if}
        </div>
    </div>
{/if}