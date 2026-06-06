import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createWallBuilderGame } from "../game/createGame";
import { gameEvents } from "../game/systems/EventBus";
import type { GameLayoutMode } from "../game/systems/gameLayout";
import type { GameMode, GameStatus, ShiftDifficulty } from "../game/types";

interface GameCanvasProps {
  runId: number;
  status: GameStatus;
  gameMode: GameMode;
  shiftDifficulty: ShiftDifficulty;
  layoutMode: GameLayoutMode;
}

export function GameCanvas({
  runId,
  status,
  gameMode,
  shiftDifficulty,
  layoutMode,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    gameRef.current = createWallBuilderGame(
      containerRef.current,
      gameMode,
      shiftDifficulty,
      layoutMode,
    );

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [gameMode, layoutMode, runId, shiftDifficulty]);

  useEffect(() => {
    if (!gameRef.current) {
      return;
    }

    gameEvents.emit("ui:set-status", status);
  }, [status]);

  return <div className="game-canvas" ref={containerRef} />;
}
