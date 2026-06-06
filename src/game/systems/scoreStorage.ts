import {
  DEFAULT_SHIFT_DIFFICULTY,
  getShiftDifficultyConfig,
} from "./shiftDifficulty";
import type { ScoreData, ShiftDifficulty } from "../types";

const SCORE_STORAGE_KEY = "ups-wall-builder:scores";
const MAX_SAVED_SCORES = 10;

const hasLocalStorage = () => {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
};

export function loadScores(): ScoreData[] {
  if (!hasLocalStorage()) {
    return [];
  }

  const rawScores = window.localStorage.getItem(SCORE_STORAGE_KEY);
  if (!rawScores) {
    return [];
  }

  try {
    const parsedScores = JSON.parse(rawScores) as ScoreData[];
    return Array.isArray(parsedScores) ? sortScores(parsedScores.map(normalizeScore)) : [];
  } catch {
    return [];
  }
}

export function saveScore(score: ScoreData): ScoreData[] {
  if (score.placedPackages <= 0) {
    return loadScores();
  }

  const nextScores = sortScores([...loadScores(), normalizeScore(score)]).slice(0, MAX_SAVED_SCORES);

  if (hasLocalStorage()) {
    window.localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(nextScores));
  }

  return nextScores;
}

function sortScores(scores: ScoreData[]) {
  return scores
    .filter((score) => Number.isFinite(score.score) && score.placedPackages > 0)
    .sort((a, b) => b.score - a.score || b.placedPackages - a.placedPackages);
}

function normalizeScore(score: ScoreData) {
  const legacyCreatedAt = score.createdAt ?? new Date().toISOString();
  const mode = score.mode ?? "singleWall";
  const shiftDifficulty = normalizeShiftDifficulty(
    score.shiftDifficulty ?? score.simulationDifficulty,
  );
  const shiftConfig = getShiftDifficultyConfig(shiftDifficulty);

  return {
    ...score,
    mode,
    shiftDifficulty,
    shiftDifficultyLabel: `${shiftConfig.name} / ${shiftConfig.shiftName}`,
    simulationDifficulty: undefined,
    simulationDifficultyLabel: undefined,
    completedAt: score.completedAt ?? legacyCreatedAt,
    wallNumber: score.wallNumber ?? 1,
    wallsCompleted: score.wallsCompleted ?? Math.max(0, (score.wallNumber ?? 1) - 1),
  };
}

function normalizeShiftDifficulty(difficulty: ShiftDifficulty | undefined): ShiftDifficulty {
  return difficulty === "medium" || difficulty === "hard"
    ? difficulty
    : DEFAULT_SHIFT_DIFFICULTY;
}
