import { projectStore } from '$lib/stores/project.svelte';
import { appState } from '$lib/stores/app.svelte';
import { commandRegistry } from '$lib/services/commands';
import { ask } from "@tauri-apps/plugin-dialog";
import { uiManager } from '$lib/stores/ui.svelte';
import { registerProjectSettingsCommands } from './projectSettingsController';
import { registerCharacterCommands } from './charactersController.svelte';
import { registerMapCommands } from './mapController.svelte';
import { registerTimelineCommands } from './timelineController.svelte';
import { registerHistoryController } from './historyController';

async function saveProjectCommand() {
    if (projectStore.current) {
        await projectStore.save();
        return true; 
    }
    return false;
}

async function closeProjectCommand() {
    if (projectStore.current?.changesUnsaved) {
        const confirmed = await ask(
            'O seu projeto possui alterações que não foram salvas. Deseja salvar antes de sair?', 
            { title: 'Alterações não salvas', kind: 'warning' }
        );
        
        if (confirmed) {
            await projectStore.save();
        }
    }
    
    projectStore.close();
    appState.goToLauncher();
}

function navigateTabCommand(args: { tabId: string }) {
    if(uiManager.tabs.findIndex((tab) => tab.id === args.tabId) === -1) throw new Error("Aba inexistente.");
    appState.activeTab = args.tabId;
}

export function registerWorkspaceCommands() {
    commandRegistry.register('project:save', saveProjectCommand, 'Salvar projeto atual');
    commandRegistry.register('project:close', closeProjectCommand, 'Fechar projeto e voltar ao launcher');

    commandRegistry.register('ui:navigate', navigateTabCommand, {
        description: 'Mudar para uma aba específica',
        argsProvider: () => {
            return uiManager.tabs.map(tab => ({
                label: tab.label,
                description: '',
                value: { tabId: tab.id },
                icon: tab.icon
            }));
        }
    });

    registerProjectSettingsCommands();
    registerCharacterCommands();
    registerMapCommands();
    registerTimelineCommands();
    registerHistoryController();
}