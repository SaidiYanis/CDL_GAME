import type { GameQuestionMode } from "@/src/types";

export const SCORE_FOR_THREE_CHOICES = 5;
export const SCORE_FOR_FREE_INPUT = 11;

export function getQuestionMode(score: number): GameQuestionMode {
  if (score >= SCORE_FOR_FREE_INPUT) {
    return "free-input";
  }

  if (score >= SCORE_FOR_THREE_CHOICES) {
    return "multiple-choice-3";
  }

  return "multiple-choice-4";
}

export function getOptionCountByMode(mode: GameQuestionMode): number {
  if (mode === "multiple-choice-3") {
    return 3;
  }

  if (mode === "multiple-choice-4") {
    return 4;
  }

  return 0;
}
