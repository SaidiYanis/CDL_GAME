"use client";

import { useEffect, useRef } from "react";
import { useGoogleAuthSession } from "@/src/features/auth/hooks/use-google-auth-session";
import { firestoreScoreRepository } from "@/src/lib/data/firebase-score-repository";
import { localScoreRepository } from "@/src/lib/data/local-score-repository";
import type { GameModeId, GameStatus } from "@/src/types";

interface UseGameScoreSyncParams {
  bestScore: number;
  modeId: GameModeId;
  score: number;
  status: GameStatus;
}

export function useGameScoreSync({
  bestScore,
  modeId,
  score,
  status,
}: UseGameScoreSyncParams) {
  const { authState } = useGoogleAuthSession();
  const hasSeenPlayingStateRef = useRef(status === "playing");
  const lastSyncedLossKeyRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    localScoreRepository.saveBestScore(modeId, bestScore);
  }, [bestScore, modeId]);

  useEffect(() => {
    if (status === "playing") {
      if (!hasSeenPlayingStateRef.current) {
        hasSeenPlayingStateRef.current = true;
        lastSyncedLossKeyRef.current = null;
        sessionStartedAtRef.current = Date.now();
      }

      if (sessionStartedAtRef.current === null) {
        sessionStartedAtRef.current = Date.now();
      }

      return;
    }

    if (
      status !== "lost" ||
      !hasSeenPlayingStateRef.current ||
      !authState.userProfile
    ) {
      return;
    }

    const userProfile = authState.userProfile;
    const syncKey = `${userProfile.uid}:${modeId}:${score}:${bestScore}`;

    if (lastSyncedLossKeyRef.current === syncKey) {
      return;
    }

    lastSyncedLossKeyRef.current = syncKey;
    hasSeenPlayingStateRef.current = false;

    const sessionStartedAt = sessionStartedAtRef.current ?? Date.now();
    const session = {
      durationMs: Math.max(0, Date.now() - sessionStartedAt),
      modeId,
      playedAt: new Date().toISOString(),
      score,
      status: "lost" as const,
      uid: userProfile.uid,
    };

    void (async () => {
      try {
        const syncedBestScore = await firestoreScoreRepository.saveUserBestScore(
          userProfile,
          modeId,
          bestScore,
        );

        await firestoreScoreRepository.saveGameSession(session);
        await firestoreScoreRepository.upsertUserGameStats(
          session,
          syncedBestScore,
        );
      } catch (error) {
        console.warn(
          "[useGameScoreSync] Synchronisation Firestore impossible.",
          error,
        );
      }
    })();
  }, [authState.userProfile, bestScore, modeId, score, status]);
}
