<script lang="ts">
    import { onMount } from 'svelte';
    import { projectStore } from '$lib/stores/project.svelte';
    import { Plus, Minus, Map as MapIcon, X, Trash2, AlignLeft, Info, Route, MoveHorizontalIcon, EyeOff, Eye, Image, Move } from 'lucide-svelte';
    import { mapState, toWorld, setMapContainer } from '$lib/controllers/mapController.svelte';
    import { commandRegistry } from '$lib/services/commands';
    import type { Event } from '$lib/models/project';
    import { timelineController } from '$lib/controllers/timelineController.svelte';
    import { convertFileSrc } from '@tauri-apps/api/core';
    import { pluginBridge } from '$lib/services/pluginBridge.svelte';
    import { join, dirname } from '@tauri-apps/api/path';
    const NODE_RADIUS = 20;
    let startPan = { x: 0, y: 0 };
    let startView = { x: 0, y: 0 };
    let dragStartCoords = { x: 0, y: 0 };
    let svgElement: SVGSVGElement;

    let bgUrl = $derived.by(async () => {
        const image = await getImageUrl(projectStore.current?.data.mapBackground.path || null);
        return image;
    });

    const cmd = commandRegistry.execute.bind(commandRegistry);

    let eventsOfSelectedLocation: Event[] = $derived.by(() => {
        if(!mapState.selectedLocationId) return [];
        return timelineController.sortedEvents.filter((event) => event.locationId === mapState.selectedLocationId);
    });
 
    onMount(() => {
        setMapContainer(svgElement);
    });

    function getLocationById(id: string) {
        return projectStore.current?.data.locations.find(l => l.id === id);
    }

    function handleWheel(e: WheelEvent) {
        e.preventDefault();

        if (mapState.isCalibrating && projectStore.current?.data.mapBackground.active) {
            const bg = projectStore.current.data.mapBackground;
            const intensity = 0.05;
            const delta = e.deltaY > 0 ? -1 : 1;
            
            const newScale = Math.max(0.1, bg.scale + (delta * intensity));
            bg.scale = newScale;
            projectStore.current.changesUnsaved = true;
            return; 
        }
        
        const minK = 0.2, maxK = 5, intensity = 0.1;
        const delta = e.deltaY > 0 ? -1 : 1;
        const newK = Math.min(Math.max(minK, mapState.view.k * (1 + delta * intensity)), maxK);

        const worldPos = toWorld(e.clientX, e.clientY);
        const rect = svgElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        mapState.view.k = newK;
        mapState.view.x = mouseX - (worldPos.x * newK);
        mapState.view.y = mouseY - (worldPos.y * newK);
    }

    function handlePointerDownBg(e: PointerEvent) {
        if (e.button === 0 && e.target === e.currentTarget) {
            mapState.isPanning = true;
            svgElement.setPointerCapture(e.pointerId);
            
            startPan = { x: e.clientX, y: e.clientY };
            startView = { x: mapState.view.x, y: mapState.view.y };
            
            mapState.selectedLocationId = null;
            mapState.selectedConnectionId = null;
        }
    }

    function handlePointerMove(e: PointerEvent) {
        if (mapState.isPanning) {
            const dx = e.clientX - startPan.x;
            const dy = e.clientY - startPan.y;

            if (mapState.isCalibrating && projectStore.current?.data.mapBackground.active) {
                const bg = projectStore.current.data.mapBackground;
        
                bg.x += dx / mapState.view.k; 
                bg.y += dy / mapState.view.k;

                startPan = { x: e.clientX, y: e.clientY };
                
                projectStore.current.changesUnsaved = true;
                return;
            }

            mapState.view.x = startView.x + dx;
            mapState.view.y = startView.y + dy;
            return;
        }

        const worldPos = toWorld(e.clientX, e.clientY);

        if (mapState.draggingNodeId && projectStore.current) {
            const loc = projectStore.current.data.locations.find(l => l.id === mapState.draggingNodeId);
            if (loc) {
                loc.coordinates.x = worldPos.x;
                loc.coordinates.y = worldPos.y;
                projectStore.current.changesUnsaved = true;
            }
        }

        if (mapState.connection.active) {
            mapState.connection.currX = worldPos.x;
            mapState.connection.currY = worldPos.y;
        }
    }

    function handlePointerUp(e: PointerEvent) {
        if (mapState.isPanning) {
            mapState.isPanning = false;
            svgElement.releasePointerCapture(e.pointerId);
        }
        mapState.draggingNodeId = null;
    }

    function handleBgDblClick(e: MouseEvent) {
        const pos = toWorld(e.clientX, e.clientY);
        cmd('map:location:create', { x: pos.x, y: pos.y });
    }

    function handleNodePointerDown(e: PointerEvent, id: string) {
        if (e.button === 0) {
            e.stopPropagation();
            mapState.draggingNodeId = id;
            dragStartCoords = { x: e.clientX, y: e.clientY };
        }
    }

    function handleNodePointerUp(e: PointerEvent, id: string) {
        const dist = Math.hypot(e.clientX - dragStartCoords.x, e.clientY - dragStartCoords.y);
        if (dist < 5) {
            mapState.selectedLocationId = id;
            mapState.selectedConnectionId = null;
        }
        mapState.draggingNodeId = null;
    }

    function handleNodeContext(e: MouseEvent, id: string) {
        e.preventDefault();
        e.stopPropagation();

        if (!mapState.connection.active) {
            const pos = toWorld(e.clientX, e.clientY);
            cmd('map:connection:start', { fromId: id, x: pos.x, y: pos.y });
        } else {
            cmd('map:connection:complete', { toId: id });
        }
    }

    function handleConnectionPointerDown(e: PointerEvent, id: string) {
        e.stopPropagation(); 
        if (e.button === 0) {
            mapState.selectedConnectionId = id;
            mapState.selectedLocationId = null;
        }
    }
    
    function closeEdit() {
        mapState.selectedLocationId = null;
        mapState.selectedConnectionId = null;
    }

    async function getImageUrl(relativePath: string | null) {
        if (!relativePath) return '';

        const projectDir = await dirname(projectStore.current?.data.projectdir as string);
        const fullPath = await join(projectDir, relativePath);
        return convertFileSrc(fullPath);
    }
</script>

<div class="relative w-full h-full bg-[#f1e0b9] overflow-hidden select-none">

    {#if mapState.isCalibrating}
        <div class="absolute inset-0 border-4 border-red-500 z-50 pointer-events-none flex items-center justify-center">
            <div class="bg-red-500 text-white px-4 py-2 rounded-b font-bold shadow-lg">
                MODO DE AJUSTE DE IMAGEM (Scroll para Escala, Arraste para Mover)
            </div>
        </div>
    {/if}
    
    <div class="absolute top-4 right-4 flex flex-col gap-2 bg-surface/90 p-2 rounded-lg shadow-md border border-text-muted/20 z-10 backdrop-blur-sm">
        
        <button onclick={() => cmd('map:camera:zoomIn')} class="p-2 hover:bg-background rounded transition-colors"><Plus size={20}/></button>
        <button onclick={() => cmd('map:camera:zoomOut')} class="p-2 hover:bg-background rounded transition-colors"><Minus size={20}/></button>
        <button onclick={() => cmd('map:camera:reset')} class="p-2 hover:bg-background rounded transition-colors"><MapIcon size={20}/></button>

        <hr class="border-text-muted/20 my-1"/>
    
        <button onclick={() => cmd('map:background:upload')} class="p-2 hover:bg-background rounded transition-colors" title="Carregar Mapa">
            <Image size={20}/>
        </button>
        
        <button onclick={() => cmd('map:background:toggle')} class="p-2 hover:bg-background rounded transition-colors" title="Mostrar/Esconder">
            {#if projectStore.current?.data.mapBackground.active}
                <Eye size={20}/>
            {:else}
                <EyeOff size={20}/>
            {/if}
        </button>

        {#if projectStore.current?.data.mapBackground.active}
            <button 
                onclick={() => cmd('map:calibrate:toggle')} 
                class="p-2 rounded transition-colors {mapState.isCalibrating ? 'bg-red-500 text-white hover:bg-red-600' : 'hover:bg-background'}" 
                title="Ajustar Imagem"
            >
                <Move size={20}/> 
            </button>
        {/if}

    </div>

    <div class="absolute bottom-4 left-4 p-3 bg-surface/80 backdrop-blur-sm rounded-lg border border-text-muted/10 text-[13px] text-text-muted font-mono space-y-1 pointer-events-none shadow-sm z-10">
        <p>• Arrastar Fundo: Pan</p>
        <p>• Scroll: Zoom</p>
        <p>• Duplo Clique: Criar Local</p>
        <p>• Botão Direito: Conectar</p>
    </div>

    {#if mapState.selectedLocationId && projectStore.current}
        {@const loc = projectStore.current.data.locations.find(l => l.id === mapState.selectedLocationId)}
        {#if loc}
            <div class="absolute top-4 left-4 w-80 bg-surface/95 backdrop-blur-md rounded-xl shadow-2xl border border-text-muted/20 p-4 z-20 animate-in fade-in slide-in-from-left-4 duration-300">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex flex-col w-full mr-2">
                        <span class="text-[10px] uppercase font-bold text-text-muted tracking-widest mb-1">Editando Local</span>
                        <input type="text" bind:value={loc.name} oninput={() => { if(projectStore.current) projectStore.current.changesUnsaved = true; pluginBridge.emitInternal('location:updated', loc); }} class="bg-transparent border-b border-dashed border-text-muted/50 text-xl font-serif font-bold text-text-main focus:border-primary outline-none w-full pb-1"/>
                    </div>
                    <button onclick={closeEdit} class="text-text-muted hover:text-primary cursor-pointer"><X size={18}/></button>
                </div>
                <div class="space-y-4">
                    <div class="space-y-1">
                        <label class="flex items-center gap-1 text-xs font-bold text-text-muted uppercase"><AlignLeft size={12}/> Descrição</label>
                        <textarea bind:value={loc.description} oninput={() => { if(projectStore.current) projectStore.current.changesUnsaved = true; pluginBridge.emitInternal('location:updated', loc); }} rows="4" placeholder="Descrição..." class="w-full bg-background/50 border border-text-muted/20 rounded-lg p-3 text-sm text-text-main resize-none"></textarea>
                    </div>
                    <div class="flex items-center justify-between pt-3 border-t border-text-muted/10">
                        <div class="flex items-center gap-1 text-xs text-text-muted font-mono" title="Coordenadas"><Info size={12} /> {Math.round(loc.coordinates.x)}, {Math.round(loc.coordinates.y)}</div>
                        <button onclick={() => cmd('map:selection:delete')} class="flex items-center gap-1 text-xs font-bold text-red-600 hover:bg-red-100 px-3 py-1.5 rounded cursor-pointer"><Trash2 size={14} /> Deletar</button>
                    </div>
                </div>
                
                <hr class="my-2 border-spacing-y-0.5 border-primary">

                {#if eventsOfSelectedLocation.length > 0}

                    <label class="text-sm font-bold text-text-muted uppercase text-center">Eventos que ocorreram nesse local:</label>

                    <div class="flex flex-col gap-4 overflow-y-auto scrollbar-hide p-4 border border-primary rounded-xl max-h-60 mt-4">

                         {#each eventsOfSelectedLocation as event}
                            <div class="flex flex-col p-3 rounded-lg border border-text-muted/10 shadow-sm bg-surface/80 backdrop-blur-sm
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
                    <label class="text-sm font-bold text-text-muted uppercase text-center">Não ocorreu nenhum evento nesse local</label>
                {/if}

            </div>
        {/if}
    {/if}

    {#if mapState.selectedConnectionId && projectStore.current}
        {@const conn = projectStore.current.data.connections.find(c => c.id === mapState.selectedConnectionId)}
        {#if conn}
            {@const fromLoc = getLocationById(conn.fromLocationId)}
            {@const toLoc = getLocationById(conn.toLocationId)}
            <div class="absolute top-4 left-4 w-80 bg-surface/95 backdrop-blur-md rounded-xl shadow-2xl border border-text-muted/20 p-4 z-20 animate-in fade-in slide-in-from-left-4 duration-300">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex flex-col w-full mr-2">
                        <span class="text-[10px] uppercase font-bold text-text-muted tracking-widest mb-1">Editando Conexão</span>
                        <h3 class="text-md font-serif font-bold text-text-main flex items-center gap-2">{fromLoc?.name.substring(0, 10) || '?'} <span class="text-text-muted text-xs"><MoveHorizontalIcon/></span> {toLoc?.name.substring(0, 10) || '?'}</h3>
                        <input type="text" bind:value={conn.name} oninput={() => { if(projectStore.current) projectStore.current.changesUnsaved = true; pluginBridge.emitInternal('connection:updated', conn); }} class="bg-transparent border-b border-dashed border-text-muted/50 text-xl font-serif font-bold text-text-main focus:border-primary outline-none w-full pb-1"/>
                    </div>
                    <button onclick={closeEdit} class="text-text-muted hover:text-primary cursor-pointer"><X size={18}/></button>
                </div>
                <div class="space-y-4">
                    <div class="space-y-1">
                        <label class="flex items-center gap-1 text-xs font-bold text-text-muted uppercase"><Route size={12}/> Tipo / Descrição</label>
                        <input type="text" bind:value={conn.description} oninput={() => { if(projectStore.current) projectStore.current.changesUnsaved = true; pluginBridge.emitInternal('connection:updated', conn); }} placeholder="Ex: Estrada de Terra, Rio..." class="w-full bg-background/50 border border-text-muted/20 rounded-lg p-3 text-sm text-text-main focus:ring-1 focus:ring-primary outline-none"/>
                    </div>
                    <div class="flex items-center justify-end pt-3 border-t border-text-muted/10">
                        <button onclick={() => cmd('map:selection:delete')} class="flex items-center gap-1 text-xs font-bold text-red-600 hover:bg-red-100 px-3 py-1.5 rounded cursor-pointer"><Trash2 size={14} /> Deletar Conexão</button>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
    
    <svg 
        bind:this={svgElement}
        class="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
        onpointerdown={handlePointerDownBg}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointerleave={handlePointerUp}
        onwheel={handleWheel}
        ondblclick={handleBgDblClick}
        oncontextmenu={(e) => { e.preventDefault(); cmd('map:connection:cancel'); }}
    >
        <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--text-muted)" stroke-width="0.5" opacity="0.4"/>
            </pattern>
        </defs>

        <g transform="translate({mapState.view.x}, {mapState.view.y}) scale({mapState.view.k})" style="transform-origin: 0 0;">
            
            {#if projectStore.current?.data.mapBackground.active && bgUrl}
                {@const bg = projectStore.current.data.mapBackground}
                {#await bgUrl then src}
                    <image 
                        href={src}
                        x={bg.x} 
                        y={bg.y}
                        transform="scale({bg.scale})"
                        opacity={bg.opacity}
                        class="pointer-events-none" 
                    />
                {/await}
            {/if}

            <rect x={-mapState.view.x/mapState.view.k - 5000} y={-mapState.view.y/mapState.view.k - 5000} width="200000" height="200000" fill="url(#grid)" pointer-events="none" />

            {#if projectStore.current}
                {#each projectStore.current.data.connections as conn}
                    {@const from = getLocationById(conn.fromLocationId)}
                    {@const to = getLocationById(conn.toLocationId)}
                    {#if from && to}
                        <g class="group cursor-pointer">
                            <line 
                                x1={from.coordinates.x} y1={from.coordinates.y} 
                                x2={to.coordinates.x} y2={to.coordinates.y} 
                                stroke={mapState.selectedConnectionId === conn.id ? "var(--primary)" : "var(--text-muted)"}
                                stroke-width={mapState.selectedConnectionId === conn.id ? 3 : 2}
                                stroke-dasharray="5,5"
                                pointer-events="none"
                                class="opacity-60 group-hover:opacity-100 group-hover:stroke-primary transition-all"
                            />
                            <line 
                                x1={from.coordinates.x} y1={from.coordinates.y} 
                                x2={to.coordinates.x} y2={to.coordinates.y} 
                                stroke="transparent" stroke-width="20"
                                pointer-events="stroke"
                                onpointerdown={(e) => handleConnectionPointerDown(e, conn.id)}
                            />
                            <text y={(from.coordinates.y + to.coordinates.y)/2 + 15} x={(from.coordinates.x + to.coordinates.x)/2} text-anchor="middle" class="text-[10px] uppercase font-bold tracking-wider fill-text-muted group-hover:opacity-100 transition-opacity bg-background px-1 pointer-events-none">
                                {conn.description}
                            </text>
                        </g>
                    {/if}
                {/each}
            {/if}

            {#if mapState.connection.active && mapState.connection.fromId}
                {@const from = getLocationById(mapState.connection.fromId)}
                {#if from}
                    <line 
                        x1={from.coordinates.x} y1={from.coordinates.y} 
                        x2={mapState.connection.currX} y2={mapState.connection.currY} 
                        stroke="var(--primary)" stroke-width="2" stroke-dasharray="4"
                        pointer-events="none" class="animate-pulse"
                    />
                {/if}
            {/if}

            {#if projectStore.current}
                {#each projectStore.current.data.locations as loc (loc.id)}
                    <g 
                        transform="translate({loc.coordinates.x}, {loc.coordinates.y})"
                        class="cursor-pointer group"
                        onpointerdown={(e) => handleNodePointerDown(e, loc.id)}
                        onpointerup={(e) => handleNodePointerUp(e, loc.id)} 
                        oncontextmenu={(e) => handleNodeContext(e, loc.id)}
                    >
                        <circle r={NODE_RADIUS + 5} fill="var(--primary)" 
                            class="transition-opacity {mapState.selectedLocationId === loc.id ? 'opacity-40' : 'opacity-0 group-hover:opacity-20'}" 
                        />
                        <circle r={NODE_RADIUS} fill="var(--background)" 
                            stroke={mapState.connection.fromId === loc.id || mapState.selectedLocationId === loc.id ? "var(--primary)" : "var(--text-main)"}
                            stroke-width={mapState.connection.fromId === loc.id || mapState.selectedLocationId === loc.id ? 3 : 2}
                            class="transition-colors shadow-sm"
                        />
                        <text y="5" text-anchor="middle" class="font-serif text-xs font-bold fill-text-main pointer-events-none select-none">
                            {loc.name.substring(0, 4).toUpperCase()}
                        </text>
                        <text y={NODE_RADIUS + 15} text-anchor="middle" class="text-[10px] uppercase font-bold tracking-wider fill-text-muted group-hover:opacity-100 transition-opacity bg-background px-1 pointer-events-none">
                            {loc.name}
                        </text>
                    </g>
                {/each}
            {/if}

            {#if projectStore.current?.data.locations.length === 0}
                {@const pos = toWorld(mapState.view.x+800, mapState.view.y+200)}
                <text x={pos.x} y={pos.y} text-anchor="middle" class="font-serif text-xl font-bold fill-text-main pointer-events-none select-none">
                    Adicione locais no mapa e crie conexões entre eles para formar seu mundo!
                </text>
            {/if}
        </g>
    </svg>
</div>