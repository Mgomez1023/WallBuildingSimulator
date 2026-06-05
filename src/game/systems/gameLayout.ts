import Phaser from "phaser";

export type GameLayoutMode = "desktop" | "mobile";

export interface TruckBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface GameLayout {
  mode: GameLayoutMode;
  gameWidth: number;
  gameHeight: number;
  truckBounds: TruckBounds;
  conveyorBounds: Phaser.Geom.Rectangle;
  trailerWallThickness: number;
}

export const MOBILE_LAYOUT_BREAKPOINT = 768;
export const HUD_HEIGHT = 120;

const DESKTOP_LAYOUT: GameLayout = {
  mode: "desktop",
  gameWidth: 960,
  gameHeight: 600,
  truckBounds: {
    left: 360,
    right: 900,
    top: 118,
    bottom: 548,
  },
  conveyorBounds: new Phaser.Geom.Rectangle(32, 430, 272, 96),
  trailerWallThickness: 32,
};

const MOBILE_LAYOUT: GameLayout = {
  mode: "mobile",
  gameWidth: 600,
  gameHeight: 900,
  truckBounds: {
    left: 50,
    right: 550,
    top: 92,
    bottom: 590,
  },
  conveyorBounds: new Phaser.Geom.Rectangle(70, 700, 460, 120),
  trailerWallThickness: 32,
};

export function getLayoutMode(viewportWidth = window.innerWidth): GameLayoutMode {
  return viewportWidth <= MOBILE_LAYOUT_BREAKPOINT ? "mobile" : "desktop";
}

export function getGameLayoutDimensions(mode: GameLayoutMode): GameLayout {
  const layout = mode === "mobile" ? MOBILE_LAYOUT : DESKTOP_LAYOUT;

  return {
    ...layout,
    truckBounds: { ...layout.truckBounds },
    conveyorBounds: new Phaser.Geom.Rectangle(
      layout.conveyorBounds.x,
      layout.conveyorBounds.y,
      layout.conveyorBounds.width,
      layout.conveyorBounds.height,
    ),
  };
}
