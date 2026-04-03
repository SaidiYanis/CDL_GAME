import type {
  AuthenticatedUserProfile,
  GameModeId,
  GameSessionDocument,
  LeaderboardDocument,
  UserGameStatsDocument,
} from "@/src/types";

export interface FirebaseScoreRepository {
  getUserBestScore(uid: string, modeId: GameModeId): Promise<number>;
  getUserGameStats(uid: string): Promise<UserGameStatsDocument[]>;
  getLeaderboard(modeId: GameModeId): Promise<LeaderboardDocument | null>;
  saveGameSession(session: GameSessionDocument): Promise<void>;
  saveUserBestScore(
    user: AuthenticatedUserProfile,
    modeId: GameModeId,
    score: number,
  ): Promise<number>;
  upsertUserGameStats(
    session: GameSessionDocument,
    currentBestScore: number,
  ): Promise<void>;
}
