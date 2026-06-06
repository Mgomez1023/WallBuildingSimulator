import type { ShiftDifficulty } from "../types";

export interface ShiftDifficultyConfig {
  name: string;
  shiftName: string;
  baseSpawnDelayMs: number;
  speedIncreasePerWallMs: number;
  minSpawnDelayMs: number;
  wallCompletionBonus: number;
  conveyorLimit: number;
  bulkChance: number;
}

export const DEFAULT_SHIFT_DIFFICULTY: ShiftDifficulty = "easy";

export const SHIFT_DIFFICULTY_CONFIGS: Record<ShiftDifficulty, ShiftDifficultyConfig> = {
  easy: {
    name: "Easy",
    shiftName: "Standard Shift",
    baseSpawnDelayMs: 2500,
    speedIncreasePerWallMs: 200,
    minSpawnDelayMs: 650,
    wallCompletionBonus: 200,
    conveyorLimit: 10,
    bulkChance: 0,
  },
  medium: {
    name: "Medium",
    shiftName: "Bulk Shift",
    baseSpawnDelayMs: 2500,
    speedIncreasePerWallMs: 200,
    minSpawnDelayMs: 650,
    wallCompletionBonus: 200,
    conveyorLimit: 10,
    bulkChance: 0.18,
  },
  hard: {
    name: "Hard",
    shiftName: "Heavy Flow",
    baseSpawnDelayMs: 1800,
    speedIncreasePerWallMs: 200,
    minSpawnDelayMs: 550,
    wallCompletionBonus: 200,
    conveyorLimit: 10,
    bulkChance: 0.32,
  },
};

export function getShiftDifficultyConfig(difficulty: ShiftDifficulty) {
  return SHIFT_DIFFICULTY_CONFIGS[difficulty];
}

export function getShiftSpawnDelay(difficulty: ShiftDifficulty, wallNumber: number) {
  const config = getShiftDifficultyConfig(difficulty);
  const delay =
    config.baseSpawnDelayMs -
    (Math.max(1, wallNumber) - 1) * config.speedIncreasePerWallMs;

  return Math.max(config.minSpawnDelayMs, delay);
}
