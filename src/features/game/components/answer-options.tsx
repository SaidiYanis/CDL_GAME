interface AnswerOptionsProps {
  disabled?: boolean;
  onSelectAnswer: (answer: string) => void;
  options: string[];
}

export function AnswerOptions({
  disabled = false,
  onSelectAnswer,
  options,
}: AnswerOptionsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onSelectAnswer(option)}
          className="rounded-3xl border border-white/10 bg-slate-900/60 px-6 py-5 text-left text-sm font-bold uppercase tracking-[0.18em] text-white transition-colors hover:border-emerald-300/40 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
