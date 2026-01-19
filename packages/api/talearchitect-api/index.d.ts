export type UUID = string;

export interface Month {
    name: string;
    days: number;
}

export interface Time {
    day: number;
    month: number;
    year: number;
    hour?: number;
    minute?: number;
}

export interface Coordinates {
    x: number;
    y: number;
}

export interface Character {
    id: UUID;
    name: string;
    image: string | null;
    description: string;
    createdAt: string;
}

export interface Location {
    id: UUID;
    name: string;
    description: string;
    coordinates: Coordinates;
}

export interface Connection {
    id: UUID;
    name: string;
    description: string;
    fromLocationId: UUID;
    toLocationId: UUID;
}

export interface Event {
    id: UUID;
    name: string;
    description: string;
    locationId: UUID;
    date: Time;
    characters: UUID[];
}

export interface MapView {
    x: number;
    y: number;
    k: number;
}

export interface MapStateSnapshot {
    view: MapView;
    selectedLocationId: string | null;
    selectedConnectionId: string | null;
}

export interface TimelineStateSnapshot {
    view: 'list' | 'swimlane' | 'form';
    selectedEventId: string | null;
    scrollY: number;
}

export interface FullUIState {
    map: MapStateSnapshot;
    timeline: TimelineStateSnapshot;
}

export type ToastType = 'success' | 'error' | 'info';

export interface AppAPI {

    readonly apiVersion: string;
    readonly pluginInfo: { id: string };

    commands: {
        execute(id: string, args?: any): Promise<void>;
        register(id: string, handler: (args: any) => void, options?: any): void;
    };

    data: {
        getCharacters(): Promise<Character[]>;
        getLocations(): Promise<Location[]>;
        getConnections(): Promise<Connection[]>;
        getEvents(): Promise<Event[]>;
        getCalendar(): Promise<{ months: Month[] }>;
        getCurrentDate(): Promise<Time | null>;
        updateCharacter(id: string, changes: Partial<Character>): Promise<void>;
        updateLocation(id: string, changes: Partial<Location>): Promise<void>;
        updateEvent(id: string, changes: Partial<Event>): Promise<void>;
        updateConnection(id: string, changes: Partial<Character>): Promise<void>;
        updateCalendar(months: Month[]): Promise<void>;
        removeCharacter(id: string): Promise<void>;
        removeLocation(id: string): Promise<void>;
        removeEvent(id: string): Promise<void>;
        removeConnection(id: string): Promise<void>;
    };

    factory: {
        createCharacter(name: string, description?: string): Promise<UUID | null>;
        createEvent(name: string, date: Time, description?: string): Promise<UUID | null>;
        createLocation(name: string, description?: string, x?: number, y?: number): Promise<UUID | null>;
    };

    ui: {
        toast(msg: string, type?: ToastType, duration?: number): void;
        alert(msg: string, title?: string): Promise<void>;
        confirm(msg: string, title?: string): Promise<boolean>;
    };

    events: {
        on(event: string, callback: (data: any) => void): void;
    };

    context: {
        getActiveTab(): string;
        getStates(): FullUIState;
    };

    metadata: {
        get(entityId: string): Promise<any>,
        set(entityId: string, data: any): Promise<void>
    };
}

export {};