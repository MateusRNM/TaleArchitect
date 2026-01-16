export const appState = $state({
    view: 'launcher' as 'launcher' | 'workspace',
    activeTab: 'map' as 'map' | 'timeline' | 'characters' | 'settings',
    
    goToWorkspace() {
        this.view = 'workspace';
    },
    goToLauncher() {
        this.view = 'launcher';
        this.activeTab = 'map';
    }
});