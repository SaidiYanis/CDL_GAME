import Link from "next/link";

interface GameDataFallbackProps {
  description: string;
  title: string;
}

export function GameDataFallback({ description, title }: GameDataFallbackProps) {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">
          Donnees indisponibles
        </p>
        <h1 className="mt-5 text-4xl font-black tracking-[-0.04em]">
          {title}
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-300">{description}</p>
        <Link
          href="/modes"
          className="mt-8 inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-white/30 hover:bg-white/5"
        >
          Retour aux modes
        </Link>
      </section>
    </main>
  );
}
