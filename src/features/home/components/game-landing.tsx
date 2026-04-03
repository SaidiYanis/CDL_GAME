import Link from "next/link";

const survivalRules = [
  "Devine le joueur CDL affiche a l'ecran.",
  "Chaque bonne reponse ajoute 1 point a ton score.",
  "Une seule erreur termine la partie instantanement.",
];

const featureHighlights = [
  "5 modes jouables pour tester ta lecture des joueurs CDL",
  "Scores personnels et records synchronises",
  "Ranking global par mode",
  "Connexion Google",
  "Feedback audio et visuel en partie",
];

export function GameLanding() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-10 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between gap-6 rounded-full border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            CDL Survival Game
          </p>
          <span className="rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Live version
          </span>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">
                Mode Survie
              </p>
              <h1 className="max-w-3xl text-5xl font-black tracking-[-0.04em] text-white sm:text-7xl">
                Nomme le joueur. Survis le plus longtemps possible.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Lance une run, bats ton record, compare ton niveau au ranking
                global et teste ta connaissance de la scene Call of Duty League.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/modes"
                className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300"
              >
                Choisir un mode
              </Link>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-emerald-500/10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Regles
            </p>
            <ul className="mt-8 flex flex-col gap-5">
              {survivalRules.map((rule, index) => (
                <li
                  key={rule}
                  className="flex gap-4 rounded-3xl bg-slate-900/60 p-5 text-sm leading-7 text-slate-200"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-sm font-bold text-emerald-300">
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
          className="rounded-[2rem] border border-white/10 bg-white/5 p-8"
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Contenu disponible
            </p>
            <h2 className="text-3xl font-black tracking-[-0.04em] text-white">
              Une experience survival complete.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {featureHighlights.map((item) => (
              <article
                key={item}
                className="rounded-3xl border border-white/10 bg-slate-900/50 px-6 py-5 text-sm font-medium uppercase tracking-[0.18em] text-slate-200"
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
