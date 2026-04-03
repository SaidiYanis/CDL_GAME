import { FormEvent, useState } from "react";

interface AnswerInputProps {
  disabled?: boolean;
  onSubmitAnswer: (answer: string) => void;
  playerId: string;
}

export function AnswerInput({
  disabled = false,
  onSubmitAnswer,
  playerId,
}: AnswerInputProps) {
  const [answerValue, setAnswerValue] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!answerValue.trim()) {
      return;
    }

    onSubmitAnswer(answerValue);
    setAnswerValue("");
  }

  return (
    <form key={playerId} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        value={answerValue}
        disabled={disabled}
        onChange={(event) => setAnswerValue(event.target.value)}
        placeholder="Tape le pseudo du joueur"
        autoComplete="off"
        className="w-full rounded-3xl border border-white/10 bg-slate-900/60 px-6 py-5 text-sm font-semibold uppercase tracking-[0.18em] text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/50"
      />
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Valider
      </button>
    </form>
  );
}
