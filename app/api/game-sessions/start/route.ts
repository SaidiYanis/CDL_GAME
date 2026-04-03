import { NextResponse } from "next/server";
import { getServerPlayers } from "@/src/lib/data/firebase-admin-player-repository";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "@/src/lib/firebase/admin";
import { startServerGameSession } from "@/src/lib/game/server-game-session-engine";
import { GAME_MODE_IDS, type GameModeId } from "@/src/types";

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

export async function POST(request: Request) {
  try {
    const idToken = getBearerToken(request);
    const body = (await request.json()) as {
      localBestScore?: unknown;
      modeId?: unknown;
    };

    if (!isGameModeId(body.modeId)) {
      return NextResponse.json(
        { error: "modeId invalide." },
        { status: 400 },
      );
    }

    const decodedToken = idToken
      ? await getFirebaseAdminAuth().verifyIdToken(idToken)
      : null;
    const localBestScore =
      typeof body.localBestScore === "number" &&
      Number.isInteger(body.localBestScore) &&
      body.localBestScore >= 0
        ? body.localBestScore
        : 0;
    const bestScoreDocumentSnapshot = decodedToken
      ? await getFirebaseAdminDb()
          .collection("userBestScores")
          .doc(`${decodedToken.uid}_${body.modeId}`)
          .get()
      : null;
    const cloudBestScore = bestScoreDocumentSnapshot?.exists
      ? Number(bestScoreDocumentSnapshot.data()?.bestScore) || 0
      : 0;
    const players = await getServerPlayers();
    const gameState = startServerGameSession(
      body.modeId,
      players,
      decodedToken ? Math.max(localBestScore, cloudBestScore) : localBestScore,
    );
    const startedAt = new Date().toISOString();
    const sessionDocumentRef = getFirebaseAdminDb()
      .collection("gameSessions")
      .doc();

    await sessionDocumentRef.set({
      durationMs: 0,
      gameState,
      modeId: body.modeId,
      playedAt: startedAt,
      score: gameState.score,
      startedAt,
      status: gameState.status,
      uid: decodedToken?.uid ?? null,
    });

    return NextResponse.json({
      gameState,
      sessionId: sessionDocumentRef.id,
      startedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Creation de session impossible.",
      },
      { status: 500 },
    );
  }
}
