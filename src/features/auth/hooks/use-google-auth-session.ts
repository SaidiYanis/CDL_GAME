"use client";

import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import { firebaseUserProfileRepository } from "@/src/lib/data/firebase-user-profile-repository";
import { firebaseAuth } from "@/src/lib/firebase/client";
import type { AuthenticatedUserProfile } from "@/src/types";

interface GoogleAuthSessionState {
  errorMessage: string | null;
  isAuthReady: boolean;
  isSubmitting: boolean;
  userProfile: AuthenticatedUserProfile | null;
}

const googleAuthProvider = new GoogleAuthProvider();

function toUserProfile(
  firebaseUser: NonNullable<typeof firebaseAuth>["currentUser"],
): AuthenticatedUserProfile | null {
  if (!firebaseUser?.email || !firebaseUser.displayName) {
    return null;
  }

  return {
    displayName: firebaseUser.displayName,
    email: firebaseUser.email,
    photoUrl: firebaseUser.photoURL,
    provider: "google",
    uid: firebaseUser.uid,
  };
}

export function useGoogleAuthSession() {
  const [authState, setAuthState] = useState<GoogleAuthSessionState>({
    errorMessage: null,
    isAuthReady: false,
    isSubmitting: false,
    userProfile: null,
  });

  useEffect(() => {
    if (!firebaseAuth) {
      setAuthState((currentState) => ({
        ...currentState,
        errorMessage:
          "Firebase Auth non configure. Renseigne .env.local pour activer Google.",
        isAuthReady: true,
      }));
      return;
    }

    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      const userProfile = toUserProfile(firebaseUser);

      if (userProfile) {
        await firebaseUserProfileRepository.saveUserProfile(userProfile);
      }

      setAuthState((currentState) => ({
        ...currentState,
        errorMessage: null,
        isAuthReady: true,
        userProfile,
      }));
    });
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    if (!firebaseAuth) {
      setAuthState((currentState) => ({
        ...currentState,
        errorMessage: "Firebase Auth indisponible.",
      }));
      return;
    }

    setAuthState((currentState) => ({
      ...currentState,
      errorMessage: null,
      isSubmitting: true,
    }));

    try {
      const authResult = await signInWithPopup(firebaseAuth, googleAuthProvider);
      const userProfile = toUserProfile(authResult.user);

      if (userProfile) {
        await firebaseUserProfileRepository.saveUserProfile(userProfile);
      }
    } catch (error) {
      setAuthState((currentState) => ({
        ...currentState,
        errorMessage:
          error instanceof Error
            ? error.message
            : "Connexion Google impossible.",
      }));
    } finally {
      setAuthState((currentState) => ({
        ...currentState,
        isSubmitting: false,
      }));
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!firebaseAuth) {
      return;
    }

    setAuthState((currentState) => ({
      ...currentState,
      isSubmitting: true,
    }));

    try {
      await signOut(firebaseAuth);
    } finally {
      setAuthState((currentState) => ({
        ...currentState,
        isSubmitting: false,
      }));
    }
  }, []);

  return {
    authState,
    handleSignInWithGoogle,
    handleSignOut,
  };
}
