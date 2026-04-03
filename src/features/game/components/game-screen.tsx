"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnswerInput } from "@/src/features/game/components/answer-input";
import { AnswerOptions } from "@/src/features/game/components/answer-options";
import { GameDataFallback } from "@/src/features/game/components/game-data-fallback";
import { GameModeNavigation } from "@/src/features/game/components/game-mode-navigation";
import { GameOverCard } from "@/src/features/game/components/game-over-card";
import { PlayerCard } from "@/src/features/game/components/player-card";
import { RoundSuccessOverlay } from "@/src/features/game/components/round-success-overlay";
import { ScoreDisplay } from "@/src/features/game/components/score-display";
import { useGameScoreSync } from "@/src/features/scores/hooks/use-game-score-sync";
import { localScoreRepository } from "@/src/lib/data/local-score-repository";
import { playGameFeedbackSound } from "@/src/lib/audio/game-feedback-sounds";
import {
  startGameSession,
  submitGameSessionAnswer,
} from "@/src/lib/game/game-session-client";
import { SCORE_FOR_TEAM_HINT } from "@/src/features/game/constants/game-rules";
import type { GameState, Player, Team } from "@/src/types";

const ANSWER_FEEDBACK_DELAY_MS = 500;

interface GameScreenProps {
  players: Player[];
  teams: Team[];
}

export function GameScreen({ players, teams }: GameScreenProps) {
  const hasLoadedLocalBestScoreRef = useRef(false);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<
    "correct" | "incorrect" | null
  >(null);
  const [gameState, setGameState] = useState<GameState>({
    bestScore: 0,
    currentQuestion: null,
    lastCorrectAnswer: null,
    score: 0,
    status: "idle",
    usedPlayerIds: [],
  });
  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const teamsByTag = useMemo(
    () => new Map(teams.map((team) => [team.tag, team])),
    [teams],
  );

  const { syncCurrentRunLoss } = useGameScoreSync({
    bestScore: gameState.bestScore,
    modeId: "guess-player",
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
        "guess-player",
        localScoreRepository.getBestScore("guess-player"),
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
    async (answer: string) => {
      if (!sessionId || !gameState.currentQuestion || isSubmittingAnswer) {
        return;
      }

      setIsSubmittingAnswer(true);

      try {
        const submittedQuestionMode = gameState.currentQuestion.mode;
        const payload = await submitGameSessionAnswer(
          "guess-player",
          sessionId,
          answer,
        );

        playGameFeedbackSound(payload.isCorrectAnswer ? "win" : "lose");

        if (submittedQuestionMode === "free-input") {
          if (!payload.isCorrectAnswer) {
            setGameState(payload.gameState);
            return;
          }

          setFeedbackStatus("correct");

          feedbackTimeoutRef.current = window.setTimeout(() => {
            setGameState(payload.gameState);
            setFeedbackStatus(null);
          }, ANSWER_FEEDBACK_DELAY_MS);

          return;
        }

        setSelectedAnswer(answer);
        setFeedbackStatus(
          payload.isCorrectAnswer ? "correct" : "incorrect",
        );

        feedbackTimeoutRef.current = window.setTimeout(() => {
          setGameState(payload.gameState);

          if (payload.isCorrectAnswer) {
            setSelectedAnswer(null);
            setFeedbackStatus(null);
          }
        }, ANSWER_FEEDBACK_DELAY_MS);
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

  function handleRestartGame() {
    setSelectedAnswer(null);
    setFeedbackStatus(null);
    setSessionId(null);
    setGameState((currentState) => ({
      ...currentState,
      currentQuestion: null,
      lastCorrectAnswer: null,
      score: 0,
      status: "idle",
      usedPlayerIds: [],
    }));
    void startGameSession("guess-player", gameState.bestScore)
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
  }

  const currentPlayer = gameState.currentQuestion
    ? playersById.get(gameState.currentQuestion.playerId) ?? null
    : null;
  const currentTeam = currentPlayer
    ? teamsByTag.get(currentPlayer.teamTag) ?? null
    : null;

  if (apiErrorMessage) {
    return (
      <GameDataFallback
        description={apiErrorMessage}
        title="Session serveur indisponible."
      />
    );
  }

  if (players.length === 0) {
    return (
      <GameDataFallback
        description="Verifie que Firestore contient des joueurs valides avec un nom, une image et un tag d'equipe."
        title="Aucun joueur charge."
      />
    );
  }

  if (
    gameState.status === "idle" ||
    !gameState.currentQuestion ||
    !currentPlayer
  ) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
          <GameModeNavigation shouldConfirmNavigation={false} />
          <ScoreDisplay bestScore={0} score={0} />

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2rem] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Devine le joueur
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:mt-5 sm:text-4xl">
              Preparation de la run...
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:mt-4 sm:text-base sm:leading-8">
              Chargement d&apos;une premiere question aleatoire.
            </p>
          </section>
        </section>
      </main>
    );
  }

  const { currentQuestion, status } = gameState;
  const isGameOver = status === "lost";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10">
      <RoundSuccessOverlay isVisible={feedbackStatus === "correct"} />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-6">
        <GameModeNavigation
          onNavigateBack={syncCurrentRunLoss}
          shouldConfirmNavigation={!isGameOver}
        />

        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <PlayerCard
            player={currentPlayer}
            revealTeam={gameState.score >= SCORE_FOR_TEAM_HINT}
            score={gameState.score}
            team={currentTeam}
          />

          <div className="flex flex-col gap-6">
          <ScoreDisplay
            bestScore={gameState.bestScore}
            score={gameState.score}
          />

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2rem] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Devine le joueur
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:mt-5 sm:text-4xl">
              Qui est sur la photo ?
            </h1>

            {isGameOver ? (
              <div className="mt-8">
                <GameOverCard
                  bestScore={gameState.bestScore}
                  correctAnswer={gameState.lastCorrectAnswer}
                  onRestartGame={handleRestartGame}
                  score={gameState.score}
                />
              </div>
            ) : null}

            <div className="mt-8">
              {currentQuestion.mode === "free-input" ? (
                <AnswerInput
                  disabled={isGameOver || isSubmittingAnswer}
                  onSubmitAnswer={handleSubmitAnswer}
                  playerId={currentQuestion.playerId}
                />
              ) : (
                <AnswerOptions
                  disabled={
                    isGameOver ||
                    isSubmittingAnswer ||
                    feedbackStatus !== null
                  }
                  feedbackStatus={feedbackStatus}
                  onSelectAnswer={handleSubmitAnswer}
                  options={currentQuestion.options}
                  selectedAnswer={selectedAnswer}
                />
              )}
            </div>

          </section>
          </div>
        </div>
      </section>
    </main>
  );
}
