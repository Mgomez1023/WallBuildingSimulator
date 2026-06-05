export type Fragility = "low" | "medium" | "high";
export type GameMode = "singleWall" | "simulation";

export interface PackageData {
  id: string;
  width: number;
  height: number;
  depth: number;
  weight: number;
  fragility: Fragility;
  color: number;
  label: string;
}

export interface ScoreData {
  id: string;
  mode: GameMode;
  score: number;
  placedPackages: number;
  wallsCompleted: number;
  durationMs: number;
  completedAt: string;
  wallNumber: number;
  createdAt?: string;
}

export type GameStatus =
  | "menu"
  | "modeSelect"
  | "instructions"
  | "running"
  | "paused"
  | "wallFinished"
  | "gameOver";

export interface GameState {
  status: GameStatus;
  gameMode: GameMode | null;
  score: number;
  currentWallScore: number;
  placedPackages: number;
  totalPackagesPlaced: number;
  conveyorPackages: number;
  wallsCompleted: number;
  spawnDelayMs: number;
  runStartedAt: number | null;
  wallNumber: number;
  highScores: ScoreData[];
}

export interface ScoreUpdate {
  score: number;
  currentWallScore: number;
  placedPackages: number;
  totalPackagesPlaced: number;
  conveyorPackages: number;
  wallsCompleted: number;
  wallNumber: number;
  spawnDelayMs: number;
  lastPackage?: PackageData;
}
