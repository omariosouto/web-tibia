import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CombatSystem } from './CombatSystem';
import { Monster } from './Monster';
import { Player } from './Player';

describe('CombatSystem', () => {
  let combatSystem: CombatSystem;
  let player: Player;
  let monster: Monster;

  beforeEach(() => {
    vi.useFakeTimers();
    combatSystem = new CombatSystem();
    player = new Player({
      id: 'player-1',
      socketId: 'socket-1',
      name: 'TestPlayer',
      x: 100,
      y: 100,
      direction: 'south',
    });
    monster = new Monster({
      typeId: 'rat',
      x: 100,
      y: 132, // Within attack range (1 tile = 32px away)
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should successfully attack a nearby monster', () => {
    const result = combatSystem.attack(player, monster);

    expect(result.success).toBe(true);
    expect(result.damage).toBeGreaterThan(0);
    expect(result.targetDied).toBe(false);
    expect(monster.health).toBeLessThan(monster.maxHealth);
  });

  it('should not attack if on cooldown', () => {
    // First attack
    combatSystem.attack(player, monster);

    // Try to attack again immediately
    const result = combatSystem.attack(player, monster);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Attack on cooldown');
    expect(result.damage).toBe(0);
  });

  it('should allow attack after cooldown expires', () => {
    // First attack
    combatSystem.attack(player, monster);

    // Advance past cooldown (1 second)
    vi.advanceTimersByTime(1100);

    // Second attack should work
    const result = combatSystem.attack(player, monster);

    expect(result.success).toBe(true);
    expect(result.damage).toBeGreaterThan(0);
  });

  it('should not attack a dead monster', () => {
    // Kill the monster
    monster.takeDamage(monster.health);

    const result = combatSystem.attack(player, monster);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Target is dead');
  });

  it('should not attack a monster out of range', () => {
    // Move monster far away (more than 2 tiles = 64px)
    monster.x = 500;
    monster.y = 500;

    const result = combatSystem.attack(player, monster);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Target out of range');
  });

  it('should report correct cooldown remaining', () => {
    expect(combatSystem.getCooldownRemaining(player.id)).toBe(0);

    combatSystem.attack(player, monster);

    // Should have ~1000ms cooldown
    const remaining = combatSystem.getCooldownRemaining(player.id);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(1000);

    // Advance half the cooldown
    vi.advanceTimersByTime(500);
    expect(combatSystem.getCooldownRemaining(player.id)).toBeLessThanOrEqual(500);

    // Advance past cooldown
    vi.advanceTimersByTime(600);
    expect(combatSystem.getCooldownRemaining(player.id)).toBe(0);
  });

  it('should deal variable damage', () => {
    // Use a high-health monster for this test
    const healthyMonster = new Monster({
      typeId: 'spider', // Spider has 50 HP
      x: 100,
      y: 132,
    });
    const damages: number[] = [];

    // Attack multiple times and collect damage values
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(1100); // Wait for cooldown
      const result = combatSystem.attack(player, healthyMonster);
      if (result.success) {
        damages.push(result.damage);
      }
    }

    // Check that damage is within expected range (base 10, range 80-120% = 8-12)
    for (const damage of damages) {
      expect(damage).toBeGreaterThanOrEqual(8);
      expect(damage).toBeLessThanOrEqual(12);
    }
  });
});
