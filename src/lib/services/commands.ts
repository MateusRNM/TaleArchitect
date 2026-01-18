import { historyStore } from "$lib/stores/history.svelte";

type CommandHandler = (args?: any) => Promise<any> | any;

export interface PaletteItem {
    label: string;
    description?: string;
    value: any;
    icon?: any;
}

export interface CommandOptions {
    description?: string;
    addToHistory?: boolean;
    argsProvider?: () => PaletteItem[];
}

interface Command {
    handler: CommandHandler;
    options: CommandOptions;
}

class CommandManager {

    public commands = new Map<string, Command>();

    register(id: string, handler: CommandHandler, descriptionOrOptions?: string | CommandOptions) {
        let options: CommandOptions = {};
        if(typeof descriptionOrOptions === 'string') {
            options = { description: descriptionOrOptions };
        } else if(descriptionOrOptions) {
            options = descriptionOrOptions;
        }
        this.commands.set(id, { handler, options });
    }

    unregister(id: string) {
        this.commands.delete(id);
    }

    async execute(id: string, args?: any) {
        const command = this.commands.get(id);
        
        if (!command) {
            return;
        }

        if (command.options.addToHistory) {
            historyStore.capture();
        }

        try {
            await command.handler(args);
        } catch (error) {
            throw error;
        }
    }

    getAll() {
        return Array.from(this.commands.values());
    }
}

export const commandRegistry = new CommandManager();