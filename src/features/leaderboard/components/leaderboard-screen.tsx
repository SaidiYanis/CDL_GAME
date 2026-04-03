"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GoogleAuthCard } from "@/src/features/auth/components/google-auth-card";
import { GAME_MODES } from "@/src/features/modes/constants/game-modes";
import { firestoreScoreRepository } from "@/src/lib/data/firebase-score-repository";
import type { GameModeId, LeaderboardDocument } from "@/src/types";

type LeaderboardsByMode = Partial<Record<GameModeId, LeaderboardDocument>>;

export function LeaderboardScreen() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardsByMode, setLeaderboardsByMode] =
    useState<LeaderboardsByMode>({});

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
                Les classements sont alimentes par les meilleurs scores
                synchronises dans Firestore pour chaque joueur connecte.
              </p>
            </div>

            <Link
              href="/profile"
              className="inline-flex w-fit items-center justify-center rounded-full border border-white/15 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/30 hover:bg-white/5"
            >
              Mon profil
            </Link>
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

        <section className="grid gap-6 xl:grid-cols-2">
          {GAME_MODES.map((mode) => {
            const leaderboard = leaderboardsByMode[mode.id];

            return (
              <article
                key={mode.id}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-8"
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

                  <span className="rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
                    Top 20
                  </span>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  {isLoading ? (
                    <p className="rounded-3xl bg-white/5 px-5 py-4 text-sm text-slate-300">
                      Chargement du ranking...
                    </p>
                  ) : null}

                  {!isLoading && leaderboard?.entries.length === 0 ? (
                    <p className="rounded-3xl bg-white/5 px-5 py-4 text-sm text-slate-300">
                      Aucun score sauvegarde pour ce mode.
                    </p>
                  ) : null}

                  {leaderboard?.entries.map((entry, entryIndex) => (
                    <div
                      key={`${mode.id}-${entry.uid}`}
                      className="flex items-center justify-between gap-4 rounded-3xl bg-slate-950/40 px-5 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
                          #{entryIndex + 1}
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
