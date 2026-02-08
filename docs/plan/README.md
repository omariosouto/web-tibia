# Web-Tibia MMORPG - Plano de Desenvolvimento

Este documento descreve o plano completo para criar um MMORPG online inspirado no Tibia usando Node.js e React.

## Documentos do Plano

1. [Arquitetura](./01-architecture.md) - Estrutura de pastas e stack tecnológica
2. [Database Schema](./02-database-schema.md) - Schema do banco de dados com Drizzle ORM
3. [Sistema de Sprites e Renderização](./03-sprites-rendering.md) - Engine de renderização Canvas
4. [Sistema Multiplayer](./04-multiplayer.md) - Arquitetura Socket.io
5. [Issues e Roadmap](./05-issues-roadmap.md) - Etapas incrementais de desenvolvimento
6. [Testes](./06-testing.md) - Estrutura de testes
7. [Docker Setup](./07-docker-setup.md) - Configuração do ambiente local
8. [Monstros e Combate](./08-monsters-combat.md) - Sistema de monstros e combate

## Stack Tecnológica

| Categoria | Tecnologia |
|-----------|------------|
| Frontend | React, Vite, shadcn/ui, Zustand |
| Backend | Node.js, Express, Socket.io |
| Database | PostgreSQL, Drizzle ORM |
| Validação | Zod |
| Data Fetching | React Query |
| Testes | Vitest, Playwright |
| Monorepo | Turborepo, npm workspaces |
| Infra | Docker, Docker Compose |

## MVP Scope

O MVP deve permitir:
- Ver um mapa renderizado em Canvas
- Ver seu personagem no mapa
- Ver outros jogadores em tempo real
- Mover o personagem usando as setas do teclado
- Múltiplos jogadores ao acessar a URL
- Ver monstros no mapa
- Clicar em monstros para selecionar
- Atacar monstros (espaço ou clique)
- Monstros morrem e respawnam

## Workflow de Desenvolvimento

```
Issue no GitHub -> Branch -> Código + Testes -> PR -> Review -> Merge
```

## Quick Start (após implementação)

```bash
# Clone o repositório
git clone <repo-url>
cd web-tibia

# Instale dependências
npm install

# Inicie tudo (Docker + Server + Client)
npm run dev

# Acesse http://localhost:5173
```
