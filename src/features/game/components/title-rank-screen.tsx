"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CountryFlagLabel } from "@/src/features/common/components/country-flag-label";
import { GameDataFallback } from "@/src/features/game/components/game-data-fallback";
import { GameModeNavigation } from "@/src/features/game/components/game-mode-navigation";
import { GameOverCard } from "@/src/features/game/components/game-over-card";
import { ScoreDisplay } from "@/src/features/game/components/score-display";
import {
  createEmptyTitleRankAssignments,
  getExpectedTitleRankAnswer,
  getTitleRankRoundLabel,
  type TitleRankAssignments,
} from "@/src/features/game/utils/title-rank-game";
import { useGameScoreSync } from "@/src/features/scores/hooks/use-game-score-sync";
import { playGameFeedbackSound } from "@/src/lib/audio/game-feedback-sounds";
import { localScoreRepository } from "@/src/lib/data/local-score-repository";
import {
  startGameSession,
  submitGameSessionAnswer,
} from "@/src/lib/game/game-session-client";
import type {
  Player,
  Team,
  TitleRankAnswer,
  TitleRankGameState,
} from "@/src/types";

const TITLE_RANK_CHOICES: Array<{
  label: string;
  value: TitleRankAnswer;
}> = [
  { label: "+", value: "higher" },
  { label: "=", value: "same" },
  { label: "-", value: "lower" },
];

interface TitleRankScreenProps {
  players: Player[];
  teams: Team[];
}

interface TitleRankSession {
  assignments: TitleRankAssignments;
  gameState: TitleRankGameState;
}

function getPlayerCardBorderColor(
  selectedAnswer: TitleRankAnswer | null,
  expectedAnswer: TitleRankAnswer,
  isGameOver: boolean,
): string {
  if (!isGameOver) {
    return selectedAnswer ? "border-emerald-300/40" : "border-white/10";
  }

  return selectedAnswer === expectedAnswer
    ? "border-emerald-300/50"
    : "border-rose-300/50";
}

export function TitleRankScreen({ players, teams }: TitleRankScreenProps) {
  const hasLoadedLocalBestScoreRef = useRef(false);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [isSubmittingRound, setIsSubmittingRound] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [{ assignments, gameState }, setSession] = useState<TitleRankSession>(
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
  const allPlayersAnswered =
    roundPlayers.length > 0 &&
    roundPlayers.every((player) => assignments[player.id] !== null);
  const isGameOver = gameState.status === "lost";

  const { syncCurrentRunLoss } = useGameScoreSync({
    bestScore: gameState.bestScore,
    modeId: "title-rank",
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
        "title-rank",
        localScoreRepository.getBestScore("title-rank"),
      )
        .then((payload) => {
          setSessionId(payload.sessionId);
          setSession({
            assignments: createEmptyTitleRankAssignments(
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

  const handleSelectAnswer = useCallback(
    (playerId: string, answer: TitleRankAnswer) => {
      setSession((currentSession) => ({
        ...currentSession,
        assignments: {
          ...currentSession.assignments,
          [playerId]: answer,
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
        "title-rank",
        sessionId,
        assignments,
      );

      playGameFeedbackSound(payload.isCorrectAnswer ? "win" : "lose");
      setSession({
        assignments:
          payload.gameState.status === "lost"
            ? assignments
            : createEmptyTitleRankAssignments(
                payload.gameState.currentQuestion,
              ),
        gameState: payload.gameState,
      });
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
    void startGameSession("title-rank", gameState.bestScore)
      .then((payload) => {
        setSessionId(payload.sessionId);
        setSession({
          assignments: createEmptyTitleRankAssignments(
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

  if (players.length < 5) {
    return (
      <GameDataFallback
        description="Ce mode requiert au moins 5 joueurs avec des donnees de titres."
        title="Pas assez de joueurs pour lancer ce mode."
      />
    );
  }

  if (
    gameState.status === "idle" ||
    !gameState.currentQuestion ||
    roundPlayers.length === 0
  ) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10">
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-8">
          <GameModeNavigation shouldConfirmNavigation={false} />
          <ScoreDisplay bestScore={0} score={0} />
          <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2rem] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Rank titres
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:mt-5 sm:text-5xl">
              Preparation du round...
            </h1>
          </section>
        </section>
      </main>
    );
  }

  const currentQuestion = gameState.currentQuestion;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-8">
        <GameModeNavigation
          onNavigateBack={syncCurrentRunLoss}
          shouldConfirmNavigation={!isGameOver}
        />
        <ScoreDisplay bestScore={gameState.bestScore} score={gameState.score} />

        <section className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2rem] sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                Title Radar
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white sm:mt-5 sm:text-5xl">
                Place les 5 joueurs face a la cible.
              </h1>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-400/10 px-6 py-4 text-center sm:rounded-[2rem] sm:px-8 sm:py-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
                Cible titres
              </p>
              <p className="mt-2 text-5xl font-black tracking-[-0.08em] text-white sm:mt-3 sm:text-7xl">
                {currentQuestion.targetTitleCount}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
            {getTitleRankRoundLabel(currentQuestion)}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:mt-4 sm:text-base sm:leading-8">
            Pour chaque joueur, choisis + s&apos;il a plus de titres que la
            cible, = s&apos;il est exactement au meme total, ou - s&apos;il en a
            moins. Une seule erreur termine la run.
          </p>

          <button
            type="button"
            disabled={!allPlayersAnswered || isGameOver || isSubmittingRound}
            onClick={handleSubmitRound}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-8 sm:px-8 sm:py-4 sm:text-sm"
          >
            Valider les 5 choix
          </button>

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
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {roundPlayers.map((player) => {
            const team = teamsByTag.get(player.teamTag) ?? null;
            const selectedAnswer = assignments[player.id] ?? null;
            const expectedAnswer = getExpectedTitleRankAnswer(
              player,
              currentQuestion,
            );

            return (
              <article
                key={player.id}
                className={`rounded-[2rem] border bg-white/5 p-4 ${getPlayerCardBorderColor(
                  selectedAnswer,
                  expectedAnswer,
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

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {TITLE_RANK_CHOICES.map((choice) => (
                    <button
                      key={`${player.id}-${choice.value}`}
                      type="button"
                      disabled={isGameOver}
                      onClick={() => handleSelectAnswer(player.id, choice.value)}
                      className={`rounded-2xl px-4 py-3 text-sm font-black uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed ${
                        selectedAnswer === choice.value
                          ? isGameOver && selectedAnswer !== expectedAnswer
                            ? "bg-rose-500 text-white"
                            : "bg-emerald-400 text-slate-950"
                          : "bg-slate-900/70 text-white hover:bg-white/10"
                      }`}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

      </section>
    </main>
  );
}
