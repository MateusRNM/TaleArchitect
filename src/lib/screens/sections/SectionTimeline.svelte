<script lang="ts">
    import { projectStore } from '$lib/stores/project.svelte';
    import { commandRegistry } from '$lib/services/commands';
    import { timelineController } from '$lib/controllers/timelineController.svelte';
    import { Plus, ArrowUp, ArrowDown, MapPin, Calendar, ArrowLeft, Save, Trash2, Clock, Users, Check, User, Columns3, List, MoveHorizontal } from 'lucide-svelte';
    import { convertFileSrc } from '@tauri-apps/api/core';

    const cmd = commandRegistry.execute.bind(commandRegistry);
    const EVENT_GAP = 120; 
    
    let isDragging = false;
    let startY = 0;
    let initialScrollY = 0;
    let svgContainer: SVGSVGElement;

    function getMonthName(monthIndex: number) {
        if (!projectStore.current) return `Mês ${monthIndex}`;
        const months = projectStore.current.data.calendar.months;
        const m = months[monthIndex - 1];
        return m ? m.name : `Mês ${monthIndex}`;
    }

    function getCharacter(id: string) {
        return projectStore.current?.data.characters.find(c => c.id === id);
    }

    function getLocationName(id: string) {
        return projectStore.current?.data.locations.find(l => l.id === id)?.name || 'Desconhecido / Sem Local';
    }

    let maxDaysInSelectedMonth = $derived.by(() => {
        if (!projectStore.current) return 31;
        const months = projectStore.current.data.calendar.months;
        const m = months[timelineController.formData.date.month - 1];
        return m ? m.days : 31;
    });

    function handlePointerDown(e: PointerEvent) {
        if(e.button !== 0) return;
        isDragging = true;
        startY = e.clientY;
        initialScrollY = timelineController.scrollY;
        svgContainer.setPointerCapture(e.pointerId);
    }

    function handlePointerMove(e: PointerEvent) {
        if (!isDragging) return;
        const deltaY = e.clientY - startY;
        timelineController.scrollY = initialScrollY + deltaY;
    }

    function handlePointerUp(e: PointerEvent) {
        isDragging = false;
        if(svgContainer) svgContainer.releasePointerCapture(e.pointerId);
    }

    function formatTime(h?: number, m?: number) {
        if (h === undefined || m === undefined) return '';
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        return `${hh}:${mm}`;
    }
</script>

