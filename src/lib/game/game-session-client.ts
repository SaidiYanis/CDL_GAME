import type {
  AnyServerGameState,
  ServerGameAnswerByMode,
  ServerGameStateByMode,
} from "@/src/lib/game/server-game-session-engine";
import { firebaseAuth } from "@/src/lib/firebase/client";
import type { GameModeId } from "@/src/types";

interface StartGameSessionPayload<M extends GameModeId> {
  gameState: ServerGameStateByMode[M];
  sessionId: string;
}

interface SubmitGameSessionPayload<M extends GameModeId> {
  gameState: ServerGameStateByMode[M];
  isCorrectAnswer: boolean;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  await firebaseAuth?.authStateReady();

  const idToken = await firebaseAuth?.currentUser?.getIdToken();

  if (!idToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${idToken}`,
  };
}

async function postJson<TPayload>(
  route: string,
  body: Record<string, unknown>,
  keepalive = false,
): Promise<TPayload> {
  const response = await fetch(route, {
    body: JSON.stringify(body),
    headers: {
      ...(await getAuthHeader()),
      "Content-Type": "application/json",
    },
    keepalive,
    method: "POST",
  });
  const payload = (await response.json()) as { error?: string } & TPayload;

  if (!response.ok) {
    throw new Error(payload.error ?? "Requete de session refusee.");
  }

  return payload;
}

export function startGameSession<M extends GameModeId>(
  modeId: M,
  localBestScore: number,
): Promise<StartGameSessionPayload<M>> {
  return postJson<StartGameSessionPayload<M>>("/api/game-sessions/start", {
    localBestScore,
    modeId,
  });
}

export function submitGameSessionAnswer<M extends GameModeId>(
  modeId: M,
  sessionId: string,
  answer: ServerGameAnswerByMode[M],
): Promise<SubmitGameSessionPayload<M>> {
  return postJson<SubmitGameSessionPayload<M>>("/api/game-sessions/submit", {
    answer,
    modeId,
    sessionId,
  });
}

export function finishGameSession(
  modeId: GameModeId,
  sessionId: string,
): Promise<{ bestScore: number }> {
  return postJson<{ bestScore: number }>(
    "/api/game-sessions/finish",
    {
      modeId,
      sessionId,
    },
    true,
  );
}

export type { AnyServerGameState, ServerGameStateByMode };
