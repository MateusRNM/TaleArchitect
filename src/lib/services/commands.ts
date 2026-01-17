type CommandHandler = (args?: any) => Promise<any> | any;

interface Command {
    id: string;
    handler: CommandHandler;
    description?: string;
}

class CommandManager {

    private commands = new Map<string, Command>();

    register(id: string, handler: CommandHandler, description?: string) {
        if (this.commands.has(id)) {
            console.warn(`Comando "${id}" foi sobrescrito.`);
        }
        this.commands.set(id, { id, handler, description });
    }

    unregister(id: string) {
        this.commands.delete(id);
    }

    async execute(id: string, args?: any) {
        const command = this.commands.get(id);
        
        if (!command) {
            console.error(`Comando "${id}" não encontrado.`);
            return;
        }

        try {
            console.log(`[Command] Executando: ${id}`, args || '');
            await command.handler(args);
        } catch (error) {
            console.error(`Erro ao executar comando "${id}":`, error);
        }
    }

    getAll() {
        return Array.from(this.commands.values());
    }
}

export const commandRegistry = new CommandManager();