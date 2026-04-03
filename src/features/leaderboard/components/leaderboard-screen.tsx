"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GoogleAuthCard } from "@/src/features/auth/components/google-auth-card";
import { useGoogleAuthSession } from "@/src/features/auth/hooks/use-google-auth-session";
import { GAME_MODES } from "@/src/features/modes/constants/game-modes";
import { firestoreScoreRepository } from "@/src/lib/data/firebase-score-repository";
import type { GameModeId, LeaderboardDocument, LeaderboardEntry } from "@/src/types";

type LeaderboardsByMode = Partial<Record<GameModeId, LeaderboardDocument>>;

function renderRankLabel(rank: number): string {
  return rank <= 3 ? ["#1", "#2", "#3"][rank - 1] ?? `#${rank}` : `#${rank}`;
}

function getPodiumCardClassName(rank: number): string {
  if (rank === 1) {
    return "border-emerald-300/30 bg-emerald-400/10";
  }

  if (rank === 2) {
    return "border-slate-300/20 bg-white/8";
  }

  return "border-amber-300/20 bg-amber-300/5";
}

export function LeaderboardScreen() {
  const { authState } = useGoogleAuthSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardsByMode, setLeaderboardsByMode] =
    useState<LeaderboardsByMode>({});
  const [selectedModeId, setSelectedModeId] =
    useState<GameModeId>("guess-player");

  const selectedMode = useMemo(
    () =>
      GAME_MODES.find((gameMode) => gameMode.id === selectedModeId) ??
      GAME_MODES[0],
    [selectedModeId],
  );
  const selectedLeaderboard = leaderboardsByMode[selectedModeId];
  const podiumEntries = useMemo(
    () => selectedLeaderboard?.entries.slice(0, 3) ?? [],
    [selectedLeaderboard?.entries],
  );
  const currentUserRank = useMemo(() => {
    if (!authState.userProfile || !selectedLeaderboard) {
      return null;
    }

    const userIndex = selectedLeaderboard.entries.findIndex(
      (entry) => entry.uid === authState.userProfile?.uid,
    );

    return userIndex >= 0 ? userIndex + 1 : null;
  }, [authState.userProfile, selectedLeaderboard]);
  const currentUserEntry = useMemo<LeaderboardEntry | null>(() => {
    if (!authState.userProfile || !selectedLeaderboard) {
      return null;
    }

    return (
      selectedLeaderboard.entries.find(
        (entry) => entry.uid === authState.userProfile?.uid,
      ) ?? null
    );
  }, [authState.userProfile, selectedLeaderboard]);

  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboards() {
      try {
        const leaderboardEntries = await Promise.all(
          GAME_MODES.map(async (mode) => [
            mode.id,
            await firestoreScoreRepository.getLeaderboard(mode.id),
          ]),
        );

        if (!isMounted) {
          return;
        }

        setLeaderboardsByMode(
          Object.fromEntries(
            leaderboardEntries.filter(
              (entry): entry is [GameModeId, LeaderboardDocument] =>
                entry[1] !== null,
            ),
          ),
        );
        setErrorMessage(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Ranking Firestore indisponible.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadLeaderboards();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                Ranking global
              </p>
              <h1 className="mt-5 text-5xl font-black tracking-[-0.04em] text-white sm:text-7xl">
                Leaderboards par mode.
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                Choisis un mode, regarde le podium, ta position et le top 20
                synchronise Firestore.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/profile"
                className="inline-flex w-fit items-center justify-center rounded-full bg-emerald-400 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300"
              >
                Mon profil
              </Link>
              <Link
                href="/modes"
                className="inline-flex w-fit items-center justify-center rounded-full border border-white/15 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/30 hover:bg-white/5"
              >
                Retour modes
              </Link>
            </div>
          </div>

          <GoogleAuthCard />
        </header>

        {errorMessage ? (
          <section className="rounded-[2rem] border border-amber-300/15 bg-amber-300/5 p-8">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-200">
              Firestore
            </p>
            <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">
              Ranking indisponible.
            </h2>
            <p className="mt-4 text-sm leading-7 text-amber-100">
              {errorMessage}
            </p>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap gap-3">
            {GAME_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSelectedModeId(mode.id)}
                className={`rounded-full px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all ${
                  selectedModeId === mode.id
                    ? "bg-emerald-400 text-slate-950"
                    : "border border-white/10 bg-slate-950/40 text-white hover:border-emerald-300/40 hover:bg-emerald-400/10"
                }`}
              >
                {mode.title}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              {selectedMode?.id}
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white">
              {selectedMode?.title}
            </h2>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-slate-950/40 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                  Joueurs classes
                </p>
                <p className="mt-4 text-5xl font-black tracking-[-0.05em] text-white">
                  {selectedLeaderboard?.entries.length ?? 0}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-950/40 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                  Ta position
                </p>
                <p className="mt-4 text-5xl font-black tracking-[-0.05em] text-emerald-300">
                  {currentUserRank ? `#${currentUserRank}` : "--"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                Ton meilleur score
              </p>
              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  {currentUserEntry?.photoUrl ? (
                    <Image
                      src={currentUserEntry.photoUrl}
                      alt={`Avatar de ${currentUserEntry.displayName}`}
                      width={52}
                      height={52}
                      className="rounded-full"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-13 w-13 items-center justify-center rounded-full bg-white/5 text-sm font-black text-white">
                      {(authState.userProfile?.displayName ?? "G").slice(0, 1)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-white">
                      {currentUserEntry?.displayName ??
                        authState.userProfile?.displayName ??
                        "Non connecte"}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {currentUserEntry
                        ? new Date(currentUserEntry.updatedAt).toLocaleDateString(
                            "fr-FR",
                          )
                        : "Aucun score sauvegarde"}
                    </p>
                  </div>
                </div>

                <p className="text-4xl font-black tracking-[-0.05em] text-emerald-300">
                  {currentUserEntry?.bestScore ?? 0}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-3xl font-black tracking-[-0.04em] text-white">
                Top 20
              </h2>
              <span className="rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                Live
              </span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {podiumEntries.map((entry, entryIndex) => {
                const rank = entryIndex + 1;

                return (
                  <div
                    key={`${selectedModeId}-podium-${entry.uid}`}
                    className={`rounded-[1.8rem] border p-5 text-center ${getPodiumCardClassName(
                      rank,
                    )}`}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">
                      {renderRankLabel(rank)}
                    </p>
                    <div className="mx-auto mt-4 h-16 w-16 overflow-hidden rounded-full bg-slate-900">
                      {entry.photoUrl ? (
                        <Image
                          src={entry.photoUrl}
                          alt={`Avatar de ${entry.displayName}`}
                          width={64}
                          height={64}
                          className="h-full w-full rounded-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-black text-white">
                          {entry.displayName.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <p className="mt-4 truncate text-sm font-bold text-white">
                      {entry.displayName}
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">
                      {entry.bestScore}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              {isLoading ? (
                <p className="rounded-3xl bg-slate-950/40 px-5 py-4 text-sm text-slate-300">
                  Chargement du ranking...
                </p>
              ) : null}

              {!isLoading && (selectedLeaderboard?.entries.length ?? 0) === 0 ? (
                <p className="rounded-3xl bg-slate-950/40 px-5 py-4 text-sm text-slate-300">
                  Aucun score sauvegarde pour ce mode.
                </p>
              ) : null}

              {selectedLeaderboard?.entries.map((entry, entryIndex) => {
                const isCurrentUser = entry.uid === authState.userProfile?.uid;

                return (
                  <div
                    key={`${selectedModeId}-${entry.uid}`}
                    className={`flex items-center justify-between gap-4 rounded-3xl px-5 py-4 ${
                      isCurrentUser
                        ? "bg-emerald-400/10 ring-1 ring-emerald-300/20"
                        : "bg-slate-950/40"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
                        {renderRankLabel(entryIndex + 1)}
                      </span>

                      {entry.photoUrl ? (
                        <Image
                          src={entry.photoUrl}
                          alt={`Avatar de ${entry.displayName}`}
                          width={44}
                          height={44}
                          className="rounded-full"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-xs font-black uppercase tracking-[0.2em] text-white">
                          {entry.displayName.slice(0, 1)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-white">
                          {entry.displayName}
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {new Date(entry.updatedAt).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>

                    <p className="text-2xl font-black tracking-[-0.04em] text-white">
                      {entry.bestScore}
                    </p>
                  </div>
                );
              })}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
