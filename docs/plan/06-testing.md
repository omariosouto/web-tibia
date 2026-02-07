# Estrutura de Testes

## Overview

- **Unit Tests**: Vitest para server e client
- **Integration Tests**: Vitest + supertest para APIs/Socket
- **E2E Tests**: Playwright para fluxos completos

## Estrutura de Pastas

### Server

```
packages/server/__tests__/
├── unit/
│   ├── game/
│   │   ├── GameState.test.ts
│   │   ├── Player.test.ts
│   │   ├── Monster.test.ts
│   │   └── World.test.ts
│   ├── services/
│   │   └── playerService.test.ts
│   └── utils/
│       └── collision.test.ts
├── integration/
│   ├── events/
│   │   ├── connection.test.ts
│   │   ├── movement.test.ts
│   │   ├── combat.test.ts
│   │   └── join.test.ts
│   └── db/
│       └── playerRepository.test.ts
└── setup.ts
```

### Client

```
packages/client/__tests__/
├── unit/
│   ├── engine/
│   │   ├── SpriteManager.test.ts
│   │   ├── CanvasRenderer.test.ts
│   │   ├── Camera.test.ts
│   │   └── GameLoop.test.ts
│   ├── hooks/
│   │   ├── useSocket.test.ts
│   │   └── useKeyboard.test.ts
│   └── stores/
│       └── gameStore.test.ts
├── integration/
│   └── components/
│       └── GameCanvas.test.tsx
└── e2e/
    └── game.spec.ts
```

## Configuração Vitest

### Server

```typescript
// packages/server/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['node_modules', '__tests__', 'dist'],
    },
  },
});
```

### Client

```typescript
// packages/client/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['node_modules', '__tests__', 'dist'],
    },
  },
});
```

## Exemplos de Testes

### GameState (Unit)

```typescript
// packages/server/__tests__/unit/game/GameState.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../../../src/game/GameState';
import { createMockMapData } from '../../mocks/mapData';

describe('GameState', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState(createMockMapData());
  });

  describe('addPlayer', () => {
    it('should add player at spawn point', () => {
      const player = gameState.addPlayer('socket-1', 'TestPlayer');

      expect(player.name).toBe('TestPlayer');
      expect(player.x).toBe(50 * 32); // spawn x * tile size
      expect(player.y).toBe(50 * 32);
    });

    it('should generate unique player id', () => {
      const player1 = gameState.addPlayer('socket-1', 'Player1');
      const player2 = gameState.addPlayer('socket-2', 'Player2');

      expect(player1.id).not.toBe(player2.id);
    });
  });

  describe('movePlayer', () => {
    it('should move player to valid position', () => {
      const player = gameState.addPlayer('socket-1', 'TestPlayer');
      const initialX = player.x;

      const result = gameState.movePlayer('socket-1', 'east');

      expect(result.success).toBe(true);
      expect(result.player?.x).toBe(initialX + 32);
    });

    it('should not move player to non-walkable tile', () => {
      const player = gameState.addPlayer('socket-1', 'TestPlayer');
      // Position player near a wall
      player.x = 32;
      player.y = 32;

      // Assuming north is blocked
      const result = gameState.movePlayer('socket-1', 'north');

      expect(result.success).toBe(false);
    });

    it('should update direction even when blocked', () => {
      const player = gameState.addPlayer('socket-1', 'TestPlayer');
      player.direction = 'south';

      gameState.movePlayer('socket-1', 'north');

      expect(player.direction).toBe('north');
    });
  });

  describe('removePlayer', () => {
    it('should remove player by socket id', () => {
      gameState.addPlayer('socket-1', 'TestPlayer');

      const removed = gameState.removePlayer('socket-1');

      expect(removed?.name).toBe('TestPlayer');
      expect(gameState.getAllPlayers()).toHaveLength(0);
    });
  });
});
```

### Monster (Unit)

```typescript
// packages/server/__tests__/unit/game/Monster.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Monster } from '../../../src/game/Monster';

describe('Monster', () => {
  let monster: Monster;

  beforeEach(() => {
    monster = new Monster({
      id: 'monster-1',
      type: 'rat',
      x: 100,
      y: 100,
      health: 50,
      maxHealth: 50,
      damage: 5,
    });
  });

  describe('takeDamage', () => {
    it('should reduce health', () => {
      monster.takeDamage(10);

      expect(monster.health).toBe(40);
    });

    it('should not go below 0', () => {
      monster.takeDamage(100);

      expect(monster.health).toBe(0);
    });

    it('should return true when killed', () => {
      const killed = monster.takeDamage(50);

      expect(killed).toBe(true);
    });
  });

  describe('isAlive', () => {
    it('should return true when health > 0', () => {
      expect(monster.isAlive()).toBe(true);
    });

    it('should return false when health is 0', () => {
      monster.takeDamage(50);

      expect(monster.isAlive()).toBe(false);
    });
  });
});
```

### Socket Integration

