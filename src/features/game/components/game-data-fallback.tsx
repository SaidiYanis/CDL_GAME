import Link from "next/link";

interface GameDataFallbackProps {
  description: string;
  title: string;
}

export function GameDataFallback({ description, title }: GameDataFallbackProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 sm:py-10">
      <section className="mx-auto max-w-3xl rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-[2rem] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">
          Donnees indisponibles
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:mt-5 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-300 sm:mt-4 sm:text-base sm:leading-8">
          {description}
        </p>
        <Link
          href="/modes"
          className="mt-6 inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/30 hover:bg-white/5 sm:mt-8 sm:px-8 sm:py-4 sm:text-sm"
        >
          Retour aux modes
        </Link>
      </section>
    </main>
  );
}
