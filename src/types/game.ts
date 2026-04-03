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

export type DuelAnswer = "left" | "right" | "same";

export type DuelPrompt =
  | "Plus jeune"
  | "Plus vieux"
  | "Qui a le plus de titres"
  | "Meilleure note BP";

export interface DuelGameQuestion {
  correctAnswer: DuelAnswer;
  leftPlayerId: string;
  prompt: DuelPrompt;
  rightPlayerId: string;
}

export interface DuelGameState {
  bestScore: number;
  currentQuestion: DuelGameQuestion | null;
  lastCorrectAnswer: string | null;
  score: number;
  status: GameStatus;
  usedPairKeys: string[];
}

export interface RoleSortGameQuestion {
  playerIds: string[];
}

export interface RoleSortGameState {
  bestScore: number;
  currentQuestion: RoleSortGameQuestion | null;
  lastCorrectAnswer: string | null;
  score: number;
  status: GameStatus;
}

export type TitleRankAnswer = "higher" | "same" | "lower";

export interface TitleRankGameQuestion {
  comparisonMode: "major" | "cumulative";
  playerIds: string[];
  targetTitleCount: number;
}

export interface TitleRankGameState {
  bestScore: number;
  currentQuestion: TitleRankGameQuestion | null;
  lastCorrectAnswer: string | null;
  score: number;
  status: GameStatus;
}
