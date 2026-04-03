import Link from "next/link";
import { GoogleAuthCard } from "@/src/features/auth/components/google-auth-card";
import { GAME_MODES } from "@/src/features/modes/constants/game-modes";

export function ModeSelectScreen() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Choix du mode
          </p>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-black tracking-[-0.04em] text-white sm:text-7xl">
                Selectionne ton defi CDL.
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                Un mode est deja jouable. Les autres sont prets dans la roadmap
                et seront ajoutes une user story a la fois.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex w-fit items-center justify-center rounded-full border border-white/15 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/30 hover:bg-white/5"
            >
              Retour accueil
            </Link>
          </div>

          <GoogleAuthCard />
        </header>

        <section className="grid gap-5 lg:grid-cols-2">
          {GAME_MODES.map((mode) => (
            <article
              key={mode.id}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-8"
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

              <p className="mt-6 min-h-24 text-base leading-8 text-slate-200">
                {mode.description}
              </p>

              {mode.href ? (
                <Link
                  href={mode.href}
                  className="mt-8 inline-flex items-center justify-center rounded-full bg-emerald-400 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300"
                >
                  Lancer ce mode
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-8 inline-flex cursor-not-allowed items-center justify-center rounded-full bg-white/10 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-500"
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
