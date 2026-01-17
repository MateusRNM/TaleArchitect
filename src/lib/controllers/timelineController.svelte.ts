import { projectStore } from '$lib/stores/project.svelte';
import { commandRegistry } from '$lib/services/commands';
import { ask } from '@tauri-apps/plugin-dialog';
import type { Time } from '$lib/models/project';

class TimelineController {

    view = $state<'list' | 'form'>('list');
    selectedEventId = $state<string | null>(null);
    scrollY = $state(50);
    formData = $state({
        name: '',
        description: '',
        date: { day: 1, month: 1, year: 1, hour: 0, minute: 0 } as Time,
        locationId: '' as string,
        characters: [] as string[]
    });

    public sortedEvents = $derived.by(() => {
        if (!projectStore.current) return [];
        return [...projectStore.current.data.events].sort((a, b) => {
            return this.getDateValue(a.date) - this.getDateValue(b.date);
        });
    });

    currentDate = $derived.by(() => {
        const list = this.sortedEvents;
        if (list.length === 0) return { day: 1, month: 1, year: 1 };
        return list[list.length - 1].date;
    });

    private getDaysInYear(): number {
        if (!projectStore.current) return 365;
        return projectStore.current.data.calendar.months.reduce((acc, m) => acc + m.days, 0);
    }

    private getDateValue(date: Time): number {
        if (!projectStore.current) return 0;
        
        const months = projectStore.current.data.calendar.months;
        const daysInYear = this.getDaysInYear();
        
        let totalDays = (date.year - 1) * daysInYear;

        for (let i = 0; i < date.month - 1; i++) {
            if (months[i]) totalDays += months[i].days;
        }

        totalDays += date.day;

        const totalMinutes = (totalDays * 1440) + ((date.hour || 0) * 60) + (date.minute || 0);
        return totalMinutes;
    }

    toggleCharacterInForm(charId: string) {
        const index = this.formData.characters.indexOf(charId);
        if (index === -1) {
            this.formData.characters.push(charId);
        } else {
            this.formData.characters.splice(index, 1);
        }
    }

    resetForm() {
        this.selectedEventId = null;
        const lastDate = this.sortedEvents.length > 0 ? { ...this.currentDate } : { day: 1, month: 1, year: 1, hour: 12, minute: 0 };
        this.formData = {
            name: '',
            description: '',
            date: lastDate,
            locationId: '',
            characters: []
        };
    }

    openCreate() {
        this.resetForm();
        this.view = 'form';
    }

    openEdit(id: string) {
        const event = projectStore.current?.data.events.find(e => e.id === id);
        if (!event) return;

        this.selectedEventId = event.id;
        this.formData = {
            name: event.name,
            description: event.description,
            date: { ...event.date },
            locationId: event.locationId || '',
            characters: event.characters ? [...event.characters] : [] 
        };
        this.view = 'form';
        commandRegistry.execute('ui:navigate', { tabId: 'timeline' });
    }

    async saveEvent() {
        if (!projectStore.current || !this.formData.name) return;

        const newEventData = {
            name: this.formData.name,
            description: this.formData.description,
            date: { ...this.formData.date },
            locationId: this.formData.locationId,
            characters: [...this.formData.characters]
        };

        if (this.selectedEventId) {
            projectStore.current.updateEvent(this.selectedEventId, newEventData);
        } else {
            projectStore.current.addEvent(newEventData.name, newEventData.description, newEventData.locationId, newEventData.date, newEventData.characters);
        }
        
        this.view = 'list';
        this.resetForm();
    }

    async deleteEvent() {
        if (!this.selectedEventId || !projectStore.current) return;

        const confirmed = await ask('Deseja excluir este evento?', { title: 'Excluir Evento', kind: 'warning' });
        if (confirmed) {
            projectStore.current.removeEvent(this.selectedEventId);
            this.view = 'list';
            this.resetForm();
        }
    }

    cancelForm() {
        this.view = 'list';
        this.resetForm();
    }

    scrollToTop() { this.scrollY = 100; }
    
    scrollToBottom() { 
        const totalHeight = this.sortedEvents.length * 120;
        this.scrollY = -totalHeight + 500; 
    }
}

export const timelineController = new TimelineController();

export function registerTimelineCommands() {
    commandRegistry.register('timeline:create', () => timelineController.openCreate(), 'Abre o formulário de criação de evento');
    commandRegistry.register('timeline:edit', (args: { id: string }) => timelineController.openEdit(args.id), 'Abre o formulário de edição de evento');
    commandRegistry.register('timeline:save', () => timelineController.saveEvent(), 'Salva um evento (adiciona ou atualiza dependendo do tipo de formulário aberto)');
    commandRegistry.register('timeline:delete', () => timelineController.deleteEvent(), 'Deleta o evento selecionado');
    commandRegistry.register('timeline:cancel', () => timelineController.cancelForm(), 'Cancela/fecha o formulário');
    commandRegistry.register('timeline:scroll:top', () => timelineController.scrollToTop(), 'Move a câmera para o topo (início) da timeline');
    commandRegistry.register('timeline:scroll:bottom', () => timelineController.scrollToBottom(), 'Move a câmera para o fim da timeline');
    commandRegistry.register('timeline:char:toggle', (args: { id: string }) => timelineController.toggleCharacterInForm(args.id), 'Altera o status de um personagem no evento aberto no formulário (presente/ausente)');
}