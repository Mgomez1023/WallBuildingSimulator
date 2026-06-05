import type { ScoreData } from "../game/types";

interface SavedScoresProps {
  scores: ScoreData[];
}

export function SavedScores({ scores }: SavedScoresProps) {
  return (
    <section className="saved-scores" aria-label="Saved high scores">
      <h2>Saved Scores</h2>
      {scores.length === 0 ? (
        <p className="empty-scores">No saved scores yet.</p>
      ) : (
        <ol>
          {scores.map((score) => (
            <li key={score.id}>
              <span>{score.score.toLocaleString()}</span>
              <small>
                {score.mode === "simulation"
                  ? `Simulation / ${score.wallsCompleted} walls / ${score.placedPackages} packages`
                  : `Single Wall / Wall ${score.wallNumber} / ${score.placedPackages} packages`}{" "}
                / {formatDuration(score.durationMs)} / {formatDate(score.completedAt)}
              </small>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
