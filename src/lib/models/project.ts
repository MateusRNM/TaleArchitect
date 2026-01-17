export type UUID = string;

export const GREGORIAN_MONTHS: Month[] = [
    { name: 'Janeiro', days: 31 },
    { name: 'Fevereiro', days: 28 },
    { name: 'Março', days: 31 },
    { name: 'Abril', days: 30 },
    { name: 'Maio', days: 31 },
    { name: 'Junho', days: 30 },
    { name: 'Julho', days: 31 },
    { name: 'Agosto', days: 31 },
    { name: 'Setembro', days: 30 },
    { name: 'Outubro', days: 31 },
    { name: 'Novembro', days: 30 },
    { name: 'Dezembro', days: 31 }
];

export interface Time {
    day: number;
    month: number;
    year: number;
    hour?: number;
    minute?: number;
}

export interface Month {
    name: string;
    days: number;
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
    calendar: {
        months: Month[]
    };
    characters: Character[];
    locations: Location[];
    connections: Connection[];
    events: Event[];
}