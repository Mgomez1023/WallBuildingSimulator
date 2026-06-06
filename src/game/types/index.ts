export type Fragility = "low" | "medium" | "high";
export type GameMode = "singleWall" | "simulation";
export type ShiftDifficulty = "easy" | "medium" | "hard";
export type PackageKind = "standard" | "bulk";
export type BulkPackagePreset = "long" | "wide" | "tall" | "heavy-irregular" | "round";
export type BulkPackageShape = "round" | "slantedBox" | "lumpyBox" | "wideOddBox";

export interface PackageData {
  id: string;
  kind: PackageKind;
  bulkPreset?: BulkPackagePreset;
  bulkShape?: BulkPackageShape;
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
  shiftDifficulty?: ShiftDifficulty;
  shiftDifficultyLabel?: string;
  /** Legacy fields retained so older localStorage records can be migrated. */
  simulationDifficulty?: ShiftDifficulty;
  simulationDifficultyLabel?: string;
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
  | "instructions"
  | "running"
  | "paused"
  | "wallFinished"
  | "gameOver";

export interface GameState {
  status: GameStatus;
  gameMode: GameMode | null;
  shiftDifficulty: ShiftDifficulty;
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
