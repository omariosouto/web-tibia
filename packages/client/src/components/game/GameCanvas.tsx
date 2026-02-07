import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { CanvasRenderer } from '../../engine/renderer/CanvasRenderer';
import { SpriteManager } from '../../engine/renderer/SpriteManager';
import { KeyboardHandler } from '../../engine/input/KeyboardHandler';
import { useSocket } from '../../hooks/useSocket';
import { TILE_SIZE } from '@web-tibia/shared';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const keyboardRef = useRef<KeyboardHandler | null>(null);
  const animationFrameRef = useRef<number>(0);

  const { mapData, players, monsters, playerId, selectedTargetId, setSelectedTarget } =
    useGameStore();
  const { move, attack } = useSocket();

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
      renderer.render(mapData, players, monsters, playerId, selectedTargetId);
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mapData, players, monsters, playerId, selectedTargetId]);

  // Handle canvas click for monster selection
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const renderer = rendererRef.current;
      if (!canvas || !renderer) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      // Convert screen coords to world coords
      const camera = renderer.getCamera();
      const worldPos = camera.screenToWorld(clickX, clickY);

      // Find monster at click position
      const clickedMonster = monsters.find((m) => {
        if (!m.isAlive) return false;
        const monsterLeft = m.x;
        const monsterRight = m.x + TILE_SIZE;
        const monsterTop = m.y;
        const monsterBottom = m.y + TILE_SIZE;
        return (
          worldPos.x >= monsterLeft &&
          worldPos.x < monsterRight &&
          worldPos.y >= monsterTop &&
          worldPos.y < monsterBottom
        );
      });

      if (clickedMonster) {
        if (selectedTargetId === clickedMonster.id) {
          // Already selected - attack!
          attack(clickedMonster.id);
        } else {
          // Select the monster
          setSelectedTarget(clickedMonster.id);
        }
      } else {
        // Clicked on empty space - deselect
        setSelectedTarget(null);
      }
    },
    [monsters, selectedTargetId, attack, setSelectedTarget]
  );

  // Handle space key for attack
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && selectedTargetId) {
        event.preventDefault();
        attack(selectedTargetId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTargetId, attack]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="border-2 border-gray-700 rounded-lg cursor-pointer"
      tabIndex={0}
      onClick={handleCanvasClick}
    />
  );
}
