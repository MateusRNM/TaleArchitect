# TaleArchitect Plugin API

Bem-vindo à documentação oficial de desenvolvimento de plugins para o **TaleArchitect**.

O sistema de plugins expõe um objeto global `app` que permite ler o estado do projeto, criar entidades (personagens, locais, eventos), interagir com a interface do usuário e registrar novos comandos.

## 🚀 Configuração do Ambiente

Para habilitar o Autocomplete (IntelliSense) no VS Code e verificação de tipos, siga estes passos:

### 1. Instale as Definições
Na pasta do seu plugin, execute:

```bash
npm install --save-dev talearchitect-api
```

### 2. Configure o Editor
Crie um arquivo jsconfig.json na raiz do seu plugin:
```bash
{
  "compilerOptions": {
    "checkJs": true
  },
  "include": [
    "node_modules/talearchitect-api/index.d.ts",
    "**/*.js"
  ]
}
```

Ou adicione essa referência no topo do seu arquivo main.js:
```bash
/// <reference types="talearchitect-api" />
```

## 📚 Referência da API Global (app)

### 1. ```app.commands```
Gerencia a execução e registro de ações na Paleta de Comandos ```(Ctrl+K)```.

```execute(id: string, args?: any): Promise<void>``` Executa um comando interno do TaleArchitect.

```bash
// Exemplo: Navegar para a aba de Mapa
await app.commands.execute('ui:navigate', { tabId: 'map' });
```

```register(id: string, handler: Function, options?: any): void``` Registra um novo comando criado pelo seu plugin.

```bash
app.commands.register('meu-plugin:ola', () => {
    app.ui.toast('Olá do Plugin!');
}, { description: 'Exibe uma mensagem de boas-vindas' });
```

### 2. ```app.data```
Fornece acesso de leitura aos dados do projeto. Nota: Retorna cópias (snapshots).

```getCharacters(): Promise<Character[]>```

```getLocations(): Promise<Location[]>```

```getConnections(): Promise<Connection[]>```

```getEvents(): Promise<Event[]>```

```getCalendar(): Promise<{ months: Month[] }>```

```getCurrentDate(): Promise<Time | null>```

```bash
const chars = await app.data.getCharacters();
console.log(`Total de personagens: ${chars.length}`);
```

### 3. ```app.factory```

Métodos para criar novas entidades.

- Gera IDs (UUID) automaticamente.

- Valida os dados.

- **Adiciona a ação ao histórico de Desfazer (Undo/Ctrl+Z).**

- ```createCharacter(name: string, description?: string): Promise<UUID>```

- ```createLocation(name: string, description?: string, x?: number, y?: number): Promise<UUID>```

- ```createEvent(name: string, date: Time, description?: string): Promise<UUID>```

```bash
const novoId = await app.factory.createCharacter("Gandalf", "O Cinzento");
```

### 4. ```app.ui```
Interação com o usuário.

- ```toast(msg: string, type?: 'success'|'error'|'info', duration?: number)``` Exibe notificação flutuante.

- ```alert(msg: string, title?: string)``` Exibe modal de alerta (bloqueante).

- ```confirm(msg: string, title?: string): Promise<boolean>``` Exibe modal de Sim/Não.

### 5. ```app.context```
Permite inspecionar o estado visual da aplicação.

- ```getActiveTab(): string``` Retorna a aba atual (ex: 'map', 'timeline').

- ```getStates(): FullUIState``` Retorna detalhes de zoom, seleção e scroll.

```bash
const estado = app.context.getStates();
if (estado.map.view.k > 2) {
    console.log("O usuário está com bastante zoom no mapa!");
}
```

### 6. ```app.events``` (Hooks)
Permite executar código quando algo acontece no sistema.

- ```on(event: string, callback: Function)```

```bash
app.events.on('character:added', (char) => {
    app.ui.toast(`Novo personagem criado: ${char.name}`);
});
```

## 🔔 Lista de Eventos

Esses são os eventos que você pode escutar através de `app.events.on()`:

| Categoria | Evento | Descrição | Dados Recebidos (`data`) |
| :--- | :--- | :--- | :--- |
| **Projeto** | `project:save` | Disparado após o projeto ser salvo. | `undefined` |
| **Cronologia** | `event:added` | Um novo evento foi criado na timeline. | Objeto `Event` |
| | `event:updated` | Um evento existente foi alterado. | Objeto `Event` |
| | `event:removed` | Um evento foi removido. | Objeto `Event` |
| **Conexões** | `connection:added` | Uma nova conexão foi criada no mapa. | Objeto `Connection` |
| | `connection:removed` | Uma conexão foi removida. | Objeto `Connection` |
| **Locais** | `location:added` | Um novo local foi criado no mapa. | Objeto `Location` |
| | `location:removed` | Um local foi removido. | Objeto `Location` |
| **Personagens** | `character:added` | Um novo personagem foi criado. | Objeto `Character` |
| | `character:updated` | Um personagem existente foi alterado. | Objeto `Character` |
| | `character:removed` | Um personagem foi removido. | Objeto `Character` |

Consulte o meu repositório com alguns plugins de template para ver mais: 