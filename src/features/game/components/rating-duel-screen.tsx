"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DuelPlayerCard } from "@/src/features/game/components/duel-player-card";
import { GameDataFallback } from "@/src/features/game/components/game-data-fallback";
import { GameOverCard } from "@/src/features/game/components/game-over-card";
import { ScoreDisplay } from "@/src/features/game/components/score-display";
import {
  startRatingDuelGame,
  submitRatingDuelAnswer,
} from "@/src/features/game/utils/rating-duel-game";
import type { DuelAnswer, DuelGameState, Player, Team } from "@/src/types";

const RATING_DUEL_BEST_SCORE_KEY = "cdl-rating-duel-best-score";

interface RatingDuelScreenProps {
  players: Player[];
  teams: Team[];
}

function readStoredBestScore(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const storedValue = window.localStorage.getItem(RATING_DUEL_BEST_SCORE_KEY);
  const parsedScore = Number(storedValue);

  return Number.isFinite(parsedScore) ? parsedScore : 0;
}

export function RatingDuelScreen({ players, teams }: RatingDuelScreenProps) {
  const [gameState, setGameState] = useState<DuelGameState>(() =>
    startRatingDuelGame(players, readStoredBestScore()),
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

  useEffect(() => {
    window.localStorage.setItem(
      RATING_DUEL_BEST_SCORE_KEY,
      String(gameState.bestScore),
    );
  }, [gameState.bestScore]);

  const handleSubmitAnswer = useCallback(
    (answer: DuelAnswer) => {
      setGameState((currentState) =>
        submitRatingDuelAnswer(currentState, players, answer),
      );
    },
    [players],
  );

  const handleRestartGame = useCallback(() => {
    setGameState(startRatingDuelGame(players, gameState.bestScore));
  }, [gameState.bestScore, players]);

  if (!gameState.currentQuestion || !leftPlayer || !rightPlayer) {
    return (
      <GameDataFallback
        description="Ce mode requiert au moins deux joueurs avec une note BP valide entre 0 et 99."
        title="Pas assez de joueurs notes pour lancer ce duel."
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <ScoreDisplay
          bestScore={gameState.bestScore}
          score={gameState.score}
        />

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Duel note BP
          </p>
          <h1 className="mt-5 text-5xl font-black tracking-[-0.04em] text-white">
            Qui a la meilleure note ?
          </h1>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              disabled={isGameOver}
              onClick={() => handleSubmitAnswer("left")}
              className="rounded-full bg-emerald-400 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {leftPlayer.name}
            </button>
            <button
              type="button"
              disabled={isGameOver}
              onClick={() => handleSubmitAnswer("same")}
              className="rounded-full border border-white/15 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Same
            </button>
            <button
              type="button"
              disabled={isGameOver}
              onClick={() => handleSubmitAnswer("right")}
              className="rounded-full bg-emerald-400 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
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
