import type { ScoreRepository } from "@/src/features/scores/services/score-repository";
import type { GameModeId, ModeBestScores } from "@/src/types";

const STORAGE_KEY = "cdl-survival-best-scores";
const DEFAULT_BEST_SCORES: ModeBestScores = {
  "age-duel": 0,
  "guess-player": 0,
  "rating-duel": 0,
  "role-sort": 0,
  "title-rank": 0,
  "title-duel": 0,
};

function getStoredScores(): ModeBestScores {
  if (typeof window === "undefined") {
    return DEFAULT_BEST_SCORES;
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return DEFAULT_BEST_SCORES;
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<ModeBestScores>;

    return {
      "age-duel": Number(parsedValue["age-duel"]) || 0,
      "guess-player": Number(parsedValue["guess-player"]) || 0,
      "rating-duel": Number(parsedValue["rating-duel"]) || 0,
      "role-sort": Number(parsedValue["role-sort"]) || 0,
      "title-rank": Number(parsedValue["title-rank"]) || 0,
      "title-duel": Number(parsedValue["title-duel"]) || 0,
    };
  } catch {
    return DEFAULT_BEST_SCORES;
  }
}

export class LocalScoreRepository implements ScoreRepository {
  getBestScore(modeId: GameModeId): number {
    return getStoredScores()[modeId];
  }

  getBestScores(): ModeBestScores {
    return getStoredScores();
  }

  saveBestScore(modeId: GameModeId, score: number): number {
    const nextScores = this.getBestScores();
    const nextBestScore = Math.max(nextScores[modeId], score);

    nextScores[modeId] = nextBestScore;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextScores));
    }

    return nextBestScore;
  }
}

export const localScoreRepository = new LocalScoreRepository();
