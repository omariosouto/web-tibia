import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Monster, MONSTER_TYPES } from './Monster';

describe('Monster', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create a monster with correct initial state', () => {
    const monster = new Monster({ typeId: 'rat', x: 100, y: 200 });

    expect(monster.name).toBe('Rat');
    expect(monster.typeId).toBe(MONSTER_TYPES.rat.id);
    expect(monster.x).toBe(100);
    expect(monster.y).toBe(200);
    expect(monster.health).toBe(MONSTER_TYPES.rat.health);
    expect(monster.maxHealth).toBe(MONSTER_TYPES.rat.health);
    expect(monster.isAlive).toBe(true);
  });

  it('should throw error for unknown monster type', () => {
    expect(() => new Monster({ typeId: 'dragon', x: 0, y: 0 })).toThrow(
      'Unknown monster type: dragon'
    );
  });

  it('should take damage correctly', () => {
    const monster = new Monster({ typeId: 'rat', x: 0, y: 0 });
    const initialHealth = monster.health;

    const result = monster.takeDamage(5);

    expect(result.died).toBe(false);
    expect(result.damage).toBe(5);
    expect(monster.health).toBe(initialHealth - 5);
    expect(monster.isAlive).toBe(true);
  });

  it('should die when health reaches zero', () => {
    const monster = new Monster({ typeId: 'rat', x: 0, y: 0 });

    const result = monster.takeDamage(monster.health);

    expect(result.died).toBe(true);
    expect(monster.health).toBe(0);
    expect(monster.isAlive).toBe(false);
  });

  it('should not take damage when dead', () => {
    const monster = new Monster({ typeId: 'rat', x: 0, y: 0 });
    monster.takeDamage(monster.health); // Kill the monster

    const result = monster.takeDamage(10);

    expect(result.died).toBe(false);
    expect(result.damage).toBe(0);
  });

  it('should cap damage at remaining health', () => {
    const monster = new Monster({ typeId: 'rat', x: 0, y: 0 });
    monster.takeDamage(monster.health - 5); // Leave 5 health

    const result = monster.takeDamage(100);

    expect(result.damage).toBe(5);
    expect(result.died).toBe(true);
  });

  it('should respawn after respawn time', () => {
    const monster = new Monster({ typeId: 'rat', x: 100, y: 200 });
    const onRespawn = vi.fn();

    // Kill the monster
    monster.takeDamage(monster.health);
    expect(monster.isAlive).toBe(false);

    // Schedule respawn
    monster.scheduleRespawn(onRespawn);

    // Advance time
    vi.advanceTimersByTime(MONSTER_TYPES.rat.respawnTime);

    expect(onRespawn).toHaveBeenCalledTimes(1);
    expect(monster.isAlive).toBe(true);
    expect(monster.health).toBe(monster.maxHealth);
    expect(monster.x).toBe(100); // Back to spawn position
    expect(monster.y).toBe(200);
  });

  it('should convert to state correctly', () => {
    const monster = new Monster({ typeId: 'snake', x: 50, y: 75 });
    const state = monster.toState();

    expect(state).toEqual({
      id: monster.id,
      typeId: MONSTER_TYPES.snake.id,
      name: 'Snake',
      x: 50,
      y: 75,
      health: MONSTER_TYPES.snake.health,
      maxHealth: MONSTER_TYPES.snake.health,
      spriteId: MONSTER_TYPES.snake.spriteId,
      direction: 'south',
      isAlive: true,
    });
  });
});
