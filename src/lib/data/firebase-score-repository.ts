import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  type DocumentReference,
} from "firebase/firestore";
import type { FirebaseScoreRepository as FirebaseScoreRepositoryContract } from "@/src/features/scores/services/firebase-score-repository";
import { firebaseDb } from "@/src/lib/firebase/client";
import type {
  AuthenticatedUserProfile,
  GameModeId,
  GameSessionDocument,
  LeaderboardDocument,
  LeaderboardEntry,
  UserBestScoreDocument,
  UserGameStatsDocument,
} from "@/src/types";

const LEADERBOARD_LIMIT = 20;
const GAME_MODE_IDS: GameModeId[] = [
  "guess-player",
  "age-duel",
  "title-duel",
  "rating-duel",
  "role-sort",
];

function createModeDocumentId(uid: string, modeId: GameModeId): string {
  return `${uid}_${modeId}`;
}

function getFirebaseDbOrThrow() {
  if (!firebaseDb) {
    throw new Error("Firebase Firestore n'est pas configure.");
  }

  return firebaseDb;
}

async function readDocument<TDocument>(
  documentRef: DocumentReference,
): Promise<TDocument | null> {
  const snapshot = await getDoc(documentRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as TDocument;
}

export class FirestoreScoreRepository
  implements FirebaseScoreRepositoryContract
{
  async getUserBestScore(uid: string, modeId: GameModeId): Promise<number> {
    const db = getFirebaseDbOrThrow();
    const bestScoreDocument = await readDocument<UserBestScoreDocument>(
      doc(db, "userBestScores", createModeDocumentId(uid, modeId)),
    );

    return bestScoreDocument?.bestScore ?? 0;
  }

  async getUserGameStats(uid: string): Promise<UserGameStatsDocument[]> {
    const db = getFirebaseDbOrThrow();
    const statsDocuments = await Promise.all(
      GAME_MODE_IDS.map((modeId) =>
        readDocument<UserGameStatsDocument>(
          doc(db, "userGameStats", createModeDocumentId(uid, modeId)),
        ),
      ),
    );

    return statsDocuments.filter(
      (statsDocument): statsDocument is UserGameStatsDocument =>
        statsDocument !== null,
    );
  }

  async getLeaderboard(modeId: GameModeId): Promise<LeaderboardDocument | null> {
    const db = getFirebaseDbOrThrow();
    const leaderboardSnapshot = await getDocs(
      query(
        collection(db, "userBestScores"),
        where("modeId", "==", modeId),
        orderBy("bestScore", "desc"),
        limit(LEADERBOARD_LIMIT),
      ),
    );
    const entries: LeaderboardEntry[] = leaderboardSnapshot.docs.map(
      (scoreDocument) => {
        const bestScoreDocument = scoreDocument.data() as UserBestScoreDocument;

        return {
          bestScore: bestScoreDocument.bestScore,
          displayName: bestScoreDocument.displayName ?? "Player",
          photoUrl: bestScoreDocument.photoUrl ?? null,
          uid: bestScoreDocument.uid,
          updatedAt: bestScoreDocument.updatedAt,
        };
      },
    );

    return {
      entries,
      modeId,
      updatedAt: new Date().toISOString(),
    };
  }

  async saveGameSession(session: GameSessionDocument): Promise<void> {
    const db = getFirebaseDbOrThrow();
    const sessionDocumentRef = doc(collection(db, "gameSessions"));

    await setDoc(sessionDocumentRef, session);
  }

  async saveUserBestScore(
    user: AuthenticatedUserProfile,
    modeId: GameModeId,
    score: number,
  ): Promise<number> {
    const db = getFirebaseDbOrThrow();
    const documentRef = doc(
      db,
      "userBestScores",
      createModeDocumentId(user.uid, modeId),
    );
    const currentDocument = await readDocument<UserBestScoreDocument>(
      documentRef,
    );
    const nextBestScore = Math.max(currentDocument?.bestScore ?? 0, score);

    if (nextBestScore !== currentDocument?.bestScore) {
      await setDoc(documentRef, {
        bestScore: nextBestScore,
        displayName: user.displayName,
        modeId,
        photoUrl: user.photoUrl,
        uid: user.uid,
        updatedAt: new Date().toISOString(),
      } satisfies UserBestScoreDocument);
    }

    return nextBestScore;
  }

  async upsertUserGameStats(
    session: GameSessionDocument,
    currentBestScore: number,
  ): Promise<void> {
    const db = getFirebaseDbOrThrow();
    const documentRef = doc(
      db,
      "userGameStats",
      createModeDocumentId(session.uid, session.modeId),
    );
    const currentStats = await readDocument<UserGameStatsDocument>(
      documentRef,
    );
    const nextGamesPlayed = (currentStats?.gamesPlayed ?? 0) + 1;
    const nextTotalScore = (currentStats?.totalScore ?? 0) + session.score;

    await setDoc(documentRef, {
      averageScore: nextTotalScore / nextGamesPlayed,
      bestScore: Math.max(currentBestScore, currentStats?.bestScore ?? 0),
      gamesPlayed: nextGamesPlayed,
      lastPlayedAt: session.playedAt,
      modeId: session.modeId,
      totalScore: nextTotalScore,
      uid: session.uid,
    } satisfies UserGameStatsDocument);
  }
}

export const firestoreScoreRepository = new FirestoreScoreRepository();
