import { FormEvent, useMemo, useRef, useState } from "react";
import { normalizeAnswer } from "@/src/lib/utils/normalize-answer";

const MIN_SEARCH_LENGTH = 2;
const MAX_SUGGESTIONS = 6;

interface AnswerInputProps {
  disabled?: boolean;
  onSubmitAnswer: (answer: string) => void;
  playerNames: string[];
}

interface SuggestionMatch {
  includes: boolean;
  playerName: string;
  startsWith: boolean;
}

function createSuggestionMatch(
  playerName: string,
  normalizedQuery: string,
): SuggestionMatch | null {
  const normalizedPlayerName = normalizeAnswer(playerName);
  const startsWith = normalizedPlayerName.startsWith(normalizedQuery);
  const includes = normalizedPlayerName.includes(normalizedQuery);

  if (!startsWith && !includes) {
    return null;
  }

  return {
    includes,
    playerName,
    startsWith,
  };
}

function compareSuggestionMatches(
  leftMatch: SuggestionMatch,
  rightMatch: SuggestionMatch,
): number {
  if (leftMatch.startsWith !== rightMatch.startsWith) {
    return leftMatch.startsWith ? -1 : 1;
  }

  if (leftMatch.includes !== rightMatch.includes) {
    return leftMatch.includes ? -1 : 1;
  }

  return leftMatch.playerName.localeCompare(rightMatch.playerName);
}

export function AnswerInput({
  disabled = false,
  onSubmitAnswer,
  playerNames,
}: AnswerInputProps) {
  const [answerValue, setAnswerValue] = useState("");
  const [isSuggestionListOpen, setIsSuggestionListOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const normalizedAnswerValue = normalizeAnswer(answerValue);
  const shouldShowSuggestions =
    isSuggestionListOpen && normalizedAnswerValue.length >= MIN_SEARCH_LENGTH;
  const suggestions = useMemo(() => {
    if (!shouldShowSuggestions) {
      return [];
    }

    return playerNames
      .map((playerName) =>
        createSuggestionMatch(playerName, normalizedAnswerValue),
      )
      .filter((match): match is SuggestionMatch => match !== null)
      .sort(compareSuggestionMatches)
      .slice(0, MAX_SUGGESTIONS)
      .map((match) => match.playerName);
  }, [normalizedAnswerValue, playerNames, shouldShowSuggestions]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!answerValue.trim()) {
      return;
    }

    onSubmitAnswer(answerValue);
    setAnswerValue("");
    setIsSuggestionListOpen(false);
  }

  function handleSelectSuggestion(playerName: string) {
    setAnswerValue(playerName);
    setIsSuggestionListOpen(false);
    window.requestAnimationFrame(() => {
      inputRef.current?.blur();
    });
  }

  function handleInputBlur(event: React.FocusEvent<HTMLDivElement>) {
    const nextFocusedElement = event.relatedTarget as Node | null;

    if (
      nextFocusedElement &&
      containerRef.current?.contains(nextFocusedElement)
    ) {
      return;
    }

    setIsSuggestionListOpen(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div
        ref={containerRef}
        onBlur={handleInputBlur}
        className="relative"
      >
        <input
          ref={inputRef}
          type="text"
          value={answerValue}
          disabled={disabled}
          onChange={(event) => {
            setAnswerValue(event.target.value);
            setIsSuggestionListOpen(true);
          }}
          onFocus={() => {
            if (normalizedAnswerValue.length >= MIN_SEARCH_LENGTH) {
              setIsSuggestionListOpen(true);
            }
          }}
          placeholder="Tape le pseudo du joueur"
          autoComplete="off"
          className="w-full rounded-3xl border border-white/10 bg-slate-900/60 px-5 py-4 text-sm font-semibold tracking-[0.08em] text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/50 sm:px-6 sm:py-5"
        />

        {shouldShowSuggestions && suggestions.length > 0 ? (
          <div
            onMouseLeave={() => setIsSuggestionListOpen(false)}
            className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-20 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/30 backdrop-blur-sm"
          >
            <p className="border-b border-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400 sm:px-5">
              Suggestions joueurs
            </p>
            <ul className="max-h-72 overflow-y-auto py-2">
              {suggestions.map((playerName) => (
                <li key={playerName}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelectSuggestion(playerName)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold tracking-[0.06em] text-white transition-colors hover:bg-emerald-400/10 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
                  >
                    <span>{playerName}</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Remplir
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
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
