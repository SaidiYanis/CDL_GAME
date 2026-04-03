import Link from "next/link";

interface GameModeNavigationProps {
  backHref?: string;
  backLabel?: string;
}

export function GameModeNavigation({
  backHref = "/modes",
  backLabel = "Retour aux modes",
}: GameModeNavigationProps) {
  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
      <Link
        href={backHref}
        className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-emerald-300/40 hover:bg-emerald-400/10"
      >
        ← {backLabel}
      </Link>

      <Link
        href="/leaderboard"
        className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300"
      >
        Ranking global
      </Link>
    </nav>
  );
}
