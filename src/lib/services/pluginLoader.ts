import { pluginBridge } from './pluginBridge.svelte';
import { BaseDirectory, readDir, readTextFile, mkdir } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { openPath } from '@tauri-apps/plugin-opener';

interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description?: string;
    main: string;
}

export class PluginLoader {
    
    loadedPlugins = new Map<string, PluginManifest>();

    async init() {
        try {

            pluginBridge.reset();
            this.loadedPlugins.clear();

            await mkdir('plugins', { 
                baseDir: BaseDirectory.AppData, 
                recursive: true 
            });

            const entries = await readDir('plugins', { baseDir: BaseDirectory.AppData });

            for (const entry of entries) {
                if (entry.isDirectory) {
                    await this.loadPluginFromFolder(entry.name);
                }
            }

        } catch (error) {
            pluginBridge.api.ui.toast('Falha ao acessar pasta de plugins', 'error');
        }
    }

    private async loadPluginFromFolder(folderName: string) {
        try {
            const manifestPath = `plugins/${folderName}/manifest.json`;
            const manifestContent = await readTextFile(manifestPath, { baseDir: BaseDirectory.AppData });
            const manifest: PluginManifest = JSON.parse(manifestContent);

            const scriptPath = `plugins/${folderName}/${manifest.main}`;
            const scriptContent = await readTextFile(scriptPath, { baseDir: BaseDirectory.AppData });

            this.executeScript(scriptContent, manifest);

        } catch (error) {
            pluginBridge.api.ui.toast(`Erro ao carregar plugin: ${folderName}`, 'error');
        }
    }

    private async executeScript(code: string, manifest: PluginManifest) {
        try {
            const context = pluginBridge.createPluginContext(manifest.id);
            const wrappedCode = `
            ${code}
            ;
            if (typeof init === 'function') {
                return init;
            } else {
                return undefined;
            }
            `;

            const factory = new Function(wrappedCode);
            const initFunction = factory();
            if(initFunction) {
                await initFunction(context);
                this.loadedPlugins.set(manifest.id, manifest);
            } else {
                pluginBridge.api.ui.toast(`Plugin ${manifest.name} inválido: função init não encontrada.`, 'error', 5000);
            }
            
        } catch (error) {
            pluginBridge.api.ui.toast(`Crash no plugin ${manifest.name}`, 'error', 4000);
        }
    }

    async openPluginsFolder() {
        try {
            const appDataPath = await appDataDir();
            const pluginsPath = await join(appDataPath, 'plugins');
            await openPath(pluginsPath);
        } catch (error) {
            throw error;
        }
    }
}

export const pluginLoader = new PluginLoader();