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
  return (
    <section className="rounded-[2rem] border border-rose-300/20 bg-rose-500/5 p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">
        Game Over
      </p>

      <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
        Score final : {score}
      </h2>

      <p className="mt-4 text-base leading-8 text-slate-300">
        Bonne reponse :{" "}
        <span className="font-bold text-white">{correctAnswer ?? "N/A"}</span>
      </p>
      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
        Record actuel : {bestScore}
      </p>

      <button
        type="button"
        onClick={onRestartGame}
        className="mt-8 inline-flex items-center justify-center rounded-full bg-emerald-400 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300"
      >
        Rejouer
      </button>
    </section>
  );
}
