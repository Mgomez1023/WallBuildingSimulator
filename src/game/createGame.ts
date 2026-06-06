import Phaser from "phaser";
import { WallBuilderScene } from "./scenes/WallBuilderScene";
import { getGameLayoutDimensions, type GameLayoutMode } from "./systems/gameLayout";
import type { GameMode, ShiftDifficulty } from "./types";

export function createWallBuilderGame(
  parent: HTMLElement,
  gameMode: GameMode,
  shiftDifficulty: ShiftDifficulty,
  layoutMode: GameLayoutMode,
) {
  const layout = getGameLayoutDimensions(layoutMode);

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: layout.gameWidth,
    height: layout.gameHeight,
    backgroundColor: "#f6f0e4",
    input: {
      activePointers: 3,
    },
    physics: {
      default: "matter",
      matter: {
        gravity: { x: 0, y: 1.05 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [new WallBuilderScene(gameMode, shiftDifficulty, layout)],
  });
}
