import type { Direction } from '@web-tibia/shared';

export class KeyboardHandler {
  private keys: Set<string> = new Set();
  private onMove: (direction: Direction) => void;
  private moveInterval: number | null = null;
  private readonly MOVE_DELAY = 150; // ms between moves

  constructor(onMove: (direction: Direction) => void) {
    this.onMove = onMove;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  start(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  stop(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = null;
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Ignore if typing in input
    if (event.target instanceof HTMLInputElement) return;

    const direction = this.keyToDirection(event.key);
    if (!direction) return;

    event.preventDefault();

    if (!this.keys.has(event.key)) {
      this.keys.add(event.key);
      // Immediate move on first press
      this.onMove(direction);
      this.startMoveInterval();
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.key);
    if (this.keys.size === 0 && this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = null;
    }
  }

  private startMoveInterval(): void {
    if (this.moveInterval) return;

    this.moveInterval = window.setInterval(() => {
      const direction = this.getCurrentDirection();
      if (direction) {
        this.onMove(direction);
      }
    }, this.MOVE_DELAY);
  }

  private getCurrentDirection(): Direction | null {
    for (const key of this.keys) {
      const direction = this.keyToDirection(key);
      if (direction) return direction;
    }
    return null;
  }

  private keyToDirection(key: string): Direction | null {
    switch (key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        return 'north';
      case 'ArrowDown':
      case 's':
      case 'S':
        return 'south';
      case 'ArrowRight':
      case 'd':
      case 'D':
        return 'east';
      case 'ArrowLeft':
      case 'a':
      case 'A':
        return 'west';
      default:
        return null;
    }
  }
}
