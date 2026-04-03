import Link from "next/link";

export function GamePlaceholder() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
          Partie Survie
        </p>

        <div className="flex flex-col gap-5">
          <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-6xl">
            Le gameplay arrive a l'US5.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Prochaine etape : definir les types metier et construire un
            repository local capable d'exploiter tes images, meme si les noms et
            infos joueurs ne sont pas encore normalises.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex w-fit items-center justify-center rounded-full border border-white/15 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/30 hover:bg-white/5"
        >
          Retour accueil
        </Link>
      </section>
    </main>
  );
}
