import { TILE_SIZE } from '@web-tibia/shared';
import type { Player } from './Player';
import type { Monster } from './Monster';

interface AttackResult {
  success: boolean;
  damage: number;
  targetDied: boolean;
  error?: string;
}

const ATTACK_RANGE = TILE_SIZE * 2; // 2 tiles range
const ATTACK_COOLDOWN = 1000; // 1 second cooldown
const BASE_PLAYER_DAMAGE = 10;

export class CombatSystem {
  private attackCooldowns: Map<string, number> = new Map(); // playerId -> lastAttackTime

  canAttack(attackerId: string): boolean {
    const lastAttack = this.attackCooldowns.get(attackerId) ?? 0;
    return Date.now() - lastAttack >= ATTACK_COOLDOWN;
  }

  attack(attacker: Player, target: Monster): AttackResult {
    // Check cooldown
    if (!this.canAttack(attacker.id)) {
      return {
        success: false,
        damage: 0,
        targetDied: false,
        error: 'Attack on cooldown',
      };
    }

    // Check if target is alive
    if (!target.isAlive) {
      return {
        success: false,
        damage: 0,
        targetDied: false,
        error: 'Target is dead',
      };
    }

    // Check range
    const distance = this.calculateDistance(attacker, target);
    if (distance > ATTACK_RANGE) {
      return {
        success: false,
        damage: 0,
        targetDied: false,
        error: 'Target out of range',
      };
    }

    // Calculate damage (simple formula for MVP)
    const damage = this.calculateDamage(attacker);

    // Apply damage
    const result = target.takeDamage(damage);

    // Set cooldown
    this.attackCooldowns.set(attacker.id, Date.now());

    return {
      success: true,
      damage: result.damage,
      targetDied: result.died,
    };
  }

  private calculateDistance(
    attacker: { x: number; y: number },
    target: { x: number; y: number }
  ): number {
    const dx = attacker.x - target.x;
    const dy = attacker.y - target.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateDamage(_attacker: Player): number {
    // Simple damage calculation for MVP
    // Add some randomness (80% - 120% of base damage)
    const variance = 0.8 + Math.random() * 0.4;
    return Math.floor(BASE_PLAYER_DAMAGE * variance);
  }

  getCooldownRemaining(attackerId: string): number {
    const lastAttack = this.attackCooldowns.get(attackerId) ?? 0;
    const remaining = ATTACK_COOLDOWN - (Date.now() - lastAttack);
    return Math.max(0, remaining);
  }
}
