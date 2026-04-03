export type GameModeId =
  | "guess-player"
  | "age-duel"
  | "title-duel"
  | "rating-duel"
  | "role-sort";

export type ModeBestScores = Record<GameModeId, number>;

export interface UserBestScoreDocument {
  bestScore: number;
  displayName: string;
  modeId: GameModeId;
  photoUrl: string | null;
  uid: string;
  updatedAt: string;
}

export interface GameSessionDocument {
  durationMs: number;
  modeId: GameModeId;
  playedAt: string;
  score: number;
  status: "completed" | "lost";
  uid: string;
}

export interface UserGameStatsDocument {
  averageScore: number;
  bestScore: number;
  gamesPlayed: number;
  lastPlayedAt: string;
  modeId: GameModeId;
  totalScore: number;
  uid: string;
}

export interface LeaderboardEntry {
  bestScore: number;
  displayName: string;
  photoUrl: string | null;
  uid: string;
  updatedAt: string;
}

export interface LeaderboardDocument {
  entries: LeaderboardEntry[];
  modeId: GameModeId;
  updatedAt: string;
}
