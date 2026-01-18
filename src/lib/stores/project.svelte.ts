import { type ProjectData, type Character, type Event, type Time, GREGORIAN_MONTHS, type Connection, type Location } from '$lib/models/project';
import { writeTextFile, readTextFile, remove } from "@tauri-apps/plugin-fs";
import { toastStore } from './toasts.svelte';
import { pluginBridge } from '$lib/services/pluginBridge';

export class ActiveProject {

    data = $state<ProjectData>({} as ProjectData);
    
    changesUnsaved = $state(false);

    constructor(initialData: ProjectData) {
        this.data = initialData;
    }

    addCharacter(name: string, description: string, image: string | null) {
        const newChar: Character = {
            id: crypto.randomUUID(),
            name,
            image,
            description: description,
            createdAt: new Date().toISOString()
        };
        this.data.characters.push(newChar);
        pluginBridge.emitInternal('character:added', structuredClone(newChar));
        this.changesUnsaved = true;
    }

    updateCharacter(id: string, updates: Partial<Character>) {
        const index = this.data.characters.findIndex((v) => v.id === id);
        if(index !== -1) {
            this.data.characters[index] = { ...this.data.characters[index], ...updates };
            pluginBridge.emitInternal('character:updated', structuredClone($state.snapshot(this.data.characters[index])));
            this.changesUnsaved = true;
        }
    }

    removeCharacter(id: string) {
        pluginBridge.emitInternal('character:removed', structuredClone($state.snapshot(this.data.characters.find(c => c.id === id))));
        this.data.characters = this.data.characters.filter(c => c.id !== id);
        this.data.events.forEach((event) => {
            const index = event.characters.findIndex((charId) => charId === id);
            if(index !== -1) {
                event.characters.splice(index, 1);
            }
        });
        this.changesUnsaved = true;
    }

    addLocation(name: string, description: string, x: number, y: number) {
        const newLocation: Location = {
            id: crypto.randomUUID(),
            name,
            description,
            coordinates: { x, y }
        };
        this.data.locations.push(newLocation);
        pluginBridge.emitInternal('location:added', structuredClone(newLocation));
        this.changesUnsaved = true;
    }

    removeLocation(locationId: string) {
        this.data.connections = this.data.connections.filter(
            c => c.fromLocationId !== locationId && c.toLocationId !== locationId
        );
        pluginBridge.emitInternal('location:removed', structuredClone($state.snapshot(this.data.locations.find(l => l.id === locationId))));
        this.data.locations = this.data.locations.filter(l => l.id !== locationId);
        this.changesUnsaved = true;
    }

    connectLocations(name: string, description: string, fromId: string, toId: string) {
        const idx = this.data.connections.findIndex((v) => (v.fromLocationId === fromId && v.toLocationId === toId) || (v.fromLocationId === toId && v.toLocationId === fromId));
        if(idx === -1) {
            const newConnection: Connection = {
                id: crypto.randomUUID(),
                name,
                description,
                fromLocationId: fromId,
                toLocationId: toId
            };
            this.data.connections.push(newConnection);
            pluginBridge.emitInternal('connection:added', structuredClone(newConnection));
            this.changesUnsaved = true;
        }
    }

    removeConnection(connectionId: string) {
        pluginBridge.emitInternal('connection:removed', structuredClone($state.snapshot(this.data.connections.find(c => c.id === connectionId))));
        this.data.connections = this.data.connections.filter(c => c.id !== connectionId);
        this.changesUnsaved = true;
    }

    addEvent(name: string, description: string, locationId: string, date: Time, characterIds: string[]) {
        const newEvent: Event = {
            id: crypto.randomUUID(),
            name,
            description,
            locationId,
            date,
            characters: characterIds
        };
        
        this.data.events.push(newEvent);

        pluginBridge.emitInternal('event:added', structuredClone(newEvent));
        
        this.changesUnsaved = true;
    }

    updateEvent(id: string, updates: Partial<Event>) {
        const index = this.data.events.findIndex((v) => v.id === id);
        if(index !== -1) {
            this.data.events[index] = { ...this.data.events[index], ...updates };
            pluginBridge.emitInternal('event:updated', structuredClone($state.snapshot(this.data.events[index])));
            this.changesUnsaved = true;
        }
    }
 
    removeEvent(id: string) {
        pluginBridge.emitInternal('event:removed', structuredClone($state.snapshot(this.data.events.find(v => v.id === id))));
        this.data.events = this.data.events.filter((v) => v.id !== id);
        this.changesUnsaved = true;
    }
}

export const projectStore = $state({
    current: null as ActiveProject | null,

    async create(name: string, projectdir: string) {
        const newProject: ProjectData = {
            id: crypto.randomUUID(),
            name,
            projectdir,
            createdAt: new Date().toISOString(),
            lastOpenedAt: new Date().toISOString(),
            autosave: false,
            calendar:{
                months: JSON.parse(JSON.stringify(GREGORIAN_MONTHS))
            },
            characters: [],
            locations: [],
            connections: [],
            events: []
        };
        this.current = new ActiveProject(newProject);
        await this.save();
    },
    
    async load(projectdir: string) {
        const data = await this.read(projectdir);
        this.current = new ActiveProject(data);
        this.current.data.lastOpenedAt = new Date().toISOString();
        this.current.data.projectdir = projectdir;
    },

    async deleteProject() {
        if(!this.current) return;
        try {
            await remove(this.current.data.projectdir);
            this.current = null;
        } catch(error) {
            throw error;
        }
    },

    async save() {
        if (!this.current) return;
        try {
            const dataToSave = JSON.stringify(this.current.data, null, 2);
            const filePath = this.current.data.projectdir;
            await writeTextFile(filePath, dataToSave);
            this.current.changesUnsaved = false;
            if(!this.current.data.autosave) toastStore.add('Projeto salvo com sucesso', 'success', 2000);
            pluginBridge.emitInternal('project:save');
        } catch (error) {
            throw error;
        }
    },

    async read(projectdir: string) {
        try {
            const data: string = await readTextFile(projectdir);
            return JSON.parse(data);
        } catch (error) {
            throw error;
        }
    },
    
    close() {
        this.current = null;
    }
});