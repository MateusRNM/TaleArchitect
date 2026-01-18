export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

class ToastStore {
    items = $state<Toast[]>([]);

    add(message: string, type: ToastType = 'info', duration = 3000) {
        const id = crypto.randomUUID();
        
        this.items.push({ id, message, type, duration });

        setTimeout(() => {
            this.remove(id);
        }, duration);
    }

    remove(id: string) {
        this.items = this.items.filter(t => t.id !== id);
    }
}

export const toastStore = new ToastStore();