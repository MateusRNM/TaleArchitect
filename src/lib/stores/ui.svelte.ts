import type { Component } from 'svelte';
import { Map, Calendar, Users, Settings } from 'lucide-svelte';
import SectionMap from '$lib/screens/sections/SectionMap.svelte';
import SectionTimeline from '$lib/screens/sections/SectionTimeline.svelte';
import SectionCharacters from '$lib/screens/sections/SectionCharacters.svelte';
import SectionSettings from '$lib/screens/sections/SectionSettings.svelte';

export interface Tab {
    id: string;
    label: string;
    icon: any;
    component: Component;
    order: number;
}

export interface TabDefinition {
    id: string;
    label: string;
    icon: any;
    component: Component;
}

class UIManager {
    tabs = $state<Tab[]>([
        { id: 'map', label: 'Mapa', icon: Map, component: SectionMap, order: 1 },
        { id: 'timeline', label: 'Timeline', icon: Calendar, component: SectionTimeline, order: 2 },
        { id: 'characters', label: 'Personagens', icon: Users, component: SectionCharacters, order: 3 },
        { id: 'settings', label: 'Configurações', icon: Settings, component: SectionSettings, order: 200 },
    ]);

    registerTab(tab: TabDefinition) {
        this.tabs.push({
            id: tab.id,
            label: tab.label,
            icon: tab.icon,
            component: tab.component,
            order: this.tabs[this.tabs.length-2].order + 1
        });
        this.tabs.sort((a, b) => a.order - b.order);
    }

    get sortedTabs() {
        return this.tabs.toSorted((a, b) => a.order - b.order);
    }
}

export const uiManager = new UIManager();