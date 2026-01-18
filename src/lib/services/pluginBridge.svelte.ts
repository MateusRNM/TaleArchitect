import { projectStore } from '$lib/stores/project.svelte';
import { commandRegistry } from '$lib/services/commands';
import { toastStore } from '$lib/stores/toasts.svelte';
import { historyStore } from '$lib/stores/history.svelte';
import { ask, message } from '@tauri-apps/plugin-dialog';
import type { Character, Event, Location, Time } from '$lib/models/project';
import { timelineController } from '$lib/controllers/timelineController.svelte';
import { appState } from '$lib/stores/app.svelte';
import { mapState } from '$lib/controllers/mapController.svelte';

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

            getConnections() {
                if (!projectStore.current) return [];
                return structuredClone($state.snapshot(projectStore.current.data.connections));
            },

            getEvents: async (): Promise<Event[]> => {
                if (!projectStore.current) return [];
                return structuredClone($state.snapshot(projectStore.current.data.events));
            },

            getCalendar: async () => {
                if (!projectStore.current) return null;
                return structuredClone($state.snapshot(projectStore.current.data.calendar));
            },

            getCurrentDate: async () => {
                if (!projectStore.current) return null;
                return structuredClone($state.snapshot(timelineController.currentDate));
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
            },

            createLocation: async (name: string, description: string = '', x = 0, y = 0): Promise<string | null> => {
                if (!projectStore.current) return null;

                historyStore.capture(); 

                const id = crypto.randomUUID();
                const newLocation: Location = {
                    id,
                    name,
                    description,
                    coordinates: { x, y }
                };

                projectStore.current.data.locations.push(newLocation);
                projectStore.current.changesUnsaved = true;

                this.emitInternal('location:added', newLocation);

                return id;
            }
        },

        ui: {
            toast: (msg: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) => {
                toastStore.add(msg, type, duration);
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
        },

        context: {
            getActiveTab: () => {
                return $state.snapshot(appState.activeTab);
            },

            getStates: () => {
                return {
                    map: {
                        view: structuredClone($state.snapshot(mapState.view)), 
                        selectedLocationId: $state.snapshot(mapState.selectedLocationId),
                        selectedConnectionId: $state.snapshot(mapState.selectedConnectionId)
                    },
                    timeline: {
                        selectedEventId: $state.snapshot(timelineController.selectedEventId),
                        scrollY: $state.snapshot(timelineController.scrollY),
                        view: $state.snapshot(timelineController.view)
                    }
                };
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

    public reset() {
        this.listeners.clear();
    }
}

export const pluginBridge = new PluginBridge();