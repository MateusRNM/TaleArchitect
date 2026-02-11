import { projectStore } from '$lib/stores/project.svelte';
import { commandRegistry } from '$lib/services/commands';
import { ask, open } from '@tauri-apps/plugin-dialog';
import { pluginBridge } from '$lib/services/pluginBridge.svelte';
import { dirname, extname, join } from '@tauri-apps/api/path';
import { copyFile, mkdir } from '@tauri-apps/plugin-fs';

export const mapState = $state({
    view: { x: 0, y: 0, k: 1 },
    isPanning: false,
    isCalibrating: false,
    draggingNodeId: null as string | null,
    selectedLocationId: null as string | null,
    selectedConnectionId: null as string | null,
    connection: {
        active: false,
        fromId: null as string | null,
        currX: 0,
        currY: 0
    }
});

let svgElement: SVGSVGElement | null = null;

export function setMapContainer(el: SVGSVGElement) {
    svgElement = el;
}

export function toWorld(screenX: number, screenY: number) {
    if (!svgElement) return { x: 0, y: 0 };
    const rect = svgElement.getBoundingClientRect();
    
    const mouseX = screenX - rect.left;
    const mouseY = screenY - rect.top;

    return {
        x: (mouseX - mapState.view.x) / mapState.view.k,
        y: (mouseY - mapState.view.y) / mapState.view.k
    };
}

function createLocationCommand(args: { x: number, y: number }) {
    projectStore.current?.addLocation("Novo Local", "", args.x, args.y);
}

async function deleteSelectionCommand() {
    if (mapState.selectedLocationId) {
        const confirmed = await ask('Deseja deletar esse local? Todas as conexões dele também serão deletadas.', { title: 'Deletar Local', kind: 'warning' });
        if (confirmed) {
            projectStore.current?.removeLocation(mapState.selectedLocationId);
            mapState.selectedLocationId = null;
        }
    } 
    else if (mapState.selectedConnectionId) {
        const confirmed = await ask('Deseja deletar essa conexão?', { title: 'Deletar Conexão', kind: 'warning' });
        if (confirmed) {
            projectStore.current?.removeConnection(mapState.selectedConnectionId);
            mapState.selectedConnectionId = null;
        }
    }
}

function resetCameraCommand() {
    mapState.view = { x: 0, y: 0, k: 1 };
}

function zoomInCommand() {
    mapState.view.k = Math.min(mapState.view.k + 0.2, 5);
}

function zoomOutCommand() {
    mapState.view.k = Math.max(mapState.view.k - 0.2, 0.1);
}

function startConnectionCommand(args: { fromId: string, x: number, y: number }) {
    mapState.connection = {
        active: true,
        fromId: args.fromId,
        currX: args.x,
        currY: args.y
    };
    mapState.selectedLocationId = null;
}

function completeConnectionCommand(args: { toId: string }) {
    if (mapState.connection.fromId && mapState.connection.fromId !== args.toId) {
        projectStore.current?.connectLocations("Nova conexão", "", mapState.connection.fromId, args.toId);
    }
    cancelConnectionCommand();
}

function cancelConnectionCommand() {
    mapState.connection = { active: false, fromId: null, currX: 0, currY: 0 };
}

function setViewCommand(args: { x?: number, y?:number, k?: number }) {
    if(args.x) mapState.view.x = args.x;
    if(args.y) mapState.view.y = args.y;
    if(args.k) mapState.view.k = args.k;
}

function toggleCalibrationCommand() {
    mapState.isCalibrating = !mapState.isCalibrating;
    
    if (mapState.isCalibrating) {
        mapState.selectedLocationId = null;
        mapState.selectedConnectionId = null;
    }
}

async function uploadBackgroundCommand() {
    if(!projectStore.current) return;

    const file = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
    });

    if(file) {
        try {
            const projectDir = await dirname(projectStore.current?.data.projectdir as string);
            const assetsDir = await join(projectDir, 'assets');
            await mkdir(assetsDir, { recursive: true });
            const ext = await extname(file);
            const newFileName = `map-bg-image.${ext}`;
            const destPath = await join(assetsDir, newFileName);
            await copyFile(file, destPath);

            projectStore.current.data.mapBackground.path = `assets/${newFileName}`;
            projectStore.current.data.mapBackground.active = true;
            projectStore.current.data.mapBackground.x = 0;
            projectStore.current.data.mapBackground.y = 0;
            projectStore.current.data.mapBackground.scale = 1;
            projectStore.current.changesUnsaved = true;

        } catch (error) {
            pluginBridge.api.ui.toast('Falha ao importar a imagem para o projeto', 'error');
        }
    }
}

function toggleBackgroundCommand() {
    if (!projectStore.current) return;
    projectStore.current.data.mapBackground.active = !projectStore.current.data.mapBackground.active;
}

export function registerMapCommands() {
    commandRegistry.register('map:calibrate:toggle', toggleCalibrationCommand, 'Ativar/desativar modo de ajuste do fundo do mapa');
    commandRegistry.register('map:background:upload', uploadBackgroundCommand, 'Carregar imagem de fundo');
    commandRegistry.register('map:background:toggle', toggleBackgroundCommand, 'Mostrar/Esconder fundo');

    commandRegistry.register('map:location:create', createLocationCommand, {
        description: 'Cria um novo local',
        addToHistory: true
    });

    commandRegistry.register('map:selection:delete', deleteSelectionCommand, {
        description: 'Deleta o objeto selecionado (conexão ou local)',
        addToHistory: true
    });

    commandRegistry.register('map:camera:reset', resetCameraCommand, 'Reseta a câmera para a posição e zoom inicial');
    commandRegistry.register('map:camera:zoomIn', zoomInCommand, 'Aumenta o zoom');
    commandRegistry.register('map:camera:zoomOut', zoomOutCommand, 'Diminui o zoom');
    commandRegistry.register('map:connection:start', startConnectionCommand, 'Começa uma conexão');

    commandRegistry.register('map:connection:complete', completeConnectionCommand, {
        description: 'Completa uma conexão',
        addToHistory: true
    });
    
    commandRegistry.register('map:connection:cancel', cancelConnectionCommand, 'Cancela uma conexão');
    commandRegistry.register('map:setview', setViewCommand, 'Muda os valores da view da câmera');
}