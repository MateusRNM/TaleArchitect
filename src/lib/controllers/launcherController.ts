import { save, open } from '@tauri-apps/plugin-dialog';
import { projectStore } from '$lib/stores/project.svelte';
import { appState } from '$lib/stores/app.svelte';
import { recentStore } from '$lib/stores/recent.svelte';
import { commandRegistry } from '$lib/services/commands';

async function createProjectCommand(args: { name: string }) {
    if (!args.name) throw new Error("Nome do projeto é obrigatório");

    const path = await save({
        filters: [{ name: 'Projeto TaleArchitect', extensions: ['talearc'] }]
    });

    if (path) {
        await projectStore.create(args.name, path);
        
        recentStore.addOrUpdate({
            name: projectStore.current!.data.name,
            dir: path,
            createdAt: projectStore.current!.data.createdAt,
            lastOpenedAt: projectStore.current!.data.lastOpenedAt,
        });

        appState.goToWorkspace();
    }
}

async function openProjectCommand(args?: { path?: string }) {
    let path = args?.path;

    if (!path) {
        const result = await open({
            multiple: false,
            filters: [{ name: 'Projeto TaleArchitect', extensions: ['talearc'] }]
        });
        if (typeof result === 'string') path = result;
    }

    if (path) {
        await projectStore.load(path);
        
        recentStore.addOrUpdate({
            name: projectStore.current!.data.name,
            dir: path,
            createdAt: projectStore.current!.data.createdAt,
            lastOpenedAt: projectStore.current!.data.lastOpenedAt,
        });

        appState.goToWorkspace();
    }
}

export function registerLauncherCommands() {
    commandRegistry.register('project:create', createProjectCommand, 'Criar um novo projeto');
    commandRegistry.register('project:open', openProjectCommand, 'Abrir um projeto existente');
}