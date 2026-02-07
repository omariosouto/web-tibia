import { useRef, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { CanvasRenderer } from '../../engine/renderer/CanvasRenderer';
import { SpriteManager } from '../../engine/renderer/SpriteManager';
import { KeyboardHandler } from '../../engine/input/KeyboardHandler';
import { useSocket } from '../../hooks/useSocket';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const keyboardRef = useRef<KeyboardHandler | null>(null);
  const animationFrameRef = useRef<number>(0);

  const { mapData, players, playerId } = useGameStore();
  const { move } = useSocket();

  // Initialize renderer and keyboard
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const spriteManager = new SpriteManager();
    const renderer = new CanvasRenderer(canvas, spriteManager);
    rendererRef.current = renderer;

    // Initialize keyboard handler
    const keyboard = new KeyboardHandler((direction) => {
      move(direction);
    });
    keyboard.start();
    keyboardRef.current = keyboard;

    return () => {
      keyboard.stop();
    };
  }, [move]);

  // Game loop
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const gameLoop = () => {
      renderer.render(mapData, players, playerId);
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mapData, players, playerId]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border-2 border-gray-700 rounded-lg"
      tabIndex={0}
    />
  );
}
