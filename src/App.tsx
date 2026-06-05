import { useCallback, useEffect, useRef, useState } from "react";
import { gameEvents } from "./game/systems/EventBus";
import { getLayoutMode, type GameLayoutMode } from "./game/systems/gameLayout";
import { loadScores, saveScore } from "./game/systems/scoreStorage";
import type { GameMode, GameState, ScoreData, ScoreUpdate } from "./game/types";
import { GameCanvas } from "./ui/GameCanvas";
import { InstructionsOverlay } from "./ui/InstructionsOverlay";
import { ModeSelectionOverlay } from "./ui/ModeSelectionOverlay";
import { MobileRotateControls } from "./ui/MobileRotateControls";
import { PauseOverlay } from "./ui/PauseOverlay";
import { ResultsOverlay, type ResultType } from "./ui/ResultsOverlay";
import { StartScreen } from "./ui/StartScreen";

interface ResultState {
  resultType: ResultType;
  result: ScoreData;
  isHighScore: boolean;
  wasSaved: boolean;
}

const createScoreId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `score-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
};

const createInitialGameState = (): GameState => ({
  status: "menu",
  gameMode: null,
  score: 0,
  currentWallScore: 0,
  placedPackages: 0,
  totalPackagesPlaced: 0,
  conveyorPackages: 0,
  wallsCompleted: 0,
  spawnDelayMs: 0,
  runStartedAt: null,
  wallNumber: 1,
  highScores: loadScores(),
});

function App() {
  const [runId, setRunId] = useState(0);
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [resultState, setResultState] = useState<ResultState | null>(null);
  const [layoutMode, setLayoutMode] = useState<GameLayoutMode>(() => getLayoutMode());
  const [hasActiveDrag, setHasActiveDrag] = useState(false);

  const gameModeRef = useRef<GameMode | null>(null);
  const scoreRef = useRef(0);
  const currentWallScoreRef = useRef(0);
  const placedPackagesRef = useRef(0);
  const totalPackagesPlacedRef = useRef(0);
  const wallsCompletedRef = useRef(0);
  const wallNumberRef = useRef(1);
  const runStartedAtRef = useRef<number | null>(null);
  const scoreSavedRef = useRef(false);
  const resultStateRef = useRef<ResultState | null>(null);

  const resetSessionRefs = useCallback((gameMode: GameMode | null) => {
    gameModeRef.current = gameMode;
    scoreRef.current = 0;
    currentWallScoreRef.current = 0;
    placedPackagesRef.current = 0;
    totalPackagesPlacedRef.current = 0;
    wallsCompletedRef.current = 0;
    wallNumberRef.current = 1;
    runStartedAtRef.current = null;
    scoreSavedRef.current = false;
    resultStateRef.current = null;
    setResultState(null);
    setHasActiveDrag(false);
  }, []);

  const startModeSelection = useCallback(() => {
    resetSessionRefs(null);
    setGameState((currentState) => ({
      ...currentState,
      status: "modeSelect",
      gameMode: null,
      score: 0,
      currentWallScore: 0,
      placedPackages: 0,
      totalPackagesPlaced: 0,
      conveyorPackages: 0,
      wallsCompleted: 0,
      spawnDelayMs: 0,
      runStartedAt: null,
      wallNumber: 1,
    }));
  }, [resetSessionRefs]);

  const startInstructionsForMode = useCallback(
    (gameMode: GameMode) => {
      resetSessionRefs(gameMode);
      setRunId((currentRunId) => currentRunId + 1);
      setGameState((currentState) => ({
        ...currentState,
        status: "instructions",
        gameMode,
        score: 0,
        currentWallScore: 0,
        placedPackages: 0,
        totalPackagesPlaced: 0,
        conveyorPackages: 0,
        wallsCompleted: 0,
        spawnDelayMs: 0,
        runStartedAt: null,
        wallNumber: 1,
      }));
    },
    [resetSessionRefs],
  );

  const startGameplayFromInstructions = useCallback(() => {
    const startedAt = Date.now();
    runStartedAtRef.current = startedAt;
    setGameState((currentState) =>
      currentState.status === "instructions"
        ? { ...currentState, status: "running", runStartedAt: startedAt }
        : currentState,
    );
  }, []);

  const restartMode = useCallback(() => {
    const gameMode = gameModeRef.current;
    if (!gameMode) {
      startModeSelection();
      return;
    }

    if (
      gameMode === "simulation" &&
      totalPackagesPlacedRef.current > 0 &&
      !scoreSavedRef.current
    ) {
      const highScores = saveScore(createScoreRecord(gameMode));
      setGameState((currentState) => ({ ...currentState, highScores }));
    }

    startInstructionsForMode(gameMode);
  }, [startInstructionsForMode, startModeSelection]);

  const resumeRun = useCallback(() => {
    setGameState((currentState) =>
      currentState.status === "paused" ? { ...currentState, status: "running" } : currentState,
    );
  }, []);

  const togglePause = useCallback(() => {
    setGameState((currentState) => {
      if (currentState.status === "running") {
        return { ...currentState, status: "paused" };
      }

      if (currentState.status === "paused") {
        return { ...currentState, status: "running" };
      }

      return currentState;
    });
  }, []);

  const createScoreRecord = useCallback((gameMode: GameMode): ScoreData => {
    const startedAt = runStartedAtRef.current ?? Date.now();
    const isSimulation = gameMode === "simulation";

    return {
      id: createScoreId(),
      mode: gameMode,
      score: scoreRef.current,
      placedPackages: isSimulation
        ? totalPackagesPlacedRef.current
        : placedPackagesRef.current,
      wallsCompleted: isSimulation ? wallsCompletedRef.current : 1,
      durationMs: Date.now() - startedAt,
      completedAt: new Date().toISOString(),
      wallNumber: wallNumberRef.current,
    };
  }, []);

  const completeResult = useCallback(
    (resultType: ResultType) => {
      const gameMode = gameModeRef.current;
      if (!gameMode) {
        return;
      }

      const nextStatus = resultType === "wallComplete" ? "wallFinished" : "gameOver";
      gameEvents.emit(resultType === "wallComplete" ? "ui:finish-wall" : "ui:game-over");

      if (scoreSavedRef.current && resultStateRef.current) {
        setResultState(resultStateRef.current);
        setGameState((currentState) => ({ ...currentState, status: nextStatus }));
        return;
      }

      const resultRecord = createScoreRecord(gameMode);
      const shouldSaveScore = resultRecord.placedPackages > 0 || resultRecord.score > 0;
      let highScores = gameState.highScores;

      if (shouldSaveScore) {
        highScores = saveScore(resultRecord);
      }

      const nextResultState: ResultState = {
        resultType,
        result: resultRecord,
        isHighScore: shouldSaveScore && highScores[0]?.id === resultRecord.id,
        wasSaved: shouldSaveScore,
      };

      scoreSavedRef.current = true;
      resultStateRef.current = nextResultState;
      setResultState(nextResultState);
      setGameState((currentState) => ({
        ...currentState,
        status: nextStatus,
        highScores,
      }));
    },
    [createScoreRecord, gameState.highScores],
  );

  const finishRun = useCallback(() => {
    completeResult("gameOver");
  }, [completeResult]);

  const finishOrCompleteWall = useCallback(() => {
    if (gameModeRef.current === "simulation") {
      gameEvents.emit("ui:finish-wall");
      return;
    }

    completeResult("wallComplete");
  }, [completeResult]);

  const startNewWall = useCallback(() => {
    const nextWallNumber = wallNumberRef.current + 1;
    currentWallScoreRef.current = 0;
    scoreRef.current = 0;
    placedPackagesRef.current = 0;
    totalPackagesPlacedRef.current = 0;
    wallsCompletedRef.current += 1;
    wallNumberRef.current = nextWallNumber;
    runStartedAtRef.current = Date.now();
    scoreSavedRef.current = false;
    resultStateRef.current = null;
    setResultState(null);

    gameEvents.emit("ui:start-new-wall");
    setGameState((currentState) => ({
      ...currentState,
      status: "running",
      score: 0,
      currentWallScore: 0,
      placedPackages: 0,
      totalPackagesPlaced: 0,
      conveyorPackages: 0,
      wallsCompleted: wallsCompletedRef.current,
      spawnDelayMs: currentState.spawnDelayMs,
      runStartedAt: runStartedAtRef.current,
      wallNumber: nextWallNumber,
    }));
  }, []);

  const backToHome = useCallback(() => {
    const gameMode = gameModeRef.current;
    let highScores = gameState.highScores;

    if (
      gameMode === "simulation" &&
      totalPackagesPlacedRef.current > 0 &&
      !scoreSavedRef.current
    ) {
      highScores = saveScore(createScoreRecord(gameMode));
    }

    gameEvents.emit("ui:set-status", "menu");
    resetSessionRefs(null);
    setGameState(() => ({
      ...createInitialGameState(),
      highScores,
    }));
  }, [createScoreRecord, gameState.highScores, resetSessionRefs]);

  useEffect(() => {
    const unsubscribeScore = gameEvents.on("score:changed", (scoreUpdate: ScoreUpdate) => {
      scoreRef.current = scoreUpdate.score;
      currentWallScoreRef.current = scoreUpdate.currentWallScore;
      placedPackagesRef.current = scoreUpdate.placedPackages;
      totalPackagesPlacedRef.current = scoreUpdate.totalPackagesPlaced;
      wallsCompletedRef.current = scoreUpdate.wallsCompleted;
      wallNumberRef.current = scoreUpdate.wallNumber;

      setGameState((currentState) => ({
        ...currentState,
        score: scoreUpdate.score,
        currentWallScore: scoreUpdate.currentWallScore,
        placedPackages: scoreUpdate.placedPackages,
        totalPackagesPlaced: scoreUpdate.totalPackagesPlaced,
        conveyorPackages: scoreUpdate.conveyorPackages,
        wallsCompleted: scoreUpdate.wallsCompleted,
        spawnDelayMs: scoreUpdate.spawnDelayMs,
        wallNumber: scoreUpdate.wallNumber,
      }));
    });
    const unsubscribeSimulationOver = gameEvents.on("game:simulation-over", () => {
      completeResult("gameOver");
    });
    const unsubscribeDragActive = gameEvents.on("game:drag-active", (isActive) => {
      setHasActiveDrag(isActive);
    });

    return () => {
      unsubscribeScore();
      unsubscribeSimulationOver();
      unsubscribeDragActive();
    };
  }, [completeResult]);

  useEffect(() => {
    const updateLayoutMode = () => {
      if (
        gameState.status === "menu" ||
        gameState.status === "modeSelect" ||
        gameState.status === "instructions"
      ) {
        setLayoutMode(getLayoutMode());
      }
    };

    window.addEventListener("resize", updateLayoutMode);
    return () => window.removeEventListener("resize", updateLayoutMode);
  }, [gameState.status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.repeat && event.key === "Escape") {
        togglePause();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePause]);

  if (gameState.status === "menu") {
    return <StartScreen highScores={gameState.highScores} onStart={startModeSelection} />;
  }

  if (gameState.status === "modeSelect") {
    return <ModeSelectionOverlay onSelectMode={startInstructionsForMode} onBackHome={backToHome} />;
  }

  const gameMode = gameState.gameMode;
  if (!gameMode) {
    return null;
  }

  const isSimulation = gameMode === "simulation";

  return (
    <main className="app-shell">
      <section className="play-area">
        <GameCanvas
          key={runId}
          runId={runId}
          status={gameState.status}
          gameMode={gameMode}
          layoutMode={layoutMode}
        />
        {layoutMode === "mobile" && hasActiveDrag && gameState.status === "running" && (
          <MobileRotateControls />
        )}
        {gameState.status === "instructions" && (
          <div className="overlay-backdrop">
            <InstructionsOverlay gameMode={gameMode} onStart={startGameplayFromInstructions} />
          </div>
        )}
        {gameState.status === "paused" && (
          <div className="overlay-backdrop">
            <PauseOverlay onResume={resumeRun} onRestart={restartMode} onBackHome={backToHome} />
          </div>
        )}
        {(gameState.status === "wallFinished" || gameState.status === "gameOver") && resultState && (
          <div className="overlay-backdrop">
            <ResultsOverlay
              gameMode={gameMode}
              resultType={resultState.resultType}
              result={resultState.result}
              highScores={gameState.highScores}
              isHighScore={resultState.isHighScore}
              wasSaved={resultState.wasSaved}
              onBuildNewWall={
                gameMode === "singleWall" && resultState.resultType === "wallComplete"
                  ? startNewWall
                  : undefined
              }
              onRestart={
                gameMode === "simulation" || resultState.resultType === "wallComplete"
                  ? restartMode
                  : undefined
              }
              onBackHome={backToHome}
            />
          </div>
        )}
      </section>

      <header className="game-header">
        <div>
          <p className="eyebrow">UPS Wall Builder</p>
          <h1>{isSimulation ? "Simulation Shift" : "Truck Wall"}</h1>
        </div>
        <div className="score-strip" aria-live="polite">
          <span>
            {isSimulation ? "Total Score" : "Score"}{" "}
            <strong>{gameState.score.toLocaleString()}</strong>
          </span>
          {isSimulation && (
            <span>
              Wall Score <strong>{gameState.currentWallScore.toLocaleString()}</strong>
            </span>
          )}
          <span>
            {isSimulation ? "Total Packages" : "Packages"}{" "}
            <strong>
              {isSimulation ? gameState.totalPackagesPlaced : gameState.placedPackages}
            </strong>
          </span>
          {isSimulation && (
            <span>
              Conveyor <strong>{gameState.conveyorPackages} / 10</strong>
            </span>
          )}
          {isSimulation && (
            <span>
              Spawn Speed <strong>{gameState.spawnDelayMs} ms</strong>
            </span>
          )}
          <span>
            Wall <strong>{gameState.wallNumber}</strong>
          </span>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={restartMode}>
            Restart
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={finishOrCompleteWall}
            disabled={gameState.status !== "running"}
          >
            {isSimulation
              ? layoutMode === "mobile"
                ? "Complete Wall"
                : "Complete Wall (Space)"
              : "Finish Wall"}
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={finishRun}
            disabled={gameState.status !== "running"}
          >
            Game Over
          </button>
        </div>
      </header>
    </main>
  );
}

export default App;
