"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DuelPlayerCard } from "@/src/features/game/components/duel-player-card";
import { GameDataFallback } from "@/src/features/game/components/game-data-fallback";
import { GameModeNavigation } from "@/src/features/game/components/game-mode-navigation";
import { GameOverCard } from "@/src/features/game/components/game-over-card";
import { ScoreDisplay } from "@/src/features/game/components/score-display";
import {
  startTitleDuelGame,
  submitTitleDuelAnswer,
} from "@/src/features/game/utils/title-duel-game";
import { useGameScoreSync } from "@/src/features/scores/hooks/use-game-score-sync";
import { playGameFeedbackSound } from "@/src/lib/audio/game-feedback-sounds";
import { localScoreRepository } from "@/src/lib/data/local-score-repository";
import type { DuelAnswer, DuelGameState, Player, Team } from "@/src/types";

const DUEL_FEEDBACK_DELAY_MS = 280;

interface TitleDuelScreenProps {
  players: Player[];
  teams: Team[];
}

export function TitleDuelScreen({ players, teams }: TitleDuelScreenProps) {
  const hasLoadedLocalBestScoreRef = useRef(false);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<DuelAnswer | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<
    "correct" | "incorrect" | null
  >(null);
  const [gameState, setGameState] = useState<DuelGameState>(() =>
    startTitleDuelGame(players, 0),
  );
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
          ? startTitleDuelGame(
              players,
              localScoreRepository.getBestScore("title-duel"),
            )
          : currentState,
      );
    });
  }, [players]);

  const handleSubmitAnswer = useCallback(
    (answer: DuelAnswer) => {
      if (!gameState.currentQuestion || feedbackStatus) {
        return;
      }

      const isCorrectAnswer =
        answer === gameState.currentQuestion.correctAnswer;

      setSelectedAnswer(answer);
      setFeedbackStatus(isCorrectAnswer ? "correct" : "incorrect");
      playGameFeedbackSound(isCorrectAnswer ? "win" : "lose");

      feedbackTimeoutRef.current = window.setTimeout(() => {
        setGameState((currentState) =>
          submitTitleDuelAnswer(currentState, players, answer),
        );

        if (isCorrectAnswer) {
          setSelectedAnswer(null);
          setFeedbackStatus(null);
        }
      }, DUEL_FEEDBACK_DELAY_MS);
    },
    [feedbackStatus, gameState.currentQuestion, players],
  );

  const handleRestartGame = useCallback(() => {
    setSelectedAnswer(null);
    setFeedbackStatus(null);
    setGameState(startTitleDuelGame(players, gameState.bestScore));
  }, [gameState.bestScore, players]);

  if (!gameState.currentQuestion || !leftPlayer || !rightPlayer) {
    return (
      <GameDataFallback
        description="Ce mode requiert au moins deux joueurs valides dans la source locale."
        title="Pas assez de joueurs pour lancer ce duel."
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <GameModeNavigation
          onNavigateBack={syncCurrentRunLoss}
          shouldConfirmNavigation={!isGameOver}
        />
        <ScoreDisplay
          bestScore={gameState.bestScore}
          score={gameState.score}
        />

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Duel palmares
          </p>
          <h1 className="mt-5 text-5xl font-black tracking-[-0.04em] text-white">
            Qui a le plus de titres ?
          </h1>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              disabled={isGameOver || feedbackStatus !== null}
              onClick={() => handleSubmitAnswer("left")}
              className={`rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
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
              disabled={isGameOver || feedbackStatus !== null}
              onClick={() => handleSubmitAnswer("same")}
              className={`rounded-full border px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
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
              disabled={isGameOver || feedbackStatus !== null}
              onClick={() => handleSubmitAnswer("right")}
              className={`rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
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

        {isGameOver ? (
          <GameOverCard
            bestScore={gameState.bestScore}
            correctAnswer={gameState.lastCorrectAnswer}
            onRestartGame={handleRestartGame}
            score={gameState.score}
          />
        ) : null}
      </section>
    </main>
  );
}
