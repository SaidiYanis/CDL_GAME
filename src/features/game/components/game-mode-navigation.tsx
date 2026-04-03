"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface GameModeNavigationProps {
  backHref?: string;
  backLabel?: string;
  onNavigateBack?: () => Promise<void> | void;
  shouldConfirmNavigation?: boolean;
}

export function GameModeNavigation({
  backHref = "/modes",
  backLabel = "Retour aux modes",
  onNavigateBack,
  shouldConfirmNavigation = false,
}: GameModeNavigationProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  async function handleNavigate(targetHref: string) {
    if (isLeaving) {
      return;
    }

    if (
      shouldConfirmNavigation &&
      !window.confirm("Vous etes sur de vouloir partir ? La run sera perdue.")
    ) {
      return;
    }

    setIsLeaving(true);

    try {
      await onNavigateBack?.();
    } finally {
      router.push(targetHref);
    }
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
      <button
        type="button"
        disabled={isLeaving}
        onClick={() => handleNavigate(backHref)}
        className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:border-emerald-300/40 hover:bg-emerald-400/10 disabled:cursor-wait disabled:opacity-60"
      >
        {"<-"} {backLabel}
      </button>

      <button
        type="button"
        disabled={isLeaving}
        onClick={() => handleNavigate("/leaderboard")}
        className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
      >
        Ranking global
      </button>
    </nav>
  );
}
