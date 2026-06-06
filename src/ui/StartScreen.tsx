import { useState } from "react";
import { SHIFT_DIFFICULTY_CONFIGS } from "../game/systems/shiftDifficulty";
import type { GameMode, ScoreData, ShiftDifficulty } from "../game/types";
import { SavedScores } from "./SavedScores";

interface StartScreenProps {
  highScores: ScoreData[];
  onSelectMode: (mode: GameMode, shiftDifficulty?: ShiftDifficulty) => void;
}

export function StartScreen({ highScores, onSelectMode }: StartScreenProps) {
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode | null>(null);

  return (
    <main className="start-screen">
      <div className="start-copy">
        <h1>UPS Wall Builder</h1>
        <div className="home-mode-actions">
          <button
            className="primary-button"
            type="button"
            aria-expanded={selectedGameMode === "singleWall"}
            onClick={() =>
              setSelectedGameMode((currentMode) =>
                currentMode === "singleWall" ? null : "singleWall",
              )
            }
          >
            Single Wall Mode
          </button>
          <button
            className="primary-button"
            type="button"
            aria-expanded={selectedGameMode === "simulation"}
            onClick={() =>
              setSelectedGameMode((currentMode) =>
                currentMode === "simulation" ? null : "simulation",
              )
            }
          >
            Simulation Mode
          </button>
        </div>
        {selectedGameMode && (
          <section
            className="shift-difficulty-panel"
            aria-label={`${selectedGameMode === "simulation" ? "Simulation" : "Single Wall"} shift difficulty`}
          >
            <p className="eyebrow">
              Choose {selectedGameMode === "simulation" ? "Simulation" : "Single Wall"} Shift
            </p>
            <div className="shift-difficulty-options">
              {(["easy", "medium", "hard"] as ShiftDifficulty[]).map((difficulty) => {
                const config = SHIFT_DIFFICULTY_CONFIGS[difficulty];

                return (
                  <button
                    className="shift-difficulty-button"
                    type="button"
                    key={difficulty}
                    onClick={() => onSelectMode(selectedGameMode, difficulty)}
                  >
                    <strong>{config.name}</strong>
                    <span>{config.shiftName}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
      <SavedScores scores={highScores} />
    </main>
  );
}
