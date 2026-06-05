import type { GameMode, ScoreData } from "../game/types";
import { SavedScores } from "./SavedScores";

export type ResultType = "wallComplete" | "gameOver";

interface ResultsOverlayProps {
  gameMode: GameMode;
  resultType: ResultType;
  result: ScoreData;
  highScores: ScoreData[];
  isHighScore: boolean;
  wasSaved: boolean;
  onBuildNewWall?: () => void;
  onRestart?: () => void;
  onBackHome: () => void;
}

export function ResultsOverlay({
  gameMode,
  resultType,
  result,
  highScores,
  isHighScore,
  wasSaved,
  onBuildNewWall,
  onRestart,
  onBackHome,
}: ResultsOverlayProps) {
  const isSimulation = gameMode === "simulation";
  const title = isSimulation
    ? "Simulation Over"
    : resultType === "wallComplete"
      ? "Wall Complete"
      : "Game Over";

  return (
    <div className="results-screen" role="dialog" aria-modal="true" aria-labelledby="results-title">
      <div className="results-copy">
        <p className="eyebrow">{isSimulation ? "Simulation Results" : `Wall ${result.wallNumber}`}</p>
        <h2 id="results-title">{title}</h2>
        <p className="final-score">{result.score.toLocaleString()}</p>
        {isSimulation && <p className="result-line">{result.wallsCompleted} walls completed</p>}
        <p className="result-line">
          {result.placedPackages} {isSimulation ? "total packages placed" : "packages placed"}
        </p>
        <p className="result-line">Time {formatDuration(result.durationMs)}</p>
        <p className="result-line">{getSaveMessage(wasSaved, isHighScore)}</p>
        <div className="button-row results-actions">
          {onBuildNewWall && (
            <button className="primary-button" type="button" onClick={onBuildNewWall}>
              Build New Wall
            </button>
          )}
          {onRestart && (
            <button className="secondary-button" type="button" onClick={onRestart}>
              Restart
            </button>
          )}
          <button className="secondary-button" type="button" onClick={onBackHome}>
            Back to Home
          </button>
        </div>
      </div>
      <SavedScores scores={highScores} />
    </div>
  );
}

function getSaveMessage(wasSaved: boolean, isHighScore: boolean) {
  if (!wasSaved) {
    return "Not saved until at least one package is placed";
  }

  return isHighScore ? "New high score" : "Saved to high scores";
}

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
