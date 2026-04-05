"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DuelPlayerCard } from "@/src/features/game/components/duel-player-card";
import { GameDataFallback } from "@/src/features/game/components/game-data-fallback";
import { GameModeNavigation } from "@/src/features/game/components/game-mode-navigation";
import { GameOverCard } from "@/src/features/game/components/game-over-card";
import { RoundContextBanner } from "@/src/features/game/components/round-context-banner";
import { RoundSuccessOverlay } from "@/src/features/game/components/round-success-overlay";
import { ScoreDisplay } from "@/src/features/game/components/score-display";
import { useAutoScrollOnRoundChange } from "@/src/features/game/hooks/use-auto-scroll-on-round-change";
import { useGameScoreSync } from "@/src/features/scores/hooks/use-game-score-sync";
import { localScoreRepository } from "@/src/lib/data/local-score-repository";
import { playGameFeedbackSound } from "@/src/lib/audio/game-feedback-sounds";
import {
  startGameSession,
  submitGameSessionAnswer,
} from "@/src/lib/game/game-session-client";
import type { DuelAnswer, DuelGameState, Player, Team } from "@/src/types";

const DUEL_FEEDBACK_DELAY_MS = 500;

interface AgeDuelScreenProps {
  players: Player[];
  teams: Team[];
}

export function AgeDuelScreen({ players, teams }: AgeDuelScreenProps) {
  const hasLoadedLocalBestScoreRef = useRef(false);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const headingRef = useRef<HTMLElement | null>(null);
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
  const ageRoundKey = gameState.currentQuestion
    ? `${gameState.currentQuestion.prompt}-${gameState.currentQuestion.leftPlayerId}-${gameState.currentQuestion.rightPlayerId}-${gameState.score}`
    : "idle";

  useAutoScrollOnRoundChange(headingRef, ageRoundKey);

  const { syncCurrentRunLoss } = useGameScoreSync({
    bestScore: gameState.bestScore,
    modeId: "age-duel",
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
        "age-duel",
        localScoreRepository.getBestScore("age-duel"),
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
          "age-duel",
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
    void startGameSession("age-duel", gameState.bestScore)
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
              Duel d&apos;age
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
        description="Ce mode requiert au moins deux joueurs avec une vraie date de naissance exploitable."
        title="Pas assez de joueurs avec une date de naissance valide."
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10">
      <RoundSuccessOverlay isVisible={feedbackStatus === "correct"} />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-8">
        <GameModeNavigation
          onNavigateBack={syncCurrentRunLoss}
          shouldConfirmNavigation={!isGameOver}
        />
        <ScoreDisplay
          bestScore={gameState.bestScore}
          score={gameState.score}
        />

        <section
          ref={headingRef}
          className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-center sm:rounded-[2rem] sm:p-8"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Duel d&apos;age
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:mt-5 sm:text-5xl">
            Duel d&apos;age sans ambiguite.
          </h1>
          <RoundContextBanner
            emphasis={
              gameState.currentQuestion.prompt === "Plus jeune"
                ? "Objectif actuel : plus jeune"
                : "Objectif actuel : plus vieux"
            }
            label={
              gameState.currentQuestion.prompt === "Plus jeune"
                ? "Choisis le joueur ne le plus recemment parmi les deux."
                : "Choisis le joueur ne le moins recemment parmi les deux."
            }
            tone={
              gameState.currentQuestion.prompt === "Plus jeune"
                ? "sky"
                : "amber"
            }
          />

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
                  : selectedAnswer === "left" && feedbackStatus === "incorrect"
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
