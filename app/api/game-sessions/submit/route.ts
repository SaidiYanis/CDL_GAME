import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getServerPlayers } from "@/src/lib/data/firebase-admin-player-repository";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/src/lib/firebase/admin";
import {
  serializeServerGameState,
  submitServerGameAnswer,
  type AnyServerGameAnswer,
  type AnyServerGameState,
} from "@/src/lib/game/server-game-session-engine";
import { GAME_MODE_IDS, type GameModeId } from "@/src/types";

const MAX_ACCEPTED_SCORE = 10000;

interface SubmitGameSessionBody {
  answer?: unknown;
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

function createModeDocumentId(uid: string, modeId: GameModeId): string {
  return `${uid}_${modeId}`;
}

async function persistCompletedRun(
  session: PersistedGameSession,
  score: number,
  modeId: GameModeId,
  displayName: string,
  photoUrl: string | null,
): Promise<number> {
  if (!session.uid) {
    return Math.max(session.gameState.bestScore, score);
  }

  const db = getFirebaseAdminDb();
  const now = new Date().toISOString();
  const bestScoreDocumentRef = db
    .collection("userBestScores")
    .doc(createModeDocumentId(session.uid, modeId));
  const statsDocumentRef = db
    .collection("userGameStats")
    .doc(createModeDocumentId(session.uid, modeId));

  return db.runTransaction(async (transaction) => {
    const [bestScoreSnapshot, statsSnapshot] = await Promise.all([
      transaction.get(bestScoreDocumentRef),
      transaction.get(statsDocumentRef),
    ]);
    const currentBestScore = bestScoreSnapshot.exists
      ? Number(bestScoreSnapshot.data()?.bestScore) || 0
      : 0;
    const computedBestScore = Math.max(currentBestScore, score);

    if (computedBestScore > currentBestScore) {
      transaction.set(bestScoreDocumentRef, {
        bestScore: computedBestScore,
        displayName,
        modeId,
        photoUrl,
        uid: session.uid,
        updatedAt: now,
      });
    }

    const currentGamesPlayed = statsSnapshot.exists
      ? Number(statsSnapshot.data()?.gamesPlayed) || 0
      : 0;
    const currentTotalScore = statsSnapshot.exists
      ? Number(statsSnapshot.data()?.totalScore) || 0
      : 0;
    const nextGamesPlayed = currentGamesPlayed + 1;
    const nextTotalScore = currentTotalScore + score;
    const currentStatsBestScore = statsSnapshot.exists
      ? Number(statsSnapshot.data()?.bestScore) || 0
      : 0;

    transaction.set(statsDocumentRef, {
      averageScore: nextTotalScore / nextGamesPlayed,
      bestScore: Math.max(currentStatsBestScore, computedBestScore),
      gamesPlayed: nextGamesPlayed,
      lastPlayedAt: now,
      modeId,
      totalScore: nextTotalScore,
      uid: session.uid,
    });

    return computedBestScore;
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitGameSessionBody;

    if (
      !isGameModeId(body.modeId) ||
      typeof body.sessionId !== "string" ||
      body.sessionId.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Payload de round invalide." },
        { status: 400 },
      );
    }

    const idToken = getBearerToken(request);
    const decodedToken = idToken
      ? await getFirebaseAdminAuth().verifyIdToken(idToken)
      : null;
    const db = getFirebaseAdminDb();
    const sessionDocumentRef = db
      .collection("gameSessions")
      .doc(body.sessionId.trim());
    const sessionSnapshot = await sessionDocumentRef.get();

    if (!sessionSnapshot.exists) {
      return NextResponse.json(
        { error: "Session serveur introuvable." },
        { status: 404 },
      );
    }

    const session = sessionSnapshot.data() as PersistedGameSession;

    if (
      session.modeId !== body.modeId ||
      (session.uid !== null && session.uid !== decodedToken?.uid) ||
      (session.uid === null && decodedToken)
    ) {
      return NextResponse.json(
        { error: "Session serveur non autorisee." },
        { status: 403 },
      );
    }

    if (session.status !== "playing") {
      return NextResponse.json({
        gameState: serializeServerGameState(body.modeId, session.gameState),
        isCorrectAnswer: false,
      });
    }

    const players = await getServerPlayers();
    const { gameState, isCorrectAnswer } = submitServerGameAnswer(
      body.modeId,
      session.gameState as never,
      players,
      body.answer as AnyServerGameAnswer,
    );

    if (gameState.score > MAX_ACCEPTED_SCORE) {
      return NextResponse.json(
        { error: "Score refuse: valeur incoherente." },
        { status: 400 },
      );
    }

    const now = new Date();
    const sessionStartDate = new Date(session.startedAt ?? session.playedAt);
    const durationMs = Math.max(0, now.getTime() - sessionStartDate.getTime());
    let bestScore = gameState.bestScore;

    await sessionDocumentRef.set(
      {
        durationMs,
        gameState,
        modeId: body.modeId,
        playedAt: now.toISOString(),
        score: gameState.score,
        status: gameState.status,
        uid: session.uid,
      },
      { merge: true },
    );

    if (gameState.status === "lost") {
      bestScore = await persistCompletedRun(
        session,
        gameState.score,
        body.modeId,
        decodedToken?.name ?? "Player",
        decodedToken?.picture ?? null,
      );

      await sessionDocumentRef.set(
        {
          finishedAt: FieldValue.serverTimestamp(),
          gameState: {
            ...gameState,
            bestScore,
          },
        },
        { merge: true },
      );
    }

    return NextResponse.json({
      gameState: serializeServerGameState(body.modeId, {
        ...gameState,
        bestScore,
      } as AnyServerGameState),
      isCorrectAnswer,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Validation serveur impossible.",
      },
      { status: 400 },
    );
  }
}
