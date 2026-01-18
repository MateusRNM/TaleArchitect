import { projectStore } from '$lib/stores/project.svelte';
import { commandRegistry } from '$lib/services/commands';
import { toastStore } from '$lib/stores/toasts.svelte';
import { historyStore } from '$lib/stores/history.svelte';
import { ask, message } from '@tauri-apps/plugin-dialog';
import type { Character, Event, Location, Time } from '$lib/models/project';

type EventCallback = (data: any) => void;

export class PluginBridge {
    private listeners: Map<string, EventCallback[]> = new Map();

    public api = {
        version: '1.0.0',
        commands: {
            execute: async (id: string, args?: any) => {
                await commandRegistry.execute(id, args);
            },
            
            register: (id: string, handler: (args: any) => void, options?: any) => {
                commandRegistry.register(id, handler, options);
            }
        },

        data: {
            getCharacters: async (): Promise<Character[]> => {
                if (!projectStore.current) return [];
                return structuredClone($state.snapshot(projectStore.current.data.characters));
            },

            getLocations: async (): Promise<Location[]> => {
                if (!projectStore.current) return [];
                return structuredClone($state.snapshot(projectStore.current.data.locations));
            },

            getEvents: async (): Promise<Event[]> => {
                if (!projectStore.current) return [];
                return structuredClone($state.snapshot(projectStore.current.data.events));
            },

            getCalendar: async () => {
                if (!projectStore.current) return null;
                return structuredClone($state.snapshot(projectStore.current.data.calendar));
            }
        },

        factory: {
            createCharacter: async (name: string, description: string = ''): Promise<string | null> => {
                if (!projectStore.current) return null;

                historyStore.capture();

                const id = crypto.randomUUID();
                const newChar: Character = {
                    id,
                    name,
                    description,
                    image: null,
                    createdAt: new Date().toISOString()
                };

                projectStore.current.data.characters.push(newChar);
                projectStore.current.changesUnsaved = true;

                this.emitInternal('character:added', newChar);
                
                return id;
            },

            createEvent: async (name: string, date: Time, description: string = ''): Promise<string | null> => {
                if (!projectStore.current) return null;

                historyStore.capture();

                const id = crypto.randomUUID();
                const newEvent: Event = {
                    id,
                    name,
                    description,
                    date,
                    locationId: '', 
                    characters: []
                };

                projectStore.current.data.events.push(newEvent);
                projectStore.current.changesUnsaved = true;

                this.emitInternal('event:added', newEvent);

                return id;
            }
        },

        ui: {
            toast: (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
                toastStore.add(msg, type);
            },

            alert: async (msg: string, title: string = 'Plugin Alert') => {
                await message(msg, { title });
            },

            confirm: async (msg: string, title: string = 'Plugin Confirmation'): Promise<boolean> => {
                return await ask(msg, { title, kind: 'warning' });
            },
        },

        events: {
            on: (event: string, callback: EventCallback) => {
                if (!this.listeners.has(event)) {
                    this.listeners.set(event, []);
                }
                this.listeners.get(event)?.push(callback);
            }
        }
    };
    
    public emitInternal(event: string, data?: any) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => {
                try {
                    cb(data);
                } catch (e) {
                    throw e;
                }
            });
        }
    }
}

export const pluginBridge = new PluginBridge();