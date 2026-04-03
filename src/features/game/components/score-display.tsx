interface ScoreDisplayProps {
  bestScore: number;
  score: number;
}

export function ScoreDisplay({ bestScore, score }: ScoreDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Score
        </p>
        <p className="mt-3 text-4xl font-black tracking-[-0.04em] text-white">
          {score}
        </p>
      </article>

      <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Record
        </p>
        <p className="mt-3 text-4xl font-black tracking-[-0.04em] text-emerald-300">
          {bestScore}
        </p>
      </article>
    </div>
  );
}
