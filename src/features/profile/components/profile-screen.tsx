"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GoogleAuthCard } from "@/src/features/auth/components/google-auth-card";
import { useGoogleAuthSession } from "@/src/features/auth/hooks/use-google-auth-session";
import { GAME_MODES } from "@/src/features/modes/constants/game-modes";
import type { GameModeId, UserGameStatsDocument } from "@/src/types";

type UserStatsByMode = Partial<Record<GameModeId, UserGameStatsDocument>>;

interface PublicUserProfile {
  displayName: string;
  photoUrl: string | null;
  uid: string;
}

interface ProfileScreenProps {
  profileUserId?: string;
}

export function ProfileScreen({ profileUserId }: ProfileScreenProps) {
  const { authState } = useGoogleAuthSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [profileUser, setProfileUser] = useState<PublicUserProfile | null>(null);
  const [userStatsByMode, setUserStatsByMode] = useState<UserStatsByMode>({});
  const ownProfileId = authState.userProfile?.uid ?? null;
  const viewedUserId = profileUserId ?? ownProfileId;
  const isOwnProfile = Boolean(
    ownProfileId && viewedUserId && ownProfileId === viewedUserId,
  );
  const displayName =
    profileUser?.displayName ??
    (isOwnProfile ? authState.userProfile?.displayName : null) ??
    "Profil joueur";
  const photoUrl =
    profileUser?.photoUrl ??
    (isOwnProfile ? authState.userProfile?.photoUrl : null) ??
    null;

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
    if (!viewedUserId) {
      setProfileUser(null);
      setUserStatsByMode({});
      return;
    }

    let isMounted = true;

    async function loadUserStats() {
      setIsLoadingStats(true);

      try {
        const response = await fetch(`/api/user-profiles/${viewedUserId}`);
        const payload = (await response.json()) as {
          error?: string;
          statsDocuments?: UserGameStatsDocument[];
          userProfile?: PublicUserProfile;
        };

        if (!response.ok || !payload.userProfile || !payload.statsDocuments) {
          throw new Error(payload.error ?? "Impossible de charger ce profil.");
        }

        if (!isMounted) {
          return;
        }

        setProfileUser(payload.userProfile);
        setUserStatsByMode(
          Object.fromEntries(
            payload.statsDocuments.map((statsDocument) => [
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
  }, [viewedUserId]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 sm:gap-8">
        <header className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2rem] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                Profil joueur
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-white sm:mt-5 sm:text-7xl">
                {isOwnProfile ? "Tes stats CDL." : `Stats de ${displayName}.`}
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-300 sm:mt-5 sm:text-lg sm:leading-8">
                {isOwnProfile
                  ? "Suis tes records, ton volume de jeu et tes performances par mode."
                  : "Consulte ses records, son volume de jeu et ses performances par mode."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/leaderboard"
                className="inline-flex w-fit items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300 sm:px-8 sm:py-4 sm:text-sm"
              >
                Ranking global
              </Link>
              <Link
                href="/modes"
                className="inline-flex w-fit items-center justify-center rounded-full border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/30 hover:bg-white/5 sm:px-8 sm:py-4 sm:text-sm"
              >
                Retour modes
              </Link>
            </div>
          </div>
        </header>

        {isOwnProfile || !profileUserId ? <GoogleAuthCard /> : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2rem] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Parties jouees
            </p>
            <p className="mt-3 text-5xl font-black tracking-[-0.06em] text-white sm:mt-4 sm:text-6xl">
              {totalGamesPlayed}
            </p>
          </article>

          <article className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2rem] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Records cumules
            </p>
            <p className="mt-3 text-5xl font-black tracking-[-0.06em] text-emerald-300 sm:mt-4 sm:text-6xl">
              {totalBestScore}
            </p>
          </article>
        </section>

        {errorMessage ? (
          <p className="rounded-[2rem] border border-rose-300/20 bg-rose-500/5 p-6 text-sm leading-7 text-rose-100">
            {errorMessage}
          </p>
        ) : null}

        {!profileUserId && !authState.userProfile && authState.isAuthReady ? (
          <section className="rounded-[1.5rem] border border-amber-300/15 bg-amber-300/5 p-5 sm:rounded-[2rem] sm:p-8">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
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
                className="rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-5 sm:rounded-[2rem] sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {mode.id}
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white sm:mt-3 sm:text-3xl">
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

                <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
                  <div className="rounded-3xl bg-white/5 p-3 sm:p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                      Record
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-emerald-300 sm:mt-3 sm:text-4xl">
                      {stats?.bestScore ?? 0}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-3 sm:p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                      Moyenne
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-white sm:mt-3 sm:text-4xl">
                      {stats ? stats.averageScore.toFixed(1) : "0.0"}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-3 sm:p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                      Runs
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-white sm:mt-3 sm:text-4xl">
                      {stats?.gamesPlayed ?? 0}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:mt-6 sm:text-xs">
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={`Avatar de ${displayName}`}
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