```typescript
// packages/server/__tests__/integration/events/combat.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioc, Socket } from 'socket.io-client';
import { setupSocketEvents } from '../../../src/events';
import { GameState } from '../../../src/game/GameState';
import { createMockMapData } from '../../mocks/mapData';

describe('Combat Events', () => {
  let io: Server;
  let httpServer: ReturnType<typeof createServer>;
  let clientSocket: Socket;
  let gameState: GameState;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    gameState = new GameState(createMockMapData());
    setupSocketEvents(io, gameState);

    httpServer.listen(() => {
      const port = (httpServer.address() as any).port;
      clientSocket = ioc(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  it('should attack monster and deal damage', (done) => {
    clientSocket.emit('player:join', { name: 'Warrior' });

    clientSocket.on('game:init', () => {
      clientSocket.emit('combat:attack', { targetId: 'monster-1' });
    });

    clientSocket.on('combat:damage', (data) => {
      expect(data.targetId).toBe('monster-1');
      expect(data.damage).toBeGreaterThan(0);
      done();
    });
  });

  it('should notify when monster dies', (done) => {
    clientSocket.on('monster:died', (data) => {
      expect(data.monsterId).toBe('monster-1');
      done();
    });

    // Trigger enough attacks to kill monster
    for (let i = 0; i < 10; i++) {
      clientSocket.emit('combat:attack', { targetId: 'monster-1' });
    }
  });
});
```

### SpriteManager (Client Unit)

```typescript
// packages/client/__tests__/unit/engine/SpriteManager.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpriteManager } from '../../../src/engine/renderer/SpriteManager';

// Mock Image
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 512;
  height = 512;
  src = '';

  constructor() {
    setTimeout(() => this.onload?.(), 0);
  }
}

global.Image = MockImage as any;

describe('SpriteManager', () => {
  let spriteManager: SpriteManager;

  beforeEach(() => {
    spriteManager = new SpriteManager();
  });

  describe('loadSpriteSheet', () => {
    it('should load and store spritesheet', async () => {
      const sheet = await spriteManager.loadSpriteSheet(
        'test',
        '/test.png',
        32,
        32
      );

      expect(sheet.columns).toBe(16);
      expect(sheet.rows).toBe(16);
    });

    it('should return cached sheet on second load', async () => {
      const sheet1 = await spriteManager.loadSpriteSheet('test', '/test.png');
      const sheet2 = await spriteManager.loadSpriteSheet('test', '/test.png');

      expect(sheet1).toBe(sheet2);
    });
  });

  describe('getSpriteRect', () => {
    it('should calculate correct sprite coordinates', async () => {
      await spriteManager.loadSpriteSheet('test', '/test.png', 32, 32);

      const rect = spriteManager.getSpriteRect('test', 17); // Second row, second column

      expect(rect.sx).toBe(32); // column 1 * 32
      expect(rect.sy).toBe(32); // row 1 * 32
      expect(rect.sw).toBe(32);
      expect(rect.sh).toBe(32);
    });
  });
});
```

### React Component Integration

```typescript
// packages/client/__tests__/integration/components/GameCanvas.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameCanvas } from '../../../src/components/game/GameCanvas';

// Mock canvas context
const mockContext = {
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  fillText: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as any;

describe('GameCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render canvas element', () => {
    render(<GameCanvas />);

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should have correct dimensions', () => {
    render(<GameCanvas />);

    const canvas = document.querySelector('canvas');
    expect(canvas?.width).toBe(800);
    expect(canvas?.height).toBe(600);
  });
});
```

## E2E Tests (Playwright)

```typescript
// packages/client/e2e/game.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test('player should join and see game', async ({ page }) => {
    await page.goto('/');

    // Enter name
    await page.fill('input[name="playerName"]', 'TestPlayer');
    await page.click('button[type="submit"]');

    // Should see canvas
    await expect(page.locator('canvas')).toBeVisible();

    // Should see player name in HUD
    await expect(page.locator('.player-name')).toContainText('TestPlayer');
  });

  test('player should move with arrow keys', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[name="playerName"]', 'TestPlayer');
    await page.click('button[type="submit"]');

    // Wait for game to load
    await page.waitForSelector('canvas');

    // Press arrow key
    await page.keyboard.press('ArrowRight');

    // Position should update (check via store or debug info)
    // This depends on implementation
  });

  test('two players should see each other', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Player 1 joins
    await page1.goto('/');
    await page1.fill('input[name="playerName"]', 'Player1');
    await page1.click('button[type="submit"]');
    await page1.waitForSelector('canvas');

    // Player 2 joins
    await page2.goto('/');
    await page2.fill('input[name="playerName"]', 'Player2');
    await page2.click('button[type="submit"]');
    await page2.waitForSelector('canvas');

    // Player 1 should see Player 2 in the list
    await expect(page1.locator('.player-list')).toContainText('Player2');

    await context1.close();
    await context2.close();
  });
});
```

## GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: tibia
          POSTGRES_PASSWORD: tibia123
          POSTGRES_DB: webtibia_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run type check
        run: npm run typecheck

      - name: Run unit tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://tibia:tibia123@localhost:5432/webtibia_test

      - name: Run e2e tests
        run: npx playwright test
        env:
          DATABASE_URL: postgresql://tibia:tibia123@localhost:5432/webtibia_test
```
