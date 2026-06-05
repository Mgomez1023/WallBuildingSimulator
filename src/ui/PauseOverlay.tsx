interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onBackHome: () => void;
}

export function PauseOverlay({ onResume, onRestart, onBackHome }: PauseOverlayProps) {
  return (
    <div className="overlay-panel" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <h2 id="pause-title">Paused</h2>
      <p className="pause-hint">Press Esc to Resume</p>
      <div className="button-row">
        <button className="primary-button" type="button" onClick={onResume}>
          Resume
        </button>
        <button className="secondary-button" type="button" onClick={onRestart}>
          Restart
        </button>
        <button className="secondary-button" type="button" onClick={onBackHome}>
          Back to Home
        </button>
      </div>
    </div>
  );
}
