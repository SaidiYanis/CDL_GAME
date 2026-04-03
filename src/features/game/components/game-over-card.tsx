"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

interface GameOverCardProps {
  bestScore: number;
  correctAnswer: string | null;
  onRestartGame: () => void;
  score: number;
}

export function GameOverCard({
  bestScore,
  correctAnswer,
  onRestartGame,
  score,
}: GameOverCardProps) {
  const cardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const cardElement = cardRef.current;

    if (!cardElement) {
      return;
    }

    cardElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    cardElement.focus({ preventScroll: true });
  }, []);

  return (
    <section
      ref={cardRef}
      tabIndex={-1}
      className="scroll-mt-8 rounded-[2rem] border border-rose-300/20 bg-rose-500/5 p-6 outline-none sm:p-8"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">
        Game Over
      </p>

      <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">
        Score final : {score}
      </h2>

      <p className="mt-4 text-base leading-8 text-slate-300">
        Bonne reponse :{" "}
        <span className="font-bold text-white">{correctAnswer ?? "N/A"}</span>
      </p>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
        Record actuel : {bestScore}
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={onRestartGame}
          className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300 sm:px-10 sm:py-5 sm:text-base"
        >
          Rejouer
        </button>

        <Link
          href="/modes"
          className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white transition-colors hover:border-white/30 hover:bg-white/5 sm:px-10 sm:py-5 sm:text-base"
        >
          Retour au menu
        </Link>
      </div>
    </section>
  );
}
