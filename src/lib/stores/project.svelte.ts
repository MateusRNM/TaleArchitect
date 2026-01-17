import type { ProjectData, Character, Event, Time } from '$lib/models/project';
import { writeTextFile, readTextFile, remove } from "@tauri-apps/plugin-fs";

export class ActiveProject {

    data = $state<ProjectData>({} as ProjectData);
    
    changesUnsaved = $state(false);

    constructor(initialData: ProjectData) {
        this.data = initialData;
    }

    addCharacter(name: string, description: string, image: string) {
        const newChar: Character = {
            id: crypto.randomUUID(),
            name,
            image,
            description: description,
            createdAt: new Date().toISOString()
        };
        this.data.characters.push(newChar);
        this.changesUnsaved = true;
    }

    updateCharacter(id: string, updates: Partial<Character>) {
        const index = this.data.characters.findIndex((v) => v.id === id);
        if(index !== -1) {
            this.data.characters[index] = { ...this.data.characters[index], ...updates };
            this.changesUnsaved = true;
        }
    }

    removeCharacter(id: string) {
        this.data.characters = this.data.characters.filter(c => c.id !== id);
        this.changesUnsaved = true;
    }

    addLocation(name: string, description: string, x: number, y: number) {
        this.data.locations.push({
            id: crypto.randomUUID(),
            name,
            description,
            coordinates: { x, y }
        });
        this.changesUnsaved = true;
    }

    connectLocations(name: string, description: string, fromId: string, toId: string) {
        const idx = this.data.connections.findIndex((v) => (v.fromLocationId === fromId && v.toLocationId === toId) || (v.fromLocationId === toId && v.toLocationId === fromId));
        if(idx === -1) {
            this.data.connections.push({
                id: crypto.randomUUID(),
                name,
                description,
                fromLocationId: fromId,
                toLocationId: toId
            });
            this.changesUnsaved = true;
        }
    }

    addEvent(name: string, description: string, locationId: string, date: Time, characterIds: string[] = []) {
        const newEvent: Event = {
            id: crypto.randomUUID(),
            name,
            description,
            locationId,
            date,
            characters: characterIds
        };
        
        this.data.events.push(newEvent);
        this.sortEvents();
        
        this.changesUnsaved = true;
    }

    private sortEvents() {
        this.data.events.sort((a, b) => {
            if (a.date.year !== b.date.year) return a.date.year - b.date.year;
            if (a.date.month !== b.date.month) return a.date.month - b.date.month;
            return a.date.day - b.date.day;
        });
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
            calendar: { monthDuration: 30, yearDuration: 12 },
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