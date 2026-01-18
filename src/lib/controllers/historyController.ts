import { commandRegistry } from "$lib/services/commands";
import { historyStore } from "$lib/stores/history.svelte";

export function registerHistoryController() {
    commandRegistry.register('history:undo', () => historyStore.undo(), 'Desfazer a última ação');
    commandRegistry.register('history:redo', () => historyStore.redo(), 'Refazer a ação desfeita');
}