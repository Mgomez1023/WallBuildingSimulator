import { getShiftDifficultyConfig } from "../game/systems/shiftDifficulty";
import type { GameMode, ShiftDifficulty } from "../game/types";

interface InstructionsOverlayProps {
  gameMode: GameMode;
  shiftDifficulty: ShiftDifficulty;
  onStart: () => void;
}

export function InstructionsOverlay({
  gameMode,
  shiftDifficulty,
  onStart,
}: InstructionsOverlayProps) {
  const isSimulation = gameMode === "simulation";
  const shiftConfig = getShiftDifficultyConfig(shiftDifficulty);

  return (
    <div
      className="instructions-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructions-title"
    >
      <header>
        <p className="eyebrow">
          {shiftConfig.name} / {shiftConfig.shiftName}
        </p>
        <h2 id="instructions-title">
          {isSimulation ? "Simulation Mode" : "Build a Strong Truck Wall"}
        </h2>
      </header>

      <div className="instructions-content">
        <section>
          <h3>Objective</h3>
          <ul>
            {isSimulation ? (
              <>
                <li>Build walls continuously while packages arrive faster.</li>
                <li>Press Space to complete the current wall and keep the run moving.</li>
                <li>If 10 packages pile up on the conveyor, the simulation ends.</li>
              </>
            ) : (
              <>
                <li>Build the best wall possible inside the trailer.</li>
                <li>Keep packages inside the truck wall zone.</li>
                <li>Stack carefully, then use Finish Wall when satisfied.</li>
              </>
            )}
          </ul>
        </section>

        <section>
          <h3>Scoring</h3>
          <ul>
            <li>Placing packages successfully increases your score.</li>
            <li>
              {isSimulation
                ? "Your total score continues across every completed wall."
                : "Organized rows, fewer gaps, and stable walls are better."}
            </li>
          </ul>
        </section>

        <section>
          <h3>Controls</h3>
          <ul>
            <li>Drag packages with the mouse.</li>
            <li>Rotate with Arrow Keys or WASD.</li>
            <li>Press Esc to pause or resume.</li>
            <li>
              {isSimulation
                ? "Space clears only the completed trailer wall; conveyor packages stay."
                : "Finish Wall ends the current wall and opens results."}
            </li>
          </ul>
        </section>
      </div>

      <button className="primary-button instructions-start" type="button" onClick={onStart}>
        {isSimulation ? "Start Simulation" : "Start Wall"}
      </button>
    </div>
  );
}
