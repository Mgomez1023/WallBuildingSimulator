import type { ScoreData } from "../game/types";
import { SavedScores } from "./SavedScores";

interface StartScreenProps {
  highScores: ScoreData[];
  onStart: () => void;
}

export function StartScreen({ highScores, onStart }: StartScreenProps) {
  return (
    <main className="start-screen">
      <div className="start-copy">
        <h1>UPS Wall Builder</h1>
        <button className="primary-button" type="button" onClick={onStart}>
          Start
        </button>
      </div>
      <SavedScores scores={highScores} />
    </main>
  );
}
