"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnswerInput } from "@/src/features/game/components/answer-input";
import { AnswerOptions } from "@/src/features/game/components/answer-options";
import { GameDataFallback } from "@/src/features/game/components/game-data-fallback";
import { GameModeNavigation } from "@/src/features/game/components/game-mode-navigation";
import { GameOverCard } from "@/src/features/game/components/game-over-card";
import { PlayerCard } from "@/src/features/game/components/player-card";
import { ScoreDisplay } from "@/src/features/game/components/score-display";
import { useGameScoreSync } from "@/src/features/scores/hooks/use-game-score-sync";
import {
  startSurvivalGame,
  submitSurvivalAnswer,
} from "@/src/features/game/utils/survival-game";
import { localScoreRepository } from "@/src/lib/data/local-score-repository";
import { playGameFeedbackSound } from "@/src/lib/audio/game-feedback-sounds";
import { normalizeAnswer } from "@/src/lib/utils/normalize-answer";
import type { GameState, Player, Team } from "@/src/types";

const ANSWER_FEEDBACK_DELAY_MS = 280;

interface GameScreenProps {
  players: Player[];
  teams: Team[];
}

export function GameScreen({ players, teams }: GameScreenProps) {
  const hasLoadedLocalBestScoreRef = useRef(false);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<
    "correct" | "incorrect" | null
  >(null);
  const [gameState, setGameState] = useState<GameState>(() =>
    startSurvivalGame(players, 0),
  );
  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const teamsByTag = useMemo(
    () => new Map(teams.map((team) => [team.tag, team])),
    [teams],
  );

  useGameScoreSync({
    bestScore: gameState.bestScore,
    modeId: "guess-player",
    score: gameState.score,
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
      setGameState((currentState) =>
        currentState.score === 0 && currentState.status === "playing"
          ? startSurvivalGame(
              players,
              localScoreRepository.getBestScore("guess-player"),
            )
          : currentState,
      );
    });
  }, [players]);

  const handleSubmitAnswer = useCallback(
    (answer: string) => {
      if (!gameState.currentQuestion || feedbackStatus) {
        return;
      }

      const isCorrectAnswer =
        normalizeAnswer(answer) ===
        normalizeAnswer(gameState.currentQuestion.correctAnswer);

      playGameFeedbackSound(isCorrectAnswer ? "win" : "lose");

      if (gameState.currentQuestion.mode === "free-input") {
        setGameState((currentState) =>
          submitSurvivalAnswer(currentState, players, answer),
        );
        return;
      }

      setSelectedAnswer(answer);
      setFeedbackStatus(isCorrectAnswer ? "correct" : "incorrect");

      feedbackTimeoutRef.current = window.setTimeout(() => {
        setGameState((currentState) =>
          submitSurvivalAnswer(currentState, players, answer),
        );

        if (isCorrectAnswer) {
          setSelectedAnswer(null);
          setFeedbackStatus(null);
        }
      }, ANSWER_FEEDBACK_DELAY_MS);
    },
    [feedbackStatus, gameState.currentQuestion, players],
  );

  function handleRestartGame() {
    setSelectedAnswer(null);
    setFeedbackStatus(null);
    setGameState(startSurvivalGame(players, gameState.bestScore));
  }

  const currentPlayer = gameState.currentQuestion
    ? playersById.get(gameState.currentQuestion.playerId) ?? null
    : null;
  const currentTeam = currentPlayer
    ? teamsByTag.get(currentPlayer.teamTag) ?? null
    : null;

  if (players.length === 0 || !gameState.currentQuestion || !currentPlayer) {
    return (
      <GameDataFallback
        description="Verifie que le JSON local contient des joueurs valides avec un nom, une image et un tag d'equipe."
        title="Aucun joueur charge."
      />
    );
  }

  const { currentQuestion, status } = gameState;
  const isGameOver = status === "lost";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <GameModeNavigation />

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <PlayerCard
            player={currentPlayer}
            score={gameState.score}
            team={currentTeam}
          />

          <div className="flex flex-col gap-6">
          <ScoreDisplay
            bestScore={gameState.bestScore}
            score={gameState.score}
          />

          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Devine le joueur
            </p>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-white">
              Qui est sur la photo ?
            </h1>

            <div className="mt-8">
              {currentQuestion.mode === "free-input" ? (
                <AnswerInput
                  disabled={isGameOver || feedbackStatus !== null}
                  onSubmitAnswer={handleSubmitAnswer}
                  playerId={currentQuestion.playerId}
                />
              ) : (
                <AnswerOptions
                  disabled={isGameOver || feedbackStatus !== null}
                  feedbackStatus={feedbackStatus}
                  onSelectAnswer={handleSubmitAnswer}
                  options={currentQuestion.options}
                  selectedAnswer={selectedAnswer}
                />
              )}
            </div>
          </section>

          {isGameOver ? (
            <GameOverCard
              bestScore={gameState.bestScore}
              correctAnswer={gameState.lastCorrectAnswer}
              onRestartGame={handleRestartGame}
              score={gameState.score}
            />
          ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
