import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/src/lib/firebase/admin";
import {
  forceServerGameLoss,
  type AnyServerGameState,
} from "@/src/lib/game/server-game-session-engine";
import { GAME_MODE_IDS, type GameModeId } from "@/src/types";

const MIN_DURATION_MS_PER_POINT = 120;
const MAX_ACCEPTED_SCORE = 10000;

interface FinishGameSessionBody {
  modeId?: unknown;
  sessionId?: unknown;
}

interface PersistedGameSession {
  gameState: AnyServerGameState;
  modeId: GameModeId;
  playedAt: string;
  startedAt?: string;
  status: "playing" | "lost" | "completed";
  uid: string | null;
}

function getBearerToken(request: Request): string | null {
  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim() || null;
}

function isGameModeId(value: unknown): value is GameModeId {
  return (
    typeof value === "string" &&
    GAME_MODE_IDS.includes(value as GameModeId)
  );
}

function parseFinishBody(body: FinishGameSessionBody): {
  modeId: GameModeId;
  sessionId: string;
} {
  if (
    !isGameModeId(body.modeId) ||
    typeof body.sessionId !== "string" ||
    body.sessionId.trim().length === 0
  ) {
    throw new Error("Payload de session invalide.");
  }

  return {
    modeId: body.modeId,
    sessionId: body.sessionId.trim(),
  };
}

function assertScoreIsPlausible(score: number, durationMs: number): void {
  const minimumExpectedDurationMs = score * MIN_DURATION_MS_PER_POINT;

  if (durationMs < minimumExpectedDurationMs) {
    throw new Error("Score refuse: duree de session incoherente.");
  }
}

function createModeDocumentId(uid: string, modeId: GameModeId): string {
  return `${uid}_${modeId}`;
}

export async function POST(request: Request) {
  try {
    const idToken = getBearerToken(request);

    const { modeId, sessionId } = parseFinishBody(
      (await request.json()) as FinishGameSessionBody,
    );
    const decodedToken = idToken
      ? await getFirebaseAdminAuth().verifyIdToken(idToken)
      : null;
    const db = getFirebaseAdminDb();
    const now = new Date();
    const sessionDocumentRef = db.collection("gameSessions").doc(sessionId);

    const nextBestScore = await db.runTransaction(async (transaction) => {
      const sessionSnapshot = await transaction.get(sessionDocumentRef);

      if (!sessionSnapshot.exists) {
        throw new Error("Session serveur introuvable.");
      }

      const session = sessionSnapshot.data() as PersistedGameSession;

      if (
        session.modeId !== modeId ||
        (session.uid !== null && session.uid !== decodedToken?.uid) ||
        (session.uid === null && decodedToken)
      ) {
        throw new Error("Session serveur non autorisee.");
      }

      const forfeitedGameState = forceServerGameLoss(session.gameState);
      const score = forfeitedGameState.score;

      if (score > MAX_ACCEPTED_SCORE) {
        throw new Error("Score refuse: valeur incoherente.");
      }

      const bestScoreDocumentRef = session.uid
        ? db
            .collection("userBestScores")
            .doc(createModeDocumentId(session.uid, modeId))
        : null;
      const statsDocumentRef = session.uid
        ? db
            .collection("userGameStats")
            .doc(createModeDocumentId(session.uid, modeId))
        : null;
      const [bestScoreSnapshot, statsSnapshot] =
        bestScoreDocumentRef && statsDocumentRef
          ? await Promise.all([
              transaction.get(bestScoreDocumentRef),
              transaction.get(statsDocumentRef),
            ])
          : [null, null];

      if (session.status !== "playing") {
        return forfeitedGameState.bestScore;
      }

      const sessionStartDate = new Date(session.startedAt ?? session.playedAt);
      const durationMs = Math.max(
        0,
        now.getTime() - sessionStartDate.getTime(),
      );

      assertScoreIsPlausible(score, durationMs);

      transaction.set(
        sessionDocumentRef,
        {
          durationMs,
          gameState: forfeitedGameState,
          modeId,
          playedAt: now.toISOString(),
          score,
          status: "lost",
          uid: session.uid,
        },
        { merge: true },
      );

      if (!session.uid || !decodedToken) {
        transaction.set(
          sessionDocumentRef,
          {
            finishedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        return forfeitedGameState.bestScore;
      }

      const displayName = decodedToken.name ?? "Player";
      const photoUrl = decodedToken.picture ?? null;
      const currentBestScore = bestScoreSnapshot?.exists
        ? Number(bestScoreSnapshot.data()?.bestScore) || 0
        : 0;
      const computedBestScore = Math.max(currentBestScore, score);

      if (computedBestScore > currentBestScore) {
        transaction.set(bestScoreDocumentRef!, {
          bestScore: computedBestScore,
          displayName,
          modeId,
          photoUrl,
          uid: session.uid,
          updatedAt: now.toISOString(),
        });
      }

      const currentGamesPlayed = statsSnapshot?.exists
        ? Number(statsSnapshot.data()?.gamesPlayed) || 0
        : 0;
      const currentTotalScore = statsSnapshot?.exists
        ? Number(statsSnapshot.data()?.totalScore) || 0
        : 0;
      const nextGamesPlayed = currentGamesPlayed + 1;
      const nextTotalScore = currentTotalScore + score;
      const currentStatsBestScore = statsSnapshot?.exists
        ? Number(statsSnapshot.data()?.bestScore) || 0
        : 0;

      transaction.set(statsDocumentRef!, {
        averageScore: nextTotalScore / nextGamesPlayed,
        bestScore: Math.max(currentStatsBestScore, computedBestScore),
        gamesPlayed: nextGamesPlayed,
        lastPlayedAt: now.toISOString(),
        modeId,
        totalScore: nextTotalScore,
        uid: session.uid,
      });

      transaction.set(
        sessionDocumentRef,
        {
          finishedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      return computedBestScore;
    });

    return NextResponse.json({
      bestScore: nextBestScore,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Synchronisation serveur impossible.",
      },
      { status: 400 },
    );
  }
}
