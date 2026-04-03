interface AnswerOptionsProps {
  disabled?: boolean;
  feedbackStatus?: "correct" | "incorrect" | null;
  onSelectAnswer: (answer: string) => void;
  options: string[];
  selectedAnswer?: string | null;
}

export function AnswerOptions({
  disabled = false,
  feedbackStatus = null,
  onSelectAnswer,
  options,
  selectedAnswer = null,
}: AnswerOptionsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {options.map((option) => {
        const isSelected = selectedAnswer === option;
        const feedbackClassName =
          isSelected && feedbackStatus === "correct"
            ? "border-emerald-300/80 bg-emerald-400/15 text-emerald-100 shadow-[0_0_0_1px_rgba(110,231,183,0.2)]"
            : isSelected && feedbackStatus === "incorrect"
              ? "border-rose-300/80 bg-rose-500/15 text-rose-100 shadow-[0_0_0_1px_rgba(253,164,175,0.2)]"
              : "border-white/10 bg-slate-900/60 text-white hover:border-emerald-300/40 hover:bg-emerald-400/10";

        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onSelectAnswer(option)}
            className={`rounded-3xl border px-6 py-5 text-left text-sm font-bold uppercase tracking-[0.18em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${feedbackClassName}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
