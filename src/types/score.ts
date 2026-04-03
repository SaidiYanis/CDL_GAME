export type GameModeId =
  | "guess-player"
  | "age-duel"
  | "title-duel"
  | "rating-duel"
  | "role-sort";

export type ModeBestScores = Record<GameModeId, number>;

export interface AuthenticatedUserProfile {
  displayName: string;
  email: string;
  photoUrl: string | null;
  provider: "google";
  uid: string;
}

export interface UserBestScoreDocument {
  bestScore: number;
  modeId: GameModeId;
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
