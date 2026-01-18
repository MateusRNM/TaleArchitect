import { projectStore } from '$lib/stores/project.svelte';
import { commandRegistry, type PaletteItem } from '$lib/services/commands';
import { open, ask } from '@tauri-apps/plugin-dialog';
import type { Event } from '$lib/models/project';
import { timelineController } from './timelineController.svelte';
import { User } from 'lucide-svelte';

export const charState = $state({
    view: 'list' as 'list' | 'form',
    selectedId: null as string | null,
    formData: {
        name: '',
        description: '',
        image: null as string | null
    },
    searchQuery: '',
    sortBy: 'date' as 'date' | 'name'
});

function openCreateCommand() {
    resetForm();
    charState.view = 'form';
    commandRegistry.execute('ui:navigate', { tabId: 'characters' });
}

function openEditCommand(args: { id: string }) {
    const char = projectStore.current?.data.characters.find(c => c.id === args.id);
    if (!char) return;

    charState.selectedId = char.id;
    charState.formData = {
        name: char.name,
        description: char.description,
        image: char.image || null
    };
    charState.view = 'form';
    commandRegistry.execute('ui:navigate', { tabId: 'characters' });
}

function closeFormCommand() {
    charState.view = 'list';
    resetForm();
}

async function saveCharacterCommand() {
    if (!charState.formData.name) return;

    if (charState.selectedId) {
        projectStore.current?.updateCharacter(charState.selectedId, {
            name: charState.formData.name,
            description: charState.formData.description,
            image: charState.formData.image
        });
    } else {
        projectStore.current?.addCharacter(
            charState.formData.name,
            charState.formData.description,
            charState.formData.image
        );
    }
    
    charState.view = 'list';
    resetForm();
}

async function deleteCharacterCommand(args: { id: string }) {
    const confirmed = await ask('Tem certeza que deseja deletar esse personagem? Ele também será removido de todos os eventos que ele participa.', {
        title: 'Confirmação', kind: 'warning'
    });

    if (confirmed) {
        projectStore.current?.removeCharacter(args.id);
        if (charState.selectedId === args.id) {
            closeFormCommand();
        }
    }
}

async function pickImageCommand() {
    const file = await open({
        multiple: false,
        filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
    });
    
    if (file && typeof file === 'string') {
        charState.formData.image = file;
    }
}

function removeImageCommand() {
    charState.formData.image = null;
}

function resetForm() {
    charState.selectedId = null;
    charState.formData = { name: '', description: '', image: null };
}

function getAllEvents(args: { charId: string }): Event[] {
    if(!projectStore.current || !args || !args.charId) return [];
    return timelineController.sortedEvents.filter((event) => event.characters.includes(args.charId));
}

export function registerCharacterCommands() {
    commandRegistry.register('char:create', openCreateCommand, 'Abrir formulário de novo personagem');

    commandRegistry.register('char:edit', openEditCommand, {
        description: 'Editar personagem existente',
        argsProvider: () => {
            return projectStore.current?.data.characters.map(character => ({
                label: character.name,
                description: character.description,
                icon: User,
                value: { id: character.id }
            })) as PaletteItem[];
        }
    });

    commandRegistry.register('char:save', saveCharacterCommand, {
        description: 'Salvar formulário atual',
        addToHistory: true
    });

    commandRegistry.register('char:delete', deleteCharacterCommand, {
        description: 'Deletar personagem',
        addToHistory: true,
        argsProvider: () => {
            return projectStore.current?.data.characters.map(character => ({
                label: character.name,
                description: character.description,
                icon: User,
                value: { id: character.id }
            })) as PaletteItem[];
        }
    });

    commandRegistry.register('char:cancel', closeFormCommand, 'Cancelar edição/criação');
    commandRegistry.register('char:image:pick', pickImageCommand, 'Selecionar imagem do disco');

    commandRegistry.register('char:image:remove', removeImageCommand, {
        description: 'Remover imagem do formulário',
        addToHistory: true
    });
    
    commandRegistry.register('char:events', getAllEvents, 'Retorna todos os eventos que um personagem participou em ordem cronológica crescente.');
}