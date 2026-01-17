export const appState = $state({
    view: 'launcher' as 'launcher' | 'workspace',
    activeTab: 'map' as string,
    
    goToWorkspace() {
        this.view = 'workspace';
    },
    goToLauncher() {
        this.view = 'launcher';
        this.activeTab = 'map';
    }
});