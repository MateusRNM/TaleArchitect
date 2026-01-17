<script lang="ts">
    import { projectStore } from '$lib/stores/project.svelte';
    import { ask } from "@tauri-apps/plugin-dialog";
    import { Plus, Minus, Map as MapIcon, X, Trash2 } from 'lucide-svelte';

    let view = $state({ x: 0, y: 0, k: 1 });
    
    let isPanning = $state(false);
    let startPan = { x: 0, y: 0 };
    let startView = { x: 0, y: 0 };

    let draggingNodeId = $state<string | null>(null);
    let selectedLocationId = $state<string | null>(null);
    let selectedConnectionId = $state<string | null>(null);
    let dragStartCoords = { x: 0, y: 0 };

    let svgContainer: SVGSVGElement;

    let connectionState = $state({
        active: false,
        fromId: null as string | null,
        currX: 0,
        currY: 0
    });

    const NODE_RADIUS = 30;

    function toWorld(screenX: number, screenY: number) {
        if (!svgContainer) return { x: 0, y: 0 };
        const rect = svgContainer.getBoundingClientRect();

        const mouseX = screenX - rect.left;
        const mouseY = screenY - rect.top;

        return {
            x: (mouseX - view.x) / view.k,
            y: (mouseY - view.y) / view.k
        };
    }

    function getLocationById(id: string) {
        return projectStore.current?.data.locations.find(l => l.id === id);
    }

    function handleWheel(e: WheelEvent) {
        e.preventDefault();

        const minK = 0.1, maxK = 5, intensity = 0.1;
        const delta = e.deltaY > 0 ? -1 : 1;
        const newK = Math.min(Math.max(minK, view.k * (1 + delta * intensity)), maxK);

        const worldPos = toWorld(e.clientX, e.clientY);

        const rect = svgContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        view.k = newK;
        view.x = mouseX - (worldPos.x * newK);
        view.y = mouseY - (worldPos.y * newK);
    }

    function handlePointerDownBg(e: PointerEvent) {
        if (e.button === 0 && e.target === e.currentTarget) {
            isPanning = true;
            svgContainer.setPointerCapture(e.pointerId);
            startPan = { x: e.clientX, y: e.clientY };
            startView = { x: view.x, y: view.y };
            
            selectedLocationId = null;
            selectedConnectionId = null;
        }
    }

    function handlePointerMove(e: PointerEvent) {
        if (isPanning) {
            const dx = e.clientX - startPan.x;
            const dy = e.clientY - startPan.y;
            view.x = startView.x + dx;
            view.y = startView.y + dy;
            return;
        }

        const worldPos = toWorld(e.clientX, e.clientY);

        if (draggingNodeId && projectStore.current) {
            const loc = projectStore.current.data.locations.find(l => l.id === draggingNodeId);
            if (loc) {
                loc.coordinates.x = worldPos.x;
                loc.coordinates.y = worldPos.y;
                projectStore.current.changesUnsaved = true;
            }
        }

        if (connectionState.active) {
            connectionState.currX = worldPos.x;
            connectionState.currY = worldPos.y;
        }
    }

    function handlePointerUp(e: PointerEvent) {
        if (isPanning) {
            isPanning = false;
            svgContainer.releasePointerCapture(e.pointerId);
        }
        draggingNodeId = null;
    }

    function handleBgDblClick(e: MouseEvent) {
        if (!projectStore.current) return;
        const pos = toWorld(e.clientX, e.clientY);
        projectStore.current.addLocation("Novo Local", "", pos.x, pos.y);
    }

    function handleNodePointerDown(e: PointerEvent, id: string) {
        if (e.button === 0) {
            e.stopPropagation();
            draggingNodeId = id;
            dragStartCoords = { x: e.clientX, y: e.clientY };
        }
    }

    function handleNodePointerUp(e: PointerEvent, id: string) {
        const dist = Math.hypot(e.clientX - dragStartCoords.x, e.clientY - dragStartCoords.y);
        if (dist < 5) {
            selectedLocationId = id;
            selectedConnectionId = null;
        }
        draggingNodeId = null;
    }

    function handleNodeContext(e: MouseEvent, id: string) {
        e.preventDefault();
        e.stopPropagation();

        if (!connectionState.active) {
            const pos = toWorld(e.clientX, e.clientY);
            connectionState = { active: true, fromId: id, currX: pos.x, currY: pos.y };
        } else {
            if (connectionState.fromId && connectionState.fromId !== id) {
                projectStore.current?.connectLocations("Nova Conexão", "", connectionState.fromId, id);
            }
            cancelConnection();
        }
    }

    function handleConnectionPointerDown(e: PointerEvent, id: string) {
        e.stopPropagation(); 
        
        if (e.button === 0) {
            selectedConnectionId = id;
            selectedLocationId = null;
        }
    }

    function cancelConnection() {
        connectionState = { active: false, fromId: null, currX: 0, currY: 0 };
    }

    async function deleteSelectedLocation() {
        if (!selectedLocationId || !projectStore.current) return;
        const confirmed = await ask('Deseja deletar esse local? Todas as conexões desse local também serão excluídas.', { title: 'Deletar Local', kind: 'warning' });
        if (confirmed) {
            projectStore.current.data.connections = projectStore.current.data.connections.filter(
                c => c.fromLocationId !== selectedLocationId && c.toLocationId !== selectedLocationId
            );
            projectStore.current.data.locations = projectStore.current.data.locations.filter(l => l.id !== selectedLocationId);
            projectStore.current.changesUnsaved = true;
            selectedLocationId = null;
        }
    }

    async function deleteSelectedConnection() {
        if (!selectedConnectionId || !projectStore.current) return;
        const confirmed = await ask('Deseja deletar essa conexão?', { title: 'Deletar Conexão', kind: 'warning' });
        if (confirmed) {
            projectStore.current.data.connections = projectStore.current.data.connections.filter(c => c.id !== selectedConnectionId);
            projectStore.current.changesUnsaved = true;
            selectedConnectionId = null;
        }
    }

    function closeEdit() {
        selectedLocationId = null;
        selectedConnectionId = null;
    }

    function resetView() {
        view = { x: 0, y: 0, k: 1 };
    }
</script>

<div class="relative w-full h-full bg-[#E8E0CD] overflow-hidden select-none">
    
    <div class="absolute top-4 right-4 flex flex-col gap-2 bg-surface/90 p-2 rounded-lg shadow-md border border-text-muted/20 z-10 backdrop-blur-sm">
        <button onclick={() => view.k = Math.min(view.k + 0.2, 5)} class="p-2 hover:bg-background rounded transition-colors"><Plus size={20}/></button>
        <button onclick={() => view.k = Math.max(view.k - 0.2, 0.1)} class="p-2 hover:bg-background rounded transition-colors"><Minus size={20}/></button>
        <button onclick={resetView} class="p-2 hover:bg-background rounded transition-colors"><MapIcon size={20}/></button>
    </div>

    <div class="absolute bottom-4 left-4 p-3 bg-surface/80 backdrop-blur-sm rounded-lg border border-text-muted/10 text-[10px] text-text-muted font-mono space-y-1 pointer-events-none shadow-sm z-10">
        <p>• Arrastar Fundo: Pan</p>
        <p>• Scroll: Zoom</p>
        <p>• Duplo Clique: Criar Local</p>
        <p>• Botão Direito (Arrastar): Conectar</p>
    </div>

    {#if selectedLocationId && projectStore.current}
        {@const loc = projectStore.current.data.locations.find(l => l.id === selectedLocationId)}
        {#if loc}
            <div class="absolute top-4 left-4 w-80 bg-surface/95 backdrop-blur-md rounded-xl shadow-2xl border border-text-muted/20 p-4 z-20 animate-in fade-in slide-in-from-left-4 duration-300">
                <div class="flex justify-between items-start mb-4">
                    <input type="text" bind:value={loc.name} oninput={() => { if(projectStore.current) projectStore.current.changesUnsaved = true; }} class="bg-transparent border-b border-dashed border-text-muted/50 text-xl font-serif font-bold text-text-main focus:border-primary outline-none w-full pb-1 mr-2"/>
                    <button onclick={closeEdit} class="text-text-muted hover:text-primary cursor-pointer"><X size={18}/></button>
                </div>
                <div class="space-y-4">
                    <textarea bind:value={loc.description} oninput={() => { if(projectStore.current) projectStore.current.changesUnsaved = true; }} rows="4" placeholder="Descrição..." class="w-full bg-background/50 border border-text-muted/20 rounded-lg p-3 text-sm text-text-main resize-none"></textarea>
                    <div class="flex justify-end pt-2 border-t border-text-muted/10">
                        <button onclick={deleteSelectedLocation} class="flex items-center gap-1 text-xs font-bold text-red-600 hover:bg-red-100 px-3 py-1.5 rounded cursor-pointer"><Trash2 size={14} /> Deletar</button>
                    </div>
                </div>
            </div>
        {/if}
    {/if}

    {#if selectedConnectionId && projectStore.current}
        {@const conn = projectStore.current.data.connections.find(c => c.id === selectedConnectionId)}
        {#if conn}
            <div class="absolute top-4 left-4 w-80 bg-surface/95 backdrop-blur-md rounded-xl shadow-2xl border border-text-muted/20 p-4 z-20 animate-in fade-in slide-in-from-left-4 duration-300">
            
                <div class="flex justify-between items-start mb-4">
                    <input type="text" bind:value={conn.name} oninput={() => { if(projectStore.current) projectStore.current.changesUnsaved = true; }} class="bg-transparent border-b border-dashed border-text-muted/50 text-xl font-serif font-bold text-text-main focus:border-primary outline-none w-full pb-1 mr-2"/>
                    <button onclick={closeEdit} class="text-text-muted hover:text-primary cursor-pointer"><X size={18}/></button>
                </div>

                <div class="space-y-4">
                    <textarea bind:value={conn.description} oninput={() => { if(projectStore.current) projectStore.current.changesUnsaved = true; }} rows="4" placeholder="Descrição..." class="w-full bg-background/50 border border-text-muted/20 rounded-lg p-3 text-sm text-text-main resize-none"></textarea>
                    <div class="flex justify-end pt-2 border-t border-text-muted/10">
                        <button onclick={deleteSelectedConnection} class="flex items-center gap-1 text-xs font-bold text-red-600 hover:bg-red-100 px-3 py-1.5 rounded cursor-pointer"><Trash2 size={14} /> Deletar</button>
                    </div>
                </div>

            </div>
        {/if}
    {/if}
    
    <svg 
        bind:this={svgContainer}
        class="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
        onpointerdown={handlePointerDownBg}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointerleave={handlePointerUp}
        onwheel={handleWheel}
        ondblclick={handleBgDblClick}
        oncontextmenu={(e) => { e.preventDefault(); cancelConnection(); }}
    >
        <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--text-muted)" stroke-width="0.5" opacity="0.1"/>
            </pattern>
        </defs>

        <g transform="translate({view.x}, {view.y}) scale({view.k})" style="transform-origin: 0 0;">
            
            <rect x={-view.x/view.k - 5000} y={-view.y/view.k - 5000} width="200000" height="200000" fill="url(#grid)" pointer-events="none" />

            {#if projectStore.current}
                {#each projectStore.current.data.connections as conn}
                    {@const from = getLocationById(conn.fromLocationId)}
                    {@const to = getLocationById(conn.toLocationId)}
                    {#if from && to}
                        <g class="group cursor-pointer">
                            <line 
                                x1={from.coordinates.x} y1={from.coordinates.y} 
                                x2={to.coordinates.x} y2={to.coordinates.y} 
                                stroke={selectedConnectionId === conn.id ? "var(--primary)" : "var(--text-muted)"}
                                stroke-width={selectedConnectionId === conn.id ? 3 : 2}
                                stroke-dasharray="5,5"
                                pointer-events="none"
                                class="opacity-60 group-hover:opacity-100 group-hover:stroke-primary transition-all"
                            />

                            <line 
                                x1={from.coordinates.x} y1={from.coordinates.y} 
                                x2={to.coordinates.x} y2={to.coordinates.y} 
                                stroke="transparent"
                                stroke-width="20"
                                pointer-events="stroke"
                                onpointerdown={(e) => handleConnectionPointerDown(e, conn.id)}
                            />
                        </g>
                    {/if}
                {/each}
            {/if}

            {#if connectionState.active && connectionState.fromId}
                {@const from = getLocationById(connectionState.fromId)}
                {#if from}
                    <line 
                        x1={from.coordinates.x} y1={from.coordinates.y} 
                        x2={connectionState.currX} y2={connectionState.currY} 
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
                            class="transition-opacity {selectedLocationId === loc.id ? 'opacity-40' : 'opacity-0 group-hover:opacity-20'}" 
                        />
                        
                        <circle r={NODE_RADIUS} fill="var(--background)" 
                            stroke={connectionState.fromId === loc.id || selectedLocationId === loc.id ? "var(--primary)" : "var(--text-main)"}
                            stroke-width={connectionState.fromId === loc.id || selectedLocationId === loc.id ? 3 : 2}
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
        </g>
    </svg>
</div>