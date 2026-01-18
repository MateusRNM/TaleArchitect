import { projectStore } from './project.svelte';

const MAX_HISTORY = 50; 

class HistoryStore {
    past = $state<any[]>([]);
    future = $state<any[]>([]);

    capture() {
        if (!projectStore.current) return;

        const snapshot = structuredClone($state.snapshot(projectStore.current.data));
        
        this.past.push(snapshot);
        
        if (this.past.length > MAX_HISTORY) {
            this.past.shift();
        }

        this.future = [];
    }

    undo() {
        if (this.past.length === 0 || !projectStore.current) return;

        const currentSnapshot = structuredClone($state.snapshot(projectStore.current.data));
        this.future.push(currentSnapshot);

        const previousState = this.past.pop();

        if (previousState) {
            projectStore.current.data = previousState;
            projectStore.current.changesUnsaved = true;
        }
    }

    redo() {
        if (this.future.length === 0 || !projectStore.current) return;

        const currentSnapshot = structuredClone($state.snapshot(projectStore.current.data));
        this.past.push(currentSnapshot);

        const nextState = this.future.pop();

        if (nextState) {
            projectStore.current.data = nextState;
            projectStore.current.changesUnsaved = true;
        }
    }
}

export const historyStore = new HistoryStore();