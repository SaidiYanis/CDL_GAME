"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DuelPlayerCard } from "@/src/features/game/components/duel-player-card";
import { GameDataFallback } from "@/src/features/game/components/game-data-fallback";
import { GameModeNavigation } from "@/src/features/game/components/game-mode-navigation";
import { GameOverCard } from "@/src/features/game/components/game-over-card";
import { ScoreDisplay } from "@/src/features/game/components/score-display";
import {
  getTitleDuelRoundLabel,
} from "@/src/features/game/utils/title-duel-game";
import { useGameScoreSync } from "@/src/features/scores/hooks/use-game-score-sync";
import { playGameFeedbackSound } from "@/src/lib/audio/game-feedback-sounds";
import { localScoreRepository } from "@/src/lib/data/local-score-repository";
import {
  startGameSession,
  submitGameSessionAnswer,
} from "@/src/lib/game/game-session-client";
import type { DuelAnswer, DuelGameState, Player, Team } from "@/src/types";

const DUEL_FEEDBACK_DELAY_MS = 280;

interface TitleDuelScreenProps {
  players: Player[];
  teams: Team[];
}

export function TitleDuelScreen({ players, teams }: TitleDuelScreenProps) {
  const hasLoadedLocalBestScoreRef = useRef(false);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<DuelAnswer | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<
    "correct" | "incorrect" | null
  >(null);
  const [gameState, setGameState] = useState<DuelGameState>({
    bestScore: 0,
    currentQuestion: null,
    lastCorrectAnswer: null,
    score: 0,
    status: "idle",
    usedPairKeys: [],
  });
  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const teamsByTag = useMemo(
    () => new Map(teams.map((team) => [team.tag, team])),
    [teams],
  );

  const leftPlayer = gameState.currentQuestion
    ? playersById.get(gameState.currentQuestion.leftPlayerId) ?? null
    : null;
  const rightPlayer = gameState.currentQuestion
    ? playersById.get(gameState.currentQuestion.rightPlayerId) ?? null
    : null;
  const leftTeam = leftPlayer
    ? teamsByTag.get(leftPlayer.teamTag) ?? null
    : null;
  const rightTeam = rightPlayer
    ? teamsByTag.get(rightPlayer.teamTag) ?? null
    : null;
  const isGameOver = gameState.status === "lost";

  const { syncCurrentRunLoss } = useGameScoreSync({
    bestScore: gameState.bestScore,
    modeId: "title-duel",
    score: gameState.score,
    sessionId,
    status: gameState.status,
  });

  useEffect(
    () => () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (hasLoadedLocalBestScoreRef.current) {
      return;
    }

    hasLoadedLocalBestScoreRef.current = true;
    queueMicrotask(() => {
      void startGameSession(
        "title-duel",
        localScoreRepository.getBestScore("title-duel"),
      )
        .then((payload) => {
          setSessionId(payload.sessionId);
          setGameState(payload.gameState);
        })
        .catch((error) => {
          setApiErrorMessage(
            error instanceof Error
              ? error.message
              : "Session serveur impossible.",
          );
        });
    });
  }, []);

  const handleSubmitAnswer = useCallback(
    async (answer: DuelAnswer) => {
      if (!sessionId || !gameState.currentQuestion || isSubmittingAnswer) {
        return;
      }

      setIsSubmittingAnswer(true);

      try {
        const payload = await submitGameSessionAnswer(
          "title-duel",
          sessionId,
          answer,
        );

        setSelectedAnswer(answer);
        setFeedbackStatus(
          payload.isCorrectAnswer ? "correct" : "incorrect",
        );
        playGameFeedbackSound(payload.isCorrectAnswer ? "win" : "lose");

        feedbackTimeoutRef.current = window.setTimeout(() => {
          setGameState(payload.gameState);

          if (payload.isCorrectAnswer) {
            setSelectedAnswer(null);
            setFeedbackStatus(null);
          }
        }, DUEL_FEEDBACK_DELAY_MS);
      } catch (error) {
        setApiErrorMessage(
          error instanceof Error
            ? error.message
            : "Validation serveur impossible.",
        );
      } finally {
        setIsSubmittingAnswer(false);
      }
    },
    [gameState.currentQuestion, isSubmittingAnswer, sessionId],
  );

  const handleRestartGame = useCallback(() => {
    setSelectedAnswer(null);
    setFeedbackStatus(null);
    setSessionId(null);
    setGameState((currentState) => ({
      ...currentState,
      currentQuestion: null,
      lastCorrectAnswer: null,
      score: 0,
      status: "idle",
      usedPairKeys: [],
    }));
    void startGameSession("title-duel", gameState.bestScore)
      .then((payload) => {
        setSessionId(payload.sessionId);
        setGameState(payload.gameState);
      })
      .catch((error) => {
        setApiErrorMessage(
          error instanceof Error
            ? error.message
            : "Session serveur impossible.",
        );
      });
  }, [gameState.bestScore]);

  if (apiErrorMessage) {
    return (
      <GameDataFallback
        description={apiErrorMessage}
        title="Session serveur indisponible."
      />
    );
  }

  if (gameState.status === "idle") {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-8">
          <GameModeNavigation shouldConfirmNavigation={false} />
          <ScoreDisplay bestScore={0} score={0} />

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2rem] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Duel palmares
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:mt-5 sm:text-5xl">
              Preparation du round...
            </h1>
          </section>
        </section>
      </main>
    );
  }

  if (!gameState.currentQuestion || !leftPlayer || !rightPlayer) {
    return (
      <GameDataFallback
        description="Ce mode requiert au moins deux joueurs valides dans Firestore."
        title="Pas assez de joueurs pour lancer ce duel."
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-8">
        <GameModeNavigation
          onNavigateBack={syncCurrentRunLoss}
          shouldConfirmNavigation={!isGameOver}
        />
        <ScoreDisplay
          bestScore={gameState.bestScore}
          score={gameState.score}
        />

        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-center sm:rounded-[2rem] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Duel palmares
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:mt-5 sm:text-5xl">
            Qui a le plus de titres ?
          </h1>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            {getTitleDuelRoundLabel(gameState.score)}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center sm:gap-4">
            <button
              type="button"
              disabled={
                isGameOver || isSubmittingAnswer || feedbackStatus !== null
              }
              onClick={() => handleSubmitAnswer("left")}
              className={`rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 sm:px-8 sm:py-4 sm:text-sm ${
                selectedAnswer === "left" && feedbackStatus === "correct"
                  ? "bg-emerald-400 text-slate-950"
                  : selectedAnswer === "left" &&
                      feedbackStatus === "incorrect"
                    ? "bg-rose-500 text-white"
                    : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              }`}
            >
              {leftPlayer.name}
            </button>
            <button
              type="button"
              disabled={
                isGameOver || isSubmittingAnswer || feedbackStatus !== null
              }
              onClick={() => handleSubmitAnswer("same")}
              className={`rounded-full border px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 sm:px-8 sm:py-4 sm:text-sm ${
                selectedAnswer === "same" && feedbackStatus === "correct"
                  ? "border-emerald-300/70 bg-emerald-400/15 text-emerald-100"
                  : selectedAnswer === "same" &&
                      feedbackStatus === "incorrect"
                    ? "border-rose-300/70 bg-rose-500/15 text-rose-100"
                    : "border-white/15 text-white hover:border-white/30 hover:bg-white/5"
              }`}
            >
              Same
            </button>
            <button
              type="button"
              disabled={
                isGameOver || isSubmittingAnswer || feedbackStatus !== null
              }
              onClick={() => handleSubmitAnswer("right")}
              className={`rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 sm:px-8 sm:py-4 sm:text-sm ${
                selectedAnswer === "right" && feedbackStatus === "correct"
                  ? "bg-emerald-400 text-slate-950"
                  : selectedAnswer === "right" &&
                      feedbackStatus === "incorrect"
                    ? "bg-rose-500 text-white"
                    : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              }`}
            >
              {rightPlayer.name}
            </button>
          </div>

          {isGameOver ? (
            <div className="mt-8 text-left">
              <GameOverCard
                bestScore={gameState.bestScore}
                correctAnswer={gameState.lastCorrectAnswer}
                onRestartGame={handleRestartGame}
                score={gameState.score}
              />
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <DuelPlayerCard player={leftPlayer} sideLabel="Joueur 1" team={leftTeam} />
          <DuelPlayerCard
            player={rightPlayer}
            sideLabel="Joueur 2"
            team={rightTeam}
          />
        </section>

      </section>
    </main>
  );
}
