<script lang="ts">
    import { appState } from '$lib/stores/app.svelte';
    import Launcher from '$lib/screens/Launcher.svelte';
    import Workspace from '$lib/screens/Workspace.svelte';
</script>

{#if appState.view === 'launcher'}
    <Launcher />
{:else}
    <Workspace />
{/if}