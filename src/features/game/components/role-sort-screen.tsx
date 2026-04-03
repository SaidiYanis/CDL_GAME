"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameDataFallback } from "@/src/features/game/components/game-data-fallback";
import { GameModeNavigation } from "@/src/features/game/components/game-mode-navigation";
import { GameOverCard } from "@/src/features/game/components/game-over-card";
import { ScoreDisplay } from "@/src/features/game/components/score-display";
import {
  createEmptyRoleAssignments,
  startRoleSortGame,
  submitRoleSortRound,
  type RoleAssignments,
} from "@/src/features/game/utils/role-sort-game";
import { useGameScoreSync } from "@/src/features/scores/hooks/use-game-score-sync";
import { playGameFeedbackSound } from "@/src/lib/audio/game-feedback-sounds";
import { localScoreRepository } from "@/src/lib/data/local-score-repository";
import type { Player, PlayerRole, RoleSortGameState, Team } from "@/src/types";

const ROLE_CHOICES: PlayerRole[] = ["AR", "SMG"];

interface RoleSortScreenProps {
  players: Player[];
  teams: Team[];
}

interface RoleSortSession {
  assignments: RoleAssignments;
  gameState: RoleSortGameState;
}

function getCardBorderColor(
  selectedRole: PlayerRole | null,
  expectedRole: PlayerRole | null,
  isGameOver: boolean,
): string {
  if (!isGameOver) {
    return selectedRole ? "border-emerald-300/40" : "border-white/10";
  }

  return selectedRole === expectedRole
    ? "border-emerald-300/50"
    : "border-rose-300/50";
}

export function RoleSortScreen({ players, teams }: RoleSortScreenProps) {
  const hasLoadedLocalBestScoreRef = useRef(false);
  const [{ assignments, gameState }, setSession] = useState<RoleSortSession>(
    () => {
      const initialGameState = startRoleSortGame(players, 0);

      return {
        assignments: createEmptyRoleAssignments(
          initialGameState.currentQuestion,
        ),
        gameState: initialGameState,
      };
    },
  );
  const playersById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const teamsByTag = useMemo(
    () => new Map(teams.map((team) => [team.tag, team])),
    [teams],
  );
  const roundPlayers = useMemo(
    () =>
      gameState.currentQuestion?.playerIds
        .map((playerId) => playersById.get(playerId))
        .filter((player): player is Player => player !== undefined) ?? [],
    [gameState.currentQuestion?.playerIds, playersById],
  );
  const allPlayersSorted = roundPlayers.every(
    (player) => assignments[player.id] !== null,
  );
  const isGameOver = gameState.status === "lost";

  const { syncCurrentRunLoss } = useGameScoreSync({
    bestScore: gameState.bestScore,
    modeId: "role-sort",
    score: gameState.score,
    status: gameState.status,
  });

  useEffect(() => {
    if (hasLoadedLocalBestScoreRef.current) {
      return;
    }

    hasLoadedLocalBestScoreRef.current = true;
    queueMicrotask(() => {
      setSession((currentSession) => {
        if (
          currentSession.gameState.score !== 0 ||
          currentSession.gameState.status !== "playing"
        ) {
          return currentSession;
        }

        const nextGameState = startRoleSortGame(
          players,
          localScoreRepository.getBestScore("role-sort"),
        );

        return {
          assignments: createEmptyRoleAssignments(
            nextGameState.currentQuestion,
          ),
          gameState: nextGameState,
        };
      });
    });
  }, [players]);

  const handleSelectRole = useCallback(
    (playerId: string, role: PlayerRole) => {
      setSession((currentSession) => ({
        ...currentSession,
        assignments: {
          ...currentSession.assignments,
          [playerId]: role,
        },
      }));
    },
    [],
  );

  const handleSubmitRound = useCallback(() => {
    const nextGameState = submitRoleSortRound(gameState, players, assignments);

    playGameFeedbackSound(nextGameState.status === "lost" ? "lose" : "win");

    setSession({
      assignments: createEmptyRoleAssignments(nextGameState.currentQuestion),
      gameState: nextGameState,
    });
  }, [assignments, gameState, players]);

  const handleRestartGame = useCallback(() => {
    setSession((currentSession) => {
      const nextGameState = startRoleSortGame(
        players,
        currentSession.gameState.bestScore,
      );

      return {
        assignments: createEmptyRoleAssignments(nextGameState.currentQuestion),
        gameState: nextGameState,
      };
    });
  }, [players]);

  if (!gameState.currentQuestion || roundPlayers.length === 0) {
    return (
      <GameDataFallback
        description="Ce mode requiert au moins 10 joueurs dont le role est AR ou SMG."
        title="Pas assez de joueurs avec un role AR/SMG renseigne."
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <GameModeNavigation
          onNavigateBack={syncCurrentRunLoss}
          shouldConfirmNavigation={!isGameOver}
        />
        <ScoreDisplay
          bestScore={gameState.bestScore}
          score={gameState.score}
        />

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Tri AR / SMG
          </p>
          <h1 className="mt-5 text-5xl font-black tracking-[-0.04em] text-white">
            Classe les 10 joueurs par role.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">
            Assigne chaque joueur en AR ou SMG, puis valide le round. Une seule
            erreur termine la run.
          </p>

          <button
            type="button"
            disabled={!allPlayersSorted || isGameOver}
            onClick={handleSubmitRound}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-emerald-400 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Valider le tri
          </button>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {roundPlayers.map((player) => {
            const team = teamsByTag.get(player.teamTag) ?? null;
            const selectedRole = assignments[player.id] ?? null;

            return (
              <article
                key={player.id}
                className={`rounded-[2rem] border bg-white/5 p-4 ${getCardBorderColor(
                  selectedRole,
                  player.role,
                  isGameOver,
                )}`}
              >
                <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-slate-900">
                  <Image
                    src={player.imageUrl}
                    alt={`Portrait de ${player.name}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 240px"
                    className="object-contain"
                    unoptimized
                  />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  {team?.logoUrl ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white/5">
                      <Image
                        src={team.logoUrl}
                        alt={`Logo ${team.name}`}
                        fill
                        sizes="40px"
                        className="object-contain p-1.5"
                        unoptimized
                      />
                    </div>
                  ) : null}

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black tracking-[-0.04em] text-white">
                      {player.name}
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {team?.tag ?? player.teamTag} / {player.country ?? "--"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {ROLE_CHOICES.map((roleChoice) => (
                    <button
                      key={`${player.id}-${roleChoice}`}
                      type="button"
                      disabled={isGameOver}
                      onClick={() => handleSelectRole(player.id, roleChoice)}
                      className={`rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed ${
                        selectedRole === roleChoice
                          ? "bg-emerald-400 text-slate-950"
                          : "bg-slate-900/70 text-white hover:bg-white/10"
                      }`}
                    >
                      {roleChoice}
                    </button>
                  ))}
                </div>

                {isGameOver ? (
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Reponse: {player.role}
                  </p>
                ) : null}
              </article>
            );
          })}
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
