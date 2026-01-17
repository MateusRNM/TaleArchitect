export type UUID = string;

export interface Time {
    day: number;
    month: number;
    year: number;
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
    coordinates: { x: number, y: number };
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

export interface ProjectData {
    id: UUID;
    name: string;
    projectdir: string;
    createdAt: string;
    lastOpenedAt: string;
    autosave: boolean;
    calendar: { monthDuration: number, yearDuration: number };
    characters: Character[];
    locations: Location[];
    connections: Connection[];
    events: Event[];
}