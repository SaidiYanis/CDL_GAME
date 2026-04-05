"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameDataFallback } from "@/src/features/game/components/game-data-fallback";
import { GameModeNavigation } from "@/src/features/game/components/game-mode-navigation";
import { GameOverCard } from "@/src/features/game/components/game-over-card";
import { RoundSuccessOverlay } from "@/src/features/game/components/round-success-overlay";
import { ScoreDisplay } from "@/src/features/game/components/score-display";
import { CountryFlagLabel } from "@/src/features/common/components/country-flag-label";
import { useAutoScrollOnRoundChange } from "@/src/features/game/hooks/use-auto-scroll-on-round-change";
import {
  createEmptyRoleAssignments,
  type RoleAssignments,
} from "@/src/features/game/utils/role-sort-game";
import { useGameScoreSync } from "@/src/features/scores/hooks/use-game-score-sync";
import { playGameFeedbackSound } from "@/src/lib/audio/game-feedback-sounds";
import { localScoreRepository } from "@/src/lib/data/local-score-repository";
import {
  startGameSession,
  submitGameSessionAnswer,
} from "@/src/lib/game/game-session-client";
import type { Player, PlayerRole, RoleSortGameState, Team } from "@/src/types";

const ROLE_CHOICES: PlayerRole[] = ["AR", "SMG"];
const ROUND_SUCCESS_DELAY_MS = 500;

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
  const feedbackTimeoutRef = useRef<number | null>(null);
  const headingRef = useRef<HTMLElement | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<"correct" | null>(null);
  const [isSubmittingRound, setIsSubmittingRound] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [{ assignments, gameState }, setSession] = useState<RoleSortSession>(
    () => ({
      assignments: {},
      gameState: {
        bestScore: 0,
        currentQuestion: null,
        lastCorrectAnswer: null,
        score: 0,
        status: "idle",
      },
    }),
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
  const roleRoundKey = gameState.currentQuestion
    ? `${gameState.currentQuestion.playerIds.join("__")}-${gameState.score}`
    : "idle";

  useAutoScrollOnRoundChange(headingRef, roleRoundKey);

  const { syncCurrentRunLoss } = useGameScoreSync({
    bestScore: gameState.bestScore,
    modeId: "role-sort",
    score: gameState.score,
    sessionId,
    status: gameState.status,
  });

  useEffect(() => {
    if (hasLoadedLocalBestScoreRef.current) {
      return;
    }

    hasLoadedLocalBestScoreRef.current = true;
    queueMicrotask(() => {
      void startGameSession(
        "role-sort",
        localScoreRepository.getBestScore("role-sort"),
      )
        .then((payload) => {
          setSessionId(payload.sessionId);
          setSession({
            assignments: createEmptyRoleAssignments(
              payload.gameState.currentQuestion,
            ),
            gameState: payload.gameState,
          });
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

  useEffect(
    () => () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    },
    [],
  );

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

  const handleSubmitRound = useCallback(async () => {
    if (!sessionId || isSubmittingRound) {
      return;
    }

    setIsSubmittingRound(true);

    try {
      const payload = await submitGameSessionAnswer(
        "role-sort",
        sessionId,
        assignments,
      );

      playGameFeedbackSound(payload.isCorrectAnswer ? "win" : "lose");

      if (!payload.isCorrectAnswer) {
        setSession({
          assignments,
          gameState: payload.gameState,
        });
        return;
      }

      setFeedbackStatus("correct");

      feedbackTimeoutRef.current = window.setTimeout(() => {
        setSession({
          assignments: createEmptyRoleAssignments(
            payload.gameState.currentQuestion,
          ),
          gameState: payload.gameState,
        });
        setFeedbackStatus(null);
      }, ROUND_SUCCESS_DELAY_MS);
    } catch (error) {
      setApiErrorMessage(
        error instanceof Error
          ? error.message
          : "Validation serveur impossible.",
      );
    } finally {
      setIsSubmittingRound(false);
    }
  }, [assignments, isSubmittingRound, sessionId]);

  const handleRestartGame = useCallback(() => {
    setFeedbackStatus(null);
    setSession((currentSession) => ({
      assignments: {},
      gameState: {
        ...currentSession.gameState,
        currentQuestion: null,
        lastCorrectAnswer: null,
        score: 0,
        status: "idle",
      },
    }));
    setSessionId(null);
    void startGameSession("role-sort", gameState.bestScore)
      .then((payload) => {
        setSessionId(payload.sessionId);
        setSession({
          assignments: createEmptyRoleAssignments(
            payload.gameState.currentQuestion,
          ),
          gameState: payload.gameState,
        });
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
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-8">
          <GameModeNavigation shouldConfirmNavigation={false} />
          <ScoreDisplay bestScore={0} score={0} />

          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2rem] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Tri AR / SMG
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:mt-5 sm:text-5xl">
              Preparation du round...
            </h1>
          </section>
        </section>
      </main>
    );
  }

  if (!gameState.currentQuestion || roundPlayers.length === 0) {
    return (
      <GameDataFallback
        description="Ce mode requiert au moins 5 joueurs dont le role est AR ou SMG."
        title="Pas assez de joueurs avec un role AR/SMG renseigne."
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10">
      <RoundSuccessOverlay isVisible={feedbackStatus === "correct"} />
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-8">
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
          className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2rem] sm:p-8"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Tri AR / SMG
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:mt-5 sm:text-5xl">
            Classe les 5 joueurs par role.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:mt-4 sm:text-base sm:leading-8">
            Assigne chaque joueur en AR ou SMG, puis valide le round. Une seule
            erreur termine la run.
          </p>

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

          <button
            type="button"
            disabled={!allPlayersSorted || isGameOver || isSubmittingRound}
            onClick={handleSubmitRound}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-8 sm:px-8 sm:py-4 sm:text-sm"
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
                      {team?.tag ?? player.teamTag} /{" "}
                      <CountryFlagLabel country={player.country} />
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {ROLE_CHOICES.map((roleChoice) => (
                    <button
                      key={`${player.id}-${roleChoice}`}
                      type="button"
                      disabled={
                        isGameOver ||
                        isSubmittingRound ||
                        feedbackStatus === "correct"
                      }
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

      </section>
    </main>
  );
}
