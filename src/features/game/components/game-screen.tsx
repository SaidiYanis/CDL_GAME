"use client";

import { useEffect, useMemo, useState } from "react";
import { AnswerInput } from "@/src/features/game/components/answer-input";
import { AnswerOptions } from "@/src/features/game/components/answer-options";
import { GameDataFallback } from "@/src/features/game/components/game-data-fallback";
import { GameOverCard } from "@/src/features/game/components/game-over-card";
import { PlayerCard } from "@/src/features/game/components/player-card";
import { ScoreDisplay } from "@/src/features/game/components/score-display";
import {
  startSurvivalGame,
  submitSurvivalAnswer,
} from "@/src/features/game/utils/survival-game";
import type { GameState, Player, Team } from "@/src/types";

const BEST_SCORE_STORAGE_KEY = "cdl-survival-best-score";

interface GameScreenProps {
  players: Player[];
  teams: Team[];
}

function readStoredBestScore(): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const storedValue = window.localStorage.getItem(BEST_SCORE_STORAGE_KEY);
  const parsedScore = Number(storedValue);

  return Number.isFinite(parsedScore) ? parsedScore : 0;
}

export function GameScreen({ players, teams }: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState>(() =>
    startSurvivalGame(players, readStoredBestScore()),
  );
  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const teamsByTag = useMemo(
    () => new Map(teams.map((team) => [team.tag, team])),
    [teams],
  );

  useEffect(() => {
    window.localStorage.setItem(
      BEST_SCORE_STORAGE_KEY,
      String(gameState.bestScore),
    );
  }, [gameState.bestScore]);

  function handleSubmitAnswer(answer: string) {
    setGameState((currentState) =>
      submitSurvivalAnswer(currentState, players, answer),
    );
  }

  function handleRestartGame() {
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
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
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
                  disabled={isGameOver}
                  onSubmitAnswer={handleSubmitAnswer}
                  playerId={currentQuestion.playerId}
                />
              ) : (
                <AnswerOptions
                  disabled={isGameOver}
                  onSelectAnswer={handleSubmitAnswer}
                  options={currentQuestion.options}
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
      </section>
    </main>
  );
}
