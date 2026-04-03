import type { GameModeId, ModeBestScores } from "@/src/types";

export interface ScoreRepository {
  getBestScore(modeId: GameModeId): number;
  getBestScores(): ModeBestScores;
  saveBestScore(modeId: GameModeId, score: number): number;
}
