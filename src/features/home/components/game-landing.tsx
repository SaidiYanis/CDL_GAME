import Link from "next/link";

const survivalRules = [
  "Choisis un mode puis enchaine les bonnes reponses pour faire monter ton score.",
  "Le principe reste le meme partout : une erreur suffit pour stopper la run.",
  "Bats ton record, compare-toi au ranking global et adapte-toi aux regles propres a chaque mode.",
];

const featureHighlights = [
  "6 modes jouables pour tester ta lecture des joueurs CDL",
  "Scores personnels et records synchronises",
  "Ranking global par mode",
  "Connexion Google",
  "Feedback audio et visuel en partie",
];

export function GameLanding() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:gap-14 sm:px-10 sm:py-10 lg:px-12">
        <header className="flex items-center justify-between gap-6 rounded-full border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            CDL Survival Game
          </p>
          <span className="rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Live version
          </span>
        </header>

        <div className="grid gap-6 sm:gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col gap-6">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">
                Mode Survie
              </p>
              <h1 className="max-w-3xl text-4xl font-black tracking-[-0.04em] text-white sm:text-7xl">
                Teste tes reflexes CDL. Survis le plus longtemps possible.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-xl sm:leading-8">
                Lance une run, bats ton record, compare ton niveau au ranking
                global et teste ta connaissance de la scene Call of Duty League.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/modes"
                className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300 sm:px-8 sm:py-4 sm:text-sm"
              >
                Choisir un mode
              </Link>
              <Link
                href="/roster"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-200 transition-colors hover:border-emerald-400/40 hover:text-emerald-300 sm:px-8 sm:py-4 sm:text-sm"
              >
                Roster CDL
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-emerald-500/10 sm:rounded-[2rem] sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Regles
            </p>
            <ul className="mt-6 flex flex-col gap-4 sm:mt-8 sm:gap-5">
              {survivalRules.map((rule, index) => (
                <li
                  key={rule}
                  className="flex gap-3 rounded-3xl bg-slate-900/60 p-4 text-sm leading-7 text-slate-200 sm:gap-4 sm:p-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-xs font-bold text-emerald-300 sm:h-10 sm:w-10 sm:text-sm">
                    {index + 1}
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <section
          id="features"
          className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2rem] sm:p-8"
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Contenu disponible
            </p>
            <h2 className="text-3xl font-black tracking-[-0.04em] text-white">
              Une experience survival complete.
            </h2>
          </div>

          <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-2">
            {featureHighlights.map((item) => (
              <article
                key={item}
                className="rounded-3xl border border-white/10 bg-slate-900/50 px-4 py-4 text-xs font-medium uppercase tracking-[0.18em] text-slate-200 sm:px-6 sm:py-5 sm:text-sm"
              >
                {item}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
