import { projectStore } from '$lib/stores/project.svelte';
import { appState } from '$lib/stores/app.svelte';
import { recentStore } from '$lib/stores/recent.svelte';
import { commandRegistry } from '$lib/services/commands';
import { ask, message } from '@tauri-apps/plugin-dialog';
import { GREGORIAN_MONTHS } from '$lib/models/project';

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

function updateMonthCommand(args: { index: number, field: 'name' | 'days', value: any }) {
    if (!projectStore.current) return;
    
    const months = projectStore.current.data.calendar.months;
    if (months[args.index]) {
        (months[args.index] as any)[args.field] = args.value;
        projectStore.current.changesUnsaved = true;
    }
}

function addMonthCommand() {
    if (!projectStore.current) return;
    
    projectStore.current.data.calendar.months.push({
        name: 'Novo Mês',
        days: 30
    });
    projectStore.current.changesUnsaved = true;
}

function removeMonthCommand(args: { index: number }) {
    if (!projectStore.current) return;
    
    const months = projectStore.current.data.calendar.months;
    if (months.length > 1) {
        months.splice(args.index, 1);
        projectStore.current.changesUnsaved = true;
    }
}

function resetCalendarCommand() {
    if (!projectStore.current) return;
    
    projectStore.current.data.calendar.months = JSON.parse(JSON.stringify(GREGORIAN_MONTHS));
    projectStore.current.changesUnsaved = true;
}

export function registerProjectSettingsCommands() {
    commandRegistry.register('project:rename', renameProjectCommand, 'Salvar novo nome do projeto');
    commandRegistry.register('project:delete', deleteProjectCommand, 'Deletar projeto do disco');
    commandRegistry.register('project:config:update', updateProjectConfigCommand, 'Atualizar configuração do projeto');
    commandRegistry.register('project:calendar:reset', resetCalendarCommand, 'Restaurar calendário padrão');
    commandRegistry.register('project:calendar:update_month', updateMonthCommand, 'Atualizar mês específico');
    commandRegistry.register('project:calendar:add', addMonthCommand, 'Adicionar um novo mês');
    commandRegistry.register('project:calendar:remove', removeMonthCommand, 'Remover um mês');
    commandRegistry.register('project:calendar:reset', resetCalendarCommand, 'Resetar para o calendário padrão (Gregoriano)');
}