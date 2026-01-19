import { projectStore } from '$lib/stores/project.svelte';
import { commandRegistry } from '$lib/services/commands';
import { toastStore } from '$lib/stores/toasts.svelte';
import { historyStore } from '$lib/stores/history.svelte';
import { ask, message } from '@tauri-apps/plugin-dialog';
import type { Character, Event, Location, Month, Time } from '$lib/models/project';
import { timelineController } from '$lib/controllers/timelineController.svelte';
import { appState } from '$lib/stores/app.svelte';
import { mapState } from '$lib/controllers/mapController.svelte';

type EventCallback = (data: any) => void;

export class PluginBridge {
    private listeners: Map<string, EventCallback[]> = new Map();

    private findEntity(id: string): { entity: any, type: 'character' | 'location' | 'event' | 'connection' } | null {
        if (!projectStore.current) return null;
        
        const char = projectStore.current.data.characters.find(c => c.id === id);
        if (char) return { entity: char, type: 'character' };

        const loc = projectStore.current.data.locations.find(l => l.id === id);
        if (loc) return { entity: loc, type: 'location' };

        const evt = projectStore.current.data.events.find(e => e.id === id);
        if (evt) return { entity: evt, type: 'event' };

        const conn = projectStore.current.data.connections.find(e => e.id === id);
        if(conn) return { entity: conn, type: 'connection' };

        return null;
    }

    public createPluginContext(pluginId: string) {
        return {
            apiVersion: '1.1.0',
            pluginInfo: { id: pluginId },
            ui: this.api.ui,
            commands: this.api.commands,
            context: this.api.context,
            data: this.api.data,
            factory: this.api.factory,
            events: this.api.events,
            metadata: {
                get: async (entityId: string) => {
                    const result = this.findEntity(entityId);
                    if (!result) return null;
                    return structuredClone(result.entity.metadata?.[pluginId] || {});
                },
                set: async (entityId: string, data: any) => {
                    if (!projectStore.current) return;

                    const result = this.findEntity(entityId);
                    if (!result) throw new Error(`Entidade ${entityId} não encontrada.`);

                    historyStore.capture(); 

                    if (!result.entity.metadata) result.entity.metadata = {};

                    result.entity.metadata[pluginId] = data;
                    
                    projectStore.current.changesUnsaved = true;
                }
            },
        };
    }

    public api = {
        apiVersion: '1.1.0',
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
            },

            updateCharacter: async (id: string, changes: Partial<Character>): Promise<void> => {
                if(projectStore.current) {
                    projectStore.current.updateCharacter(id, changes);
                }
            },

            updateLocation: async (id: string, changes: Partial<Location>): Promise<void> => {
                if(projectStore.current) {
                    const index = projectStore.current.data.locations.findIndex(v => v.id === id);
                    projectStore.current.data.locations[index] = { ...changes, ...projectStore.current.data.locations[index] };
                    this.emitInternal('location:updated', projectStore.current.data.locations[index]);
                }
            },

            updateEvent: async (id: string, changes: Partial<Event>): Promise<void> => {
                if(projectStore.current) {
                    projectStore.current.updateEvent(id, changes);
                }
            },

            updateConnection: async (id: string, changes: Partial<Character>): Promise<void> => {
                if(projectStore.current) {
                    const index = projectStore.current.data.connections.findIndex(v => v.id === id);
                    projectStore.current.data.connections[index] = { ...changes, ...projectStore.current.data.connections[index] };
                    this.emitInternal('connection:updated', projectStore.current.data.connections[index]);
                }
            },

            updateCalendar: async (months: Month[]): Promise<void> => {
                if(projectStore.current) {
                    projectStore.current.data.calendar.months = months;
                }
            },

            removeCharacter: async (id: string): Promise<void> => {
                if(projectStore.current) {
                    projectStore.current.removeCharacter(id);
                }   
            },

            removeLocation: async (id: string): Promise<void> => {
                if(projectStore.current) {
                    projectStore.current.removeLocation(id);
                }   
            },

            removeEvent: async (id: string): Promise<void> => {
                if(projectStore.current) {
                    projectStore.current.removeEvent(id);
                }   
            },

            removeConnection: async (id: string): Promise<void> => {
                if(projectStore.current) {
                    projectStore.current.removeConnection(id);
                }   
            },
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