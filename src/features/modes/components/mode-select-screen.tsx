import Link from "next/link";
import { GoogleAuthCard } from "@/src/features/auth/components/google-auth-card";
import { GAME_MODES } from "@/src/features/modes/constants/game-modes";

export function ModeSelectScreen() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-10">
        <header className="flex flex-col gap-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:gap-6 sm:rounded-[2rem] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Choix du mode
          </p>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-7xl">
                Selectionne ton defi CDL.
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-300 sm:mt-5 sm:text-lg sm:leading-8">
                Lance un mode, enchaine les bonnes decisions et grimpe dans le
                ranking global.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/profile"
                className="inline-flex w-fit items-center justify-center rounded-full border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-emerald-300/40 hover:bg-emerald-400/10 sm:px-8 sm:py-4 sm:text-sm"
              >
                Mon profil
              </Link>
              <Link
                href="/leaderboard"
                className="inline-flex w-fit items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300 sm:px-8 sm:py-4 sm:text-sm"
              >
                Ranking global
              </Link>
              <Link
                href="/"
                className="inline-flex w-fit items-center justify-center rounded-full border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/30 hover:bg-white/5 sm:px-8 sm:py-4 sm:text-sm"
              >
                Retour accueil
              </Link>
            </div>
          </div>

          <GoogleAuthCard />
        </header>

        <section className="grid gap-5 lg:grid-cols-2">
          {GAME_MODES.map((mode) => (
            <article
              key={mode.id}
              className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2rem] sm:p-8"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                  {mode.title}
                </p>
                <span
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] ${
                    mode.isAvailable
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-amber-400/10 text-amber-300"
                  }`}
                >
                  {mode.label}
                </span>
              </div>

              <p className="mt-5 min-h-20 text-sm leading-7 text-slate-200 sm:mt-6 sm:min-h-24 sm:text-base sm:leading-8">
                {mode.description}
              </p>

              {mode.href ? (
                <Link
                  href={mode.href}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300 sm:mt-8 sm:px-8 sm:py-4 sm:text-sm"
                >
                  Lancer ce mode
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-6 inline-flex cursor-not-allowed items-center justify-center rounded-full bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 sm:mt-8 sm:px-8 sm:py-4 sm:text-sm"
                >
                  Bientot disponible
                </button>
              )}
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
