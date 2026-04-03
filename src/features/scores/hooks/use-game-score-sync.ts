"use client";

import { useCallback, useEffect, useRef } from "react";
import { localScoreRepository } from "@/src/lib/data/local-score-repository";
import { finishGameSession } from "@/src/lib/game/game-session-client";
import type { GameModeId, GameStatus } from "@/src/types";

interface UseGameScoreSyncParams {
  bestScore: number;
  modeId: GameModeId;
  score: number;
  sessionId: string | null;
  status: GameStatus;
}

export function useGameScoreSync({
  bestScore,
  modeId,
  score,
  sessionId,
  status,
}: UseGameScoreSyncParams) {
  const hasSeenPlayingStateRef = useRef(status === "playing");
  const lastSyncedLossKeyRef = useRef<string | null>(null);

  const syncLossSession = useCallback(
    async (lostScore: number, lostBestScore: number) => {
      localScoreRepository.saveBestScore(modeId, lostBestScore);

      if (!hasSeenPlayingStateRef.current || !sessionId) {
        hasSeenPlayingStateRef.current = false;
        return;
      }

      const syncKey = `${sessionId}:${modeId}:${lostScore}:${lostBestScore}`;

      if (lastSyncedLossKeyRef.current === syncKey) {
        hasSeenPlayingStateRef.current = false;
        return;
      }

      lastSyncedLossKeyRef.current = syncKey;
      hasSeenPlayingStateRef.current = false;

      try {
        await finishGameSession(modeId, sessionId);
      } catch (error) {
        console.warn(
          "[useGameScoreSync] Synchronisation serveur impossible.",
          error,
        );
      }
    },
    [modeId, sessionId],
  );

  useEffect(() => {
    localScoreRepository.saveBestScore(modeId, bestScore);
  }, [bestScore, modeId]);

  useEffect(() => {
    if (status === "playing") {
      if (!hasSeenPlayingStateRef.current) {
        hasSeenPlayingStateRef.current = true;
        lastSyncedLossKeyRef.current = null;
      }

      return;
    }

    if (status !== "lost" || !hasSeenPlayingStateRef.current) {
      return;
    }

    void syncLossSession(score, bestScore);
  }, [
    bestScore,
    score,
    status,
    syncLossSession,
  ]);

  useEffect(() => {
    if (status !== "playing") {
      return;
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
      void syncLossSession(score, bestScore);
    }

    function handlePageHide() {
      void syncLossSession(score, bestScore);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [bestScore, score, status, syncLossSession]);

  return {
    syncCurrentRunLoss: () => syncLossSession(score, bestScore),
  };
}
