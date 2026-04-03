import type { ScoreRepository } from "@/src/features/scores/services/score-repository";
import { GAME_MODE_IDS, type GameModeId, type ModeBestScores } from "@/src/types";

const STORAGE_KEY = "cdl-survival-best-scores";
const DEFAULT_BEST_SCORES = Object.fromEntries(
  GAME_MODE_IDS.map((modeId) => [modeId, 0]),
) as ModeBestScores;

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

    return Object.fromEntries(
      GAME_MODE_IDS.map((modeId) => [modeId, Number(parsedValue[modeId]) || 0]),
    ) as ModeBestScores;
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
