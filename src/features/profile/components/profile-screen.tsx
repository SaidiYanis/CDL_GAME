"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GoogleAuthCard } from "@/src/features/auth/components/google-auth-card";
import { useGoogleAuthSession } from "@/src/features/auth/hooks/use-google-auth-session";
import { GAME_MODES } from "@/src/features/modes/constants/game-modes";
import { firestoreScoreRepository } from "@/src/lib/data/firebase-score-repository";
import type { GameModeId, UserGameStatsDocument } from "@/src/types";

type UserStatsByMode = Partial<Record<GameModeId, UserGameStatsDocument>>;

export function ProfileScreen() {
  const { authState } = useGoogleAuthSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [userStatsByMode, setUserStatsByMode] = useState<UserStatsByMode>({});

  const totalGamesPlayed = useMemo(
    () =>
      Object.values(userStatsByMode).reduce(
        (totalGames, statsDocument) =>
          totalGames + (statsDocument?.gamesPlayed ?? 0),
        0,
      ),
    [userStatsByMode],
  );
  const totalBestScore = useMemo(
    () =>
      Object.values(userStatsByMode).reduce(
        (totalScore, statsDocument) =>
          totalScore + (statsDocument?.bestScore ?? 0),
        0,
      ),
    [userStatsByMode],
  );

  useEffect(() => {
    const userProfile = authState.userProfile;

    if (!userProfile) {
      setUserStatsByMode({});
      return;
    }

    const userId = userProfile.uid;
    let isMounted = true;

    async function loadUserStats() {
      setIsLoadingStats(true);

      try {
        const statsDocuments =
          await firestoreScoreRepository.getUserGameStats(userId);

        if (!isMounted) {
          return;
        }

        setUserStatsByMode(
          Object.fromEntries(
            statsDocuments.map((statsDocument) => [
              statsDocument.modeId,
              statsDocument,
            ]),
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
            : "Impossible de charger tes stats.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingStats(false);
        }
      }
    }

    void loadUserStats();

    return () => {
      isMounted = false;
    };
  }, [authState.userProfile]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                Profil joueur
              </p>
              <h1 className="mt-5 text-5xl font-black tracking-[-0.04em] text-white sm:text-7xl">
                Tes stats CDL.
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                Suis tes records, ton volume de jeu et tes performances par mode.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/leaderboard"
                className="inline-flex w-fit items-center justify-center rounded-full bg-emerald-400 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300"
              >
                Ranking global
              </Link>
              <Link
                href="/modes"
                className="inline-flex w-fit items-center justify-center rounded-full border border-white/15 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/30 hover:bg-white/5"
              >
                Retour modes
              </Link>
            </div>
          </div>
        </header>

        <GoogleAuthCard />

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Parties jouees
            </p>
            <p className="mt-4 text-6xl font-black tracking-[-0.06em] text-white">
              {totalGamesPlayed}
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Records cumules
            </p>
            <p className="mt-4 text-6xl font-black tracking-[-0.06em] text-emerald-300">
              {totalBestScore}
            </p>
          </article>
        </section>

        {errorMessage ? (
          <p className="rounded-[2rem] border border-rose-300/20 bg-rose-500/5 p-6 text-sm leading-7 text-rose-100">
            {errorMessage}
          </p>
        ) : null}

        {!authState.userProfile && authState.isAuthReady ? (
          <section className="rounded-[2rem] border border-amber-300/15 bg-amber-300/5 p-8">
            <h2 className="text-3xl font-black tracking-[-0.04em] text-white">
              Connecte-toi pour voir tes stats sauvegardees.
            </h2>
            <p className="mt-4 text-sm leading-7 text-amber-100">
              Les records locaux restent jouables sans compte, mais la page
              profil affiche les donnees synchronisees Firestore.
            </p>
          </section>
        ) : null}

        <section className="grid gap-5 lg:grid-cols-2">
          {GAME_MODES.map((mode) => {
            const stats = userStatsByMode[mode.id];

            return (
              <article
                key={mode.id}
                className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {mode.id}
                    </p>
                    <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
                      {mode.title}
                    </h2>
                  </div>

                  <Link
                    href={mode.href ?? "/modes"}
                    className="rounded-full border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-emerald-300/40 hover:bg-emerald-400/10"
                  >
                    Jouer
                  </Link>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                      Record
                    </p>
                    <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-emerald-300">
                      {stats?.bestScore ?? 0}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                      Moyenne
                    </p>
                    <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">
                      {stats ? stats.averageScore.toFixed(1) : "0.0"}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                      Runs
                    </p>
                    <p className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">
                      {stats?.gamesPlayed ?? 0}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {authState.userProfile?.photoUrl ? (
                    <Image
                      src={authState.userProfile.photoUrl}
                      alt={`Avatar de ${authState.userProfile.displayName}`}
                      width={28}
                      height={28}
                      className="rounded-full"
                      unoptimized
                    />
                  ) : null}
                  <span>
                    {isLoadingStats
                      ? "Chargement stats"
                      : stats?.lastPlayedAt
                        ? `Derniere run ${new Date(stats.lastPlayedAt).toLocaleDateString("fr-FR")}`
                        : "Aucune run sauvegardee"}
                  </span>
                </div>
              </article>
            );
          })}
        </section>
      </section>
    </main>
  );
}
