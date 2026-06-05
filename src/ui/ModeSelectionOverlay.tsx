import type { GameMode } from "../game/types";

interface ModeSelectionOverlayProps {
  onSelectMode: (mode: GameMode) => void;
  onBackHome: () => void;
}

export function ModeSelectionOverlay({ onSelectMode, onBackHome }: ModeSelectionOverlayProps) {
  return (
    <main className="mode-select-screen">
      <section className="mode-select-panel" aria-labelledby="mode-select-title">
        <header>
          <p className="eyebrow">Choose Your Shift</p>
          <h1 id="mode-select-title">Select Game Mode</h1>
        </header>

        <div className="mode-options">
          <article className="mode-option">
            <div>
              <h2>Single Wall Mode</h2>
              <p>Build one clean wall. Finish it, review your score, then build another.</p>
            </div>
            <button className="primary-button" type="button" onClick={() => onSelectMode("singleWall")}>
              Play Single Wall
            </button>
          </article>

          <article className="mode-option">
            <div>
              <h2>Simulation Mode</h2>
              <p>
                Packages arrive faster. Finish walls under pressure. If 10 packages pile up on the
                conveyor, the run ends.
              </p>
            </div>
            <button className="primary-button" type="button" onClick={() => onSelectMode("simulation")}>
              Play Simulation
            </button>
          </article>
        </div>

        <button className="secondary-button mode-back-button" type="button" onClick={onBackHome}>
          Back to Home
        </button>
      </section>
    </main>
  );
}
