import { projectStore } from '$lib/stores/project.svelte';
import { appState } from '$lib/stores/app.svelte';
import { recentStore } from '$lib/stores/recent.svelte';
import { commandRegistry } from '$lib/services/commands';
import { ask, message } from '@tauri-apps/plugin-dialog';

async function renameProjectCommand() {
    if (!projectStore.current || projectStore.current.data.name === '') return;
    
    await projectStore.save();

    recentStore.addOrUpdate({
        name: projectStore.current.data.name,
        dir: projectStore.current.data.projectdir,
        createdAt: projectStore.current.data.createdAt,
        lastOpenedAt: projectStore.current.data.lastOpenedAt
    });
}

async function deleteProjectCommand() {
    if (!projectStore.current) return;

    const confirmed = await ask(
        'Tem certeza que deseja excluir este projeto permanentemente?\nO arquivo será apagado do disco.', 
        { title: 'Excluir Projeto', kind: 'warning' }
    );

    if (confirmed) {
        try {
            const dir = projectStore.current.data.projectdir;

            await projectStore.deleteProject();

            recentStore.remove(dir);
            appState.goToLauncher();
        } catch (e) {
            await message('Erro ao deletar arquivo: ' + e, { kind: 'error' });
        }
    }
}

function updateProjectConfigCommand(args: { key: string, value: any, subkey?: string }) {
    if (!projectStore.current) return;

    if (args.subkey) {
        (projectStore.current.data as any)[args.key][args.subkey] = args.value;
    } else {
        (projectStore.current.data as any)[args.key] = args.value;
    }
    
    projectStore.current.changesUnsaved = true;
}

function resetCalendarCommand() {
    if (!projectStore.current) return;
    
    projectStore.current.data.calendar = { monthDuration: 30, yearDuration: 12 };
    projectStore.current.changesUnsaved = true;
}

export function registerProjectSettingsCommands() {
    commandRegistry.register('project:rename', renameProjectCommand, 'Salvar novo nome do projeto');
    commandRegistry.register('project:delete', deleteProjectCommand, 'Deletar projeto do disco');
    commandRegistry.register('project:config:update', updateProjectConfigCommand, 'Atualizar configuração do projeto');
    commandRegistry.register('project:calendar:reset', resetCalendarCommand, 'Restaurar calendário padrão');
}