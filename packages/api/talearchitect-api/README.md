# TaleArchitect API Definitions

![NPM Version](https://img.shields.io/npm/v/talearchitect-api?style=flat-square)
![License](https://img.shields.io/npm/l/talearchitect-api?style=flat-square)

Este pacote contém as definições de tipo TypeScript (`.d.ts`) para o desenvolvimento de plugins para o **TaleArchitect**.

Ao instalar este pacote, seu editor de código (VS Code, etc.) fornecerá **Autocomplete (IntelliSense)**, documentação inline e verificação de tipos para a variável `app`.

> **Nota:** Este pacote contém apenas tipos. A lógica de execução é fornecida nativamente pelo aplicativo TaleArchitect.

## 📦 Instalação

Na pasta do seu plugin, execute:

```bash
npm install --save-dev talearchitect-api
```

## 🚀 Como Usar

Existem duas formas principais de habilitar o autocomplete no seu projeto:

**Opção 1:** Usando Diretiva de Referência (Mais Simples)
Adicione esta linha no topo do seu arquivo main.js:

```bash
///<reference types="talearchitect-api" />

app.ui.toast("Olá Mundo!");
```

**Opção 2:** Usando jsconfig.json (Recomendado)

Crie um arquivo jsconfig.json na raiz da pasta do seu plugin. Isso habilita o autocomplete em todos os arquivos do projeto sem precisar adicionar a linha de referência em cada um.

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

## 📚 Visão Geral da API

### Ponto de partida
Seu script deve conter uma função `init(app)`, que atuará como uma função "main" do seu plugin.

```bash
function init(app) {
  app.ui.toast("Hello, World!", "success");
}
```

<hr>

O objeto `app` passado em `init(app)` expõe as seguintes funcionalidades:

```app.commands```

Execute comandos nativos ou registre seus próprios comandos na Paleta (Ctrl+K).

```bash
app.commands.register('meu:comando', () => { ... });
```

```app.data```

Acesso aos dados do projeto (Personagens, Locais, Conexões, Eventos, Calendário).

```bash
const chars = await app.data.getCharacters();
```

```app.factory```

Criação segura de entidades (com suporte automático a Undo/Ctrl+Z).

```bash
const id = await app.factory.createCharacter("Novo Herói");
```

```app.ui```

Interação com o usuário (Toasts, Alertas, Confirmações).

```bash
app.ui.toast("Sucesso!", "success");
```

```app.events```

Escute eventos do ciclo de vida do aplicativo.

```bash
app.events.on('project:save', () => { ... });
```

```app.context```

Descubra o estado atual da interface (qual aba está ativa, nível de zoom, etc).

```bash
if (app.context.getActiveTab() === 'map') { ... }
```

```app.metadata```

Permite salvar e recuperar dados personalizados em entidades (locais, conexões, eventos ou personagens).
```bash
const id = await app.factory.createCharacter("Novo Herói");
app.metadata.set(id, {
  hp: 20,
  ataque: 4,
  velocidade: 10
});
```

https://github.com/MateusRNM/TaleArchitect - Repositório principal do aplicativo.