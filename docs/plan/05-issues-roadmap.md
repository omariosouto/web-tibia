# Issues e Roadmap

Cada etapa vira uma issue no GitHub, seguindo o workflow:

```
Issue no GitHub -> Branch -> Código + Testes -> PR -> Review -> Merge
```

## Fase 1: Setup Inicial

### Issue #1: Setup do Monorepo com Turborepo

**Descrição:**
- Inicializar repositório Git
- Configurar package.json root com workspaces
- Criar turbo.json
- Configurar tsconfig.base.json
- Adicionar ESLint e Prettier

**Acceptance Criteria:**
- [ ] `npm install` funciona na raiz
- [ ] Estrutura de pastas criada

---

### Issue #2: Setup do Docker + PostgreSQL

**Descrição:**
- Criar docker-compose.yml com PostgreSQL
- Criar script `scripts/dev.sh`
- Configurar .env.example

**Acceptance Criteria:**
- [ ] `docker-compose up` sobe o banco
- [ ] Banco acessível em localhost:5432

---

### Issue #3: Setup do Package Server

**Descrição:**
- Inicializar packages/server com Express + Socket.io
- Configurar Drizzle ORM
- Criar schema inicial (players, maps)
- Configurar migrations
- Criar seed com mapa inicial

**Acceptance Criteria:**
- [ ] Servidor inicia e conecta ao banco
- [ ] Migrations rodam sem erro

---

### Issue #4: Setup do Package Client

**Descrição:**
- Inicializar packages/client com Vite + React
- Configurar shadcn/ui
- Configurar Vitest
- Criar estrutura de pastas

**Acceptance Criteria:**
- [ ] `npm run dev` abre app React
- [ ] shadcn/ui funcionando

---

### Issue #5: Setup do Package Shared

**Descrição:**
- Criar packages/shared
- Definir tipos básicos (Player, Map, Events)
- Definir Zod schemas
- Definir constantes (TILE_SIZE, etc)

**Acceptance Criteria:**
- [ ] Tipos importáveis em client e server
- [ ] Build do shared funciona

---

## Fase 2: Sistema de Sprites e Renderização

### Issue #6: Criar Sprites Placeholder

**Descrição:**
- Desenhar sprite tiles-terrain.png (16 tiles básicos)
- Desenhar sprite tiles-decoration.png
- Desenhar sprite character-base.png (4 direções, 3 frames)
- Documentar sprite index mapping

**Acceptance Criteria:**
- [ ] PNGs criados em assets/sprites/
- [ ] Documentação de cada sprite ID

---

### Issue #7: Implementar SpriteManager

**Descrição:**
- Criar classe SpriteManager
- Implementar carregamento assíncrono de spritesheets
- Implementar método drawSprite
- Testes unitários

**Acceptance Criteria:**
- [ ] Testes passam
- [ ] Sprites renderizam corretamente

---

### Issue #8: Implementar CanvasRenderer

**Descrição:**
- Criar componente GameCanvas com React
- Implementar CanvasRenderer
- Implementar viewport culling
- Testes unitários

**Acceptance Criteria:**
- [ ] Canvas renderiza tiles estáticos
- [ ] Performance OK (60 FPS)

---

### Issue #9: Implementar Camera System

**Descrição:**
- Criar classe Camera
- Implementar follow com lerp
- Implementar worldToScreen conversion
- Testes unitários

**Acceptance Criteria:**
- [ ] Câmera segue posição do jogador
- [ ] Movimento suave

---

### Issue #10: Implementar Game Loop

**Descrição:**
- Criar GameLoop com requestAnimationFrame
- Integrar com React lifecycle
- Implementar FPS counter (debug)

**Acceptance Criteria:**
- [ ] Game roda a 60 FPS estável
- [ ] Sem memory leaks

---

## Fase 3: Sistema de Mapa

### Issue #11: Definir Formato JSON de Mapa

**Descrição:**
- Criar interface MapData
- Criar mapa starter-town.json (20x20 tiles)
- Criar loader de mapa
- Testes de parsing

**Acceptance Criteria:**
- [ ] Mapa carrega do JSON
- [ ] Validação com Zod funciona

---

### Issue #12: Renderizar Mapa Completo

**Descrição:**
- Integrar MapData com CanvasRenderer
- Implementar renderização por camadas
- Otimizar rendering

**Acceptance Criteria:**
- [ ] Mapa renderiza no canvas
- [ ] Camadas funcionam corretamente

---

## Fase 4: Sistema Multiplayer

### Issue #13: Setup Socket.io Server

**Descrição:**
- Configurar Socket.io no servidor
- Implementar eventos de conexão/desconexão
- Implementar GameState class
- Testes de conexão

**Acceptance Criteria:**
- [ ] Clientes conectam e desconectam
- [ ] Logs aparecem no servidor

---

### Issue #14: Implementar Player Join

**Descrição:**
- Evento player:join com validação Zod
- Criar jogador no GameState
- Broadcast para outros jogadores
- Testes de integração

**Acceptance Criteria:**
- [ ] Jogador aparece para outros
- [ ] Spawn no ponto correto

---

### Issue #15: Implementar Player Movement

**Descrição:**
- Evento player:move com direção
- Collision detection no servidor
- Broadcast de posição
- Testes de movimento

**Acceptance Criteria:**
- [ ] Jogador move
- [ ] Outros veem o movimento
- [ ] Colisão funciona

---

### Issue #16: Implementar useSocket Hook

**Descrição:**
- Criar hook useSocket
- Gerenciar conexão Socket.io
- Integrar com game store (Zustand)
- Testes do hook

**Acceptance Criteria:**
- [ ] React integra com socket
- [ ] Estado sincronizado

---

### Issue #17: Renderizar Múltiplos Jogadores

**Descrição:**
- Renderizar todos jogadores do state
- Ordenar por Y para profundidade
- Mostrar nome dos jogadores

**Acceptance Criteria:**
- [ ] Vê outros jogadores em tempo real
- [ ] Nomes aparecem

---

## Fase 5: Monstros e Combate

### Issue #18: Criar Sprites de Monstros

**Descrição:**
- Desenhar monsters.png com 3 tipos de monstros
- Rat, Snake, Spider (4 direções cada)
- Documentar sprite IDs

**Acceptance Criteria:**
- [ ] PNG criado em assets/sprites/
- [ ] 3 tipos de monstros com 4 direções

---

### Issue #19: Implementar Classe Monster (Server)

**Descrição:**
- Criar classe Monster
- Implementar takeDamage, respawn
- Adicionar schema no banco
- Testes unitários

**Acceptance Criteria:**
- [ ] Testes passam
- [ ] Monstros persistem no estado

---

### Issue #20: Implementar Sistema de Combate

**Descrição:**
- Criar CombatSystem
- Validar range de ataque
- Calcular dano
- Implementar cooldown
- Testes de combate

**Acceptance Criteria:**
- [ ] Ataque funciona
- [ ] Dano é aplicado
- [ ] Monstro morre e respawna

---

### Issue #21: Implementar Click Handler (Client)

**Descrição:**
- Criar ClickHandler para canvas
- Detectar clique em monstro
- Selecionar monstro
- Feedback visual de seleção

**Acceptance Criteria:**
- [ ] Clique seleciona monstro
- [ ] Borda amarela no selecionado

---

### Issue #22: Renderizar Monstros no Mapa

**Descrição:**
- Adicionar monstros ao renderer
- Barra de vida
- Nome do monstro
- Ordenar por Y com players

**Acceptance Criteria:**
- [ ] Monstros aparecem no mapa
- [ ] Barra de vida funciona

---

### Issue #23: Eventos Socket de Combate

**Descrição:**
- Evento combat:attack
- Evento combat:damage
- Evento monster:died
- Evento monster:respawn
- Testes de integração

**Acceptance Criteria:**
- [ ] Combate funciona multiplayer
- [ ] Todos veem o dano

---

## Fase 6: Input e Controles

### Issue #24: Implementar Keyboard Handler

**Descrição:**
- Criar KeyboardHandler class
- Capturar arrow keys / WASD
- Tecla de ataque (espaço ou clique)
- Integrar com game loop

**Acceptance Criteria:**
- [ ] Setas movem personagem
- [ ] WASD funciona também
- [ ] Espaço ataca monstro selecionado

---

### Issue #25: Implementar HUD Básico

**Descrição:**
- Lista de jogadores online
- Nome do jogador atual
- HP do jogador
- Monstro selecionado + HP
- Posição atual (debug)

**Acceptance Criteria:**
- [ ] HUD mostra info
- [ ] Atualiza em tempo real
- [ ] Mostra target selecionado

---

## Fase 7: Polish e Testes

### Issue #26: Testes End-to-End

**Descrição:**
- Setup Playwright
- Teste: Jogador entra no jogo
- Teste: Jogador se move
- Teste: Vê outro jogador
- Teste: Ataca monstro

**Acceptance Criteria:**
- [ ] Testes E2E passam
- [ ] CI/CD configurado

---

### Issue #27: npm run dev unificado

**Descrição:**
- Script que sobe Docker
- Script que roda migrations
- Script que inicia server e client
- Concurrently para rodar tudo

**Acceptance Criteria:**
- [ ] `npm run dev` inicia tudo
- [ ] Hot reload funciona

---

### Issue #28: Documentação README

**Descrição:**
- Instruções de setup
- Arquitetura overview
- Como criar sprites
- Como editar mapas

**Acceptance Criteria:**
- [ ] Dev consegue rodar seguindo README
- [ ] Arquitetura documentada

---

## Resumo Visual

```
Fase 1 (Setup)        Fase 2 (Sprites)      Fase 3 (Mapa)
#1 Monorepo     ──►   #6 Sprites      ──►   #11 JSON Format
#2 Docker       ──►   #7 SpriteManager──►   #12 Render Map
#3 Server       ──►   #8 Canvas
#4 Client       ──►   #9 Camera
#5 Shared       ──►   #10 Game Loop

        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼

Fase 4 (Multiplayer)  Fase 5 (Monstros)     Fase 6 (Input)
#13 Socket Setup──►   #18 Monster Sprites──► #24 Keyboard
#14 Player Join ──►   #19 Monster Class ──► #25 HUD
#15 Movement    ──►   #20 Combat System
#16 useSocket   ──►   #21 Click Handler
#17 Render Players──► #22 Render Monsters
                      #23 Combat Events

        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼

                    Fase 7 (Polish)
                    #26 E2E Tests
                    #27 npm run dev
                    #28 Docs
```

## Prioridade MVP

Issues críticas para o MVP funcionar:
1. #1-5 (Setup básico)
2. #6-8 (Renderização)
3. #11-12 (Mapa)
4. #13-17 (Multiplayer)
5. #18-23 (Monstros e Combate)
6. #24 (Controles)
7. #27 (npm run dev)

Issues que podem ser feitas depois:
- #9 (Camera com lerp) - pode começar simples
- #10 (Game Loop otimizado) - pode começar simples
- #25 (HUD) - nice to have para MVP básico
- #26 (E2E) - importante mas não bloqueia MVP
- #28 (Docs) - pode ir crescendo
