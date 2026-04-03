export type GameQuestionMode =
  | "multiple-choice-4"
  | "multiple-choice-3"
  | "free-input";

export type GameStatus = "idle" | "playing" | "lost";

export interface GameQuestion {
  playerId: string;
  imageUrl: string;
  correctAnswer: string;
  options: string[];
  mode: GameQuestionMode;
}

export interface GameState {
  score: number;
  bestScore: number;
  status: GameStatus;
  currentQuestion: GameQuestion | null;
  usedPlayerIds: string[];
  lastCorrectAnswer: string | null;
}