<div class="relative w-full h-full bg-[#f1e0b9] overflow-hidden flex flex-col">
    
    {#if timelineController.view === 'list'}
        
        <div class="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
            <div class="bg-surface/90 backdrop-blur-md p-3 rounded-xl border border-text-muted/20 shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4">
                <div class="bg-primary/10 p-2 rounded-lg text-primary">
                    <Clock size={20} />
                </div>
                <div class="flex flex-col">
                    <span class="text-[10px] font-bold uppercase text-text-muted tracking-widest">Data Atual</span>
                    <span class="font-serif font-bold text-lg text-text-main">
                        {timelineController.currentDate.day}/{timelineController.currentDate.month}/{timelineController.currentDate.year}
                    </span>
                    {#if timelineController.currentDate.hour !== undefined}
                        <span class="bg-primary/10 px-1 rounded text-primary/80 text-center">
                            {formatTime(timelineController.currentDate.hour, timelineController.currentDate.minute)}
                        </span>
                    {/if}
                </div>
            </div>
        </div>

        <div class="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
            <button onclick={() => cmd('timeline:view:toggle')} class="bg-surface text-text-muted p-3 rounded-full shadow-lg hover:text-primary transition-colors cursor-pointer border border-text-muted/10 mb-2" title="Alternar Visualização">
                <Columns3 size={20} />
            </button>

            <button onclick={() => cmd('timeline:create')} class="bg-primary text-background p-3 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer shadow-primary/30" title="Novo Evento">
                <Plus size={24} />
            </button>
            <div class="flex flex-col gap-1 mt-2 bg-surface/80 backdrop-blur rounded-full p-1 border border-text-muted/10 shadow-sm">
                <button onclick={() => cmd('timeline:scroll:top')} class="text-text-muted p-2 rounded-full hover:bg-background hover:text-primary transition-colors cursor-pointer">
                    <ArrowUp size={20} />
                </button>
                <button onclick={() => cmd('timeline:scroll:bottom')} class="text-text-muted p-2 rounded-full hover:bg-background hover:text-primary transition-colors cursor-pointer">
                    <ArrowDown size={20} />
                </button>
            </div>
        </div>

        <svg 
            bind:this={svgContainer}
            class="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
            onpointerdown={handlePointerDown}
            onpointermove={handlePointerMove}
            onpointerup={handlePointerUp}
            onpointerleave={handlePointerUp}
        >
            <g transform="translate(0, {timelineController.scrollY})">
                
                <line x1="50%" y1={-5000} x2="50%" y2={timelineController.sortedEvents.length * EVENT_GAP + 5000} stroke="var(--text-muted)" stroke-width="2" stroke-opacity="0.2" />

                {#each timelineController.sortedEvents as event, i (event.id)}
                    {@const yPos = i * EVENT_GAP}
                    {@const isEven = i % 2 === 0}
                    
                    <g 
                        class="group cursor-pointer hover:opacity-100 transition-opacity"
                        onpointerdown={(e) => e.stopPropagation()}
                        onclick={() => cmd('timeline:edit', { id: event.id })}
                    >
                        <circle cx="50%" cy={yPos} r="8" fill="var(--background)" stroke="var(--primary)" stroke-width="3" class="group-hover:scale-125 transition-transform origin-center" />
                        
                        <line 
                            x1="50%" y1={yPos} 
                            x2={isEven ? "calc(50% + 40px)" : "calc(50% - 40px)"} 
                            y2={yPos} 
                            stroke="var(--primary)" stroke-width="1" opacity="0.5"
                        />

                        <foreignObject 
                            x={isEven ? "calc(50% + 40px)" : "calc(50% - 340px)"} 
                            y={yPos - 50} 
                            width="300" 
                            height="120"
                            class="overflow-visible"
                        >
                            <div class="
                                flex flex-col p-3 rounded-lg border border-text-muted/10 shadow-sm bg-surface/80 backdrop-blur-sm
                                group-hover:shadow-lg group-hover:border-primary/30 group-hover:-translate-y-1 transition-all
                                {isEven ? 'text-left items-start' : 'text-right items-end'}
                            ">
                                <span class="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                                    {event.date.day} / {getMonthName(event.date.month)} / {event.date.year} - {event.date.hour}:{event.date.minute}
                                </span>
                                <h3 class="font-bold text-text-main font-serif leading-tight">{event.name}</h3>
                                {#if event.description}
                                    <p class="text-xs text-text-muted line-clamp-2 mt-1 opacity-80">{event.description}</p>
                                {/if}

                                {#if event.characters && event.characters.length > 0}
                                    <div class="flex gap-1 mt-2 flex-wrap {isEven ? 'justify-start' : 'justify-end'}">
                                        {#each event.characters.slice(0, 5) as charId}
                                            {@const char = getCharacter(charId)}
                                            {#if char}
                                                <div class="w-6 h-6 rounded-full overflow-hidden border border-background shadow-sm bg-text-muted/10" title={char.name}>
                                                    {#if char.image}
                                                        <img src={convertFileSrc(char.image)} alt={char.name} class="w-full h-full object-cover" />
                                                    {:else}
                                                        <div class="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-[8px] font-bold">
                                                            {char.name.substring(0,2).toUpperCase()}
                                                        </div>
                                                    {/if}
                                                </div>
                                            {/if}
                                        {/each}
                                        {#if event.characters.length > 5}
                                            <div class="w-6 h-6 rounded-full bg-text-muted/20 flex items-center justify-center text-[8px] font-bold text-text-muted">
                                                +{event.characters.length - 5}
                                            </div>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </foreignObject>
                    </g>
                {/each}

                {#if timelineController.sortedEvents.length === 0}
                    <text x="50%" y="200" text-anchor="middle" class="fill-text-muted text-2xl italic font-serif opacity-50">
                        Ainda não há nenhum evento...
                    </text>
                {/if}
            </g>
        </svg>

    {:else if timelineController.view === 'swimlane'}
        
        <div class="absolute top-4 right-4 z-10 flex gap-2">
            <button onclick={() => cmd('timeline:view:toggle')} class="bg-surface text-text-muted p-3 rounded-full shadow-lg hover:text-primary transition-colors cursor-pointer border border-text-muted/10" title="Voltar para Lista">
                <List size={20} />
            </button>
            <button onclick={() => cmd('timeline:create')} class="bg-primary text-background p-3 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer shadow-primary/30" title="Novo Evento">
                <Plus size={24} />
            </button>
        </div>

        <div class="w-full h-full overflow-y-auto overflow-x-hidden p-6 space-y-6 scrollbar-hide">
            {#each [...timelineController.groupedByLocation] as [locId, events]}
                <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2 sticky left-0">
                        <MapPin size={16} class="text-primary"/>
                        <h3 class="font-serif font-bold text-lg text-text-main">{getLocationName(locId)}</h3>
                        <span class="text-xs text-text-muted bg-surface/50 px-2 py-0.5 rounded-full">{events.length}</span>
                    </div>

                    <div class="w-full overflow-x-auto pb-4 scrollbar-hide">
                         <div class="flex gap-4 min-w-max px-1">
                            {#if events.length === 0}
                                <div class="h-32 w-64 border border-dashed border-text-muted/20 rounded-xl flex items-center justify-center text-text-muted text-xs italic">
                                    Nenhum evento neste local
                                </div>
                            {:else}
                                {#each events as event}
                                    <button 
                                        onclick={() => cmd('timeline:edit', { id: event.id })}
                                        class="flex flex-col w-64 p-4 rounded-xl border border-text-muted/10 bg-surface/60 hover:bg-surface hover:shadow-lg hover:-translate-y-1 transition-all text-left group cursor-pointer"
                                    >
                                        <div class="flex items-center justify-between mb-2 w-full">
                                            <span class="text-[10px] font-bold text-primary uppercase tracking-wider">
                                                {event.date.day}/{event.date.month}/{event.date.year}
                                            </span>
                                            {#if event.date.hour}
                                                <span class="text-[10px] text-text-muted font-mono bg-background/50 px-1 rounded">
                                                    {formatTime(event.date.hour, event.date.minute)}
                                                </span>
                                            {/if}
                                        </div>
                                        
                                        <h4 class="font-bold text-text-main font-serif leading-tight mb-2 line-clamp-2">{event.name}</h4>
                                        
                                        {#if event.description}
                                            <p class="text-xs text-text-muted line-clamp-2 opacity-80 mb-3">{event.description}</p>
                                        {/if}

                                        {#if event.characters && event.characters.length > 0}
                                            <div class="mt-auto flex -space-x-2 pt-2">
                                                {#each event.characters.slice(0, 4) as charId}
                                                    {@const char = getCharacter(charId)}
                                                    {#if char}
                                                        <div class="w-6 h-6 rounded-full border border-surface bg-background flex items-center justify-center overflow-hidden" title={char.name}>
                                                            {#if char.image}
                                                                <img src={convertFileSrc(char.image)} alt="" class="w-full h-full object-cover"/>
                                                            {:else}
                                                                <span class="text-[8px] font-bold text-text-muted">{char.name.substring(0,1)}</span>
                                                            {/if}
                                                        </div>
                                                    {/if}
                                                {/each}
                                            </div>
                                        {/if}
                                    </button>
                                {/each}
                            {/if}
                            
                            <div class="flex items-center justify-center w-12 h-32 opacity-0 hover:opacity-100 transition-opacity">
                                <button onclick={() => {
                                    timelineController.formData.locationId = locId;
                                    cmd('timeline:create');
                                }} class="w-8 h-8 rounded-full bg-primary/20 hover:bg-primary text-primary hover:text-white flex items-center justify-center transition-colors cursor-pointer">
                                    <Plus size={16}/>
                                </button>
                            </div>
                         </div>
                     </div>
                </div>
                <div class="w-full h-px bg-text-muted/10"></div> {/each}

            {#if [...timelineController.groupedByLocation].length === 0}
                 <div class="flex flex-col items-center justify-center h-full text-text-muted opacity-50">
                    <MoveHorizontal size={48} class="mb-4"/>
                    <p>Adicione locais ao seu mapa para ver as raias aqui.</p>
                 </div>
            {/if}
        </div>

    {:else}
        <div class="max-w-2xl mx-auto w-full h-full flex flex-col p-8 duration-300 overflow-y-auto scrollbar-hide">
            
            <div class="flex items-center justify-between mb-8 pb-4 border-b border-text-muted/20">
                <button onclick={() => cmd('timeline:cancel')} class="flex items-center gap-2 text-text-muted hover:text-primary transition-colors cursor-pointer">
                    <ArrowLeft size={20} /> Voltar
                </button>
                <h2 class="text-2xl font-serif font-bold text-text-main">
                    {timelineController.selectedEventId ? 'Editar Evento' : 'Novo Evento'}
                </h2>
            </div>

            <div class="space-y-6 flex-1">
                <div class="bg-surface p-6 rounded-xl border border-text-muted/20 shadow-sm space-y-4">

                    <h3 class="text-sm font-bold uppercase text-text-muted flex items-center gap-2">
                        <Calendar size={16} /> Data
                    </h3>

                    <div class="grid grid-cols-5 gap-4"> 
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-bold text-text-muted">Dia</label>
                            <input type="number" min="1" max={maxDaysInSelectedMonth} bind:value={timelineController.formData.date.day} class="bg-background border border-text-muted/30 rounded p-2 focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        
                        <div class="flex flex-col gap-1 col-span-2">
                            <label class="text-xs font-bold text-text-muted">Mês</label>
                            <select bind:value={timelineController.formData.date.month} class="bg-background border border-text-muted/30 rounded p-2 focus:ring-2 focus:ring-primary outline-none">
                                {#if projectStore.current}
                                    {#each projectStore.current.data.calendar.months as m, i}
                                        <option value={i + 1}>{m.name}</option>
                                    {/each}
                                {/if}
                            </select>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-bold text-text-muted">Ano</label>
                            <input type="number" min="1" bind:value={timelineController.formData.date.year} class="bg-background border border-text-muted/30 rounded p-2 focus:ring-2 focus:ring-primary outline-none" />
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-bold text-text-muted">Hora</label>
                            <div class="flex items-center gap-1">
                                <input 
                                    type="number" min="0" max="23" placeholder="00"
                                    bind:value={timelineController.formData.date.hour} 
                                    class="w-full bg-background border border-text-muted/30 rounded p-2 focus:ring-2 focus:ring-primary outline-none text-center" 
                                />
                                <span class="text-text-muted font-bold">:</span>
                                <input 
                                    type="number" min="0" max="59" placeholder="00"
                                    bind:value={timelineController.formData.date.minute} 
                                    class="w-full bg-background border border-text-muted/30 rounded p-2 focus:ring-2 focus:ring-primary outline-none text-center" 
                                />
                            </div>
                        </div>

                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label class="text-sm font-bold text-text-muted uppercase">Título</label>
                    <input type="text" bind:value={timelineController.formData.name} placeholder="Título do evento" class="w-full bg-background border border-text-muted/30 rounded-lg p-3 text-lg font-serif font-bold text-text-main focus:ring-2 focus:ring-primary outline-none" />
                </div>

                <div class="flex flex-col gap-2 h-32">
                    <label class="text-sm font-bold text-text-muted uppercase">Descrição</label>
                    <textarea bind:value={timelineController.formData.description} placeholder="Descrição..." class="w-full h-full bg-background border border-text-muted/30 rounded-lg p-3 text-text-main resize-none focus:ring-2 focus:ring-primary outline-none"></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {#if projectStore.current && projectStore.current.data.locations.length > 0}
                        <div class="flex flex-col gap-2">
                            <label class="text-sm font-bold text-text-muted uppercase flex items-center gap-2"><MapPin size={14}/> Localização</label>
                            <select bind:value={timelineController.formData.locationId} class="w-full bg-background border border-text-muted/30 rounded-lg p-3 text-text-main focus:ring-2 focus:ring-primary outline-none">
                                <option value="">-- Nenhum --</option>
                                {#each projectStore.current.data.locations as loc}
                                    <option value={loc.id}>{loc.name}</option>
                                {/each}
                            </select>
                        </div>
                    {/if}

                    {#if projectStore.current && projectStore.current.data.characters.length > 0}
                        <div class="flex flex-col gap-2">
                            <label class="text-sm font-bold text-text-muted uppercase flex items-center gap-2"><Users size={14}/> Personagens</label>
                            <div class="bg-background border border-text-muted/30 rounded-lg p-2 max-h-40 overflow-y-auto scrollbar-hide">
                                <div class="grid grid-cols-2 gap-2">
                                    {#each projectStore.current.data.characters as char}
                                        {@const isSelected = timelineController.formData.characters.includes(char.id)}
                                        <button 
                                            onclick={() => cmd('timeline:char:toggle', { id: char.id })}
                                            class="flex items-center gap-2 p-2 rounded-md text-left transition-all border cursor-pointer
                                            {isSelected 
                                                ? 'bg-primary/10 border-primary text-primary' 
                                                : 'bg-surface border-transparent hover:bg-surface/80 text-text-muted hover:text-text-main'}"
                                        >
                                            <div class="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-text-muted/10">
                                                {#if char.image}
                                                    <img src={convertFileSrc(char.image)} alt="" class="w-full h-full object-cover" />
                                                {:else}
                                                    <div class="flex items-center justify-center w-full h-full"><User size={12}/></div>
                                                {/if}
                                            </div>
                                            <span class="text-xs font-bold truncate flex-1">{char.name}</span>
                                            {#if isSelected}<Check size={12} />{/if}
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <div class="flex items-center justify-between mt-8 pt-4 border-t border-text-muted/10">
                <div>
                    {#if timelineController.selectedEventId}
                        <button onclick={() => cmd('timeline:delete')} class="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors cursor-pointer">
                            <Trash2 size={18} /> Deletar
                        </button>
                    {/if}
                </div>
                <button onclick={() => cmd('timeline:save')} class="flex items-center gap-2 bg-primary text-background px-6 py-2 rounded-lg font-bold shadow-md hover:brightness-110 cursor-pointer">
                    <Save size={18} /> Salvar
                </button>
            </div>
        </div>
    {/if}
</div>