"use client";

import {
  browserLocalPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
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

googleAuthProvider.setCustomParameters({
  prompt: "select_account",
});

function resolveAuthErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Connexion Google impossible.";
  }

  if (error.message.includes("auth/unauthorized-domain")) {
    return "Domaine non autorise dans Firebase Auth. Ajoute localhost dans Authentication > Settings > Authorized domains.";
  }

  if (error.message.includes("auth/popup-blocked")) {
    return "Popup Google bloquee par le navigateur. Une redirection va etre tentee.";
  }

  if (error.message.includes("auth/operation-not-allowed")) {
    return "Provider Google non active dans Firebase Authentication.";
  }

  return error.message;
}

function toUserProfile(firebaseUser: User | null): AuthenticatedUserProfile | null {
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

    void setPersistence(firebaseAuth, browserLocalPersistence).catch(() => {
      // Keep auth usable even if browser storage persistence cannot be set.
    });

    void getRedirectResult(firebaseAuth).catch((error) => {
      setAuthState((currentState) => ({
        ...currentState,
        errorMessage: resolveAuthErrorMessage(error),
        isAuthReady: true,
      }));
    });

    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      const userProfile = toUserProfile(firebaseUser);
      let errorMessage: string | null = null;

      if (userProfile) {
        try {
          await firebaseUserProfileRepository.saveUserProfile(userProfile);
        } catch (error) {
          errorMessage = `Connecte a Google, mais sync profil Firestore impossible: ${resolveAuthErrorMessage(error)}`;
        }
      }

      setAuthState((currentState) => ({
        ...currentState,
        errorMessage,
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
        try {
          await firebaseUserProfileRepository.saveUserProfile(userProfile);
        } catch (error) {
          setAuthState((currentState) => ({
            ...currentState,
            errorMessage: `Connexion Google OK, mais sync profil Firestore impossible: ${resolveAuthErrorMessage(error)}`,
            userProfile,
          }));
        }
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("auth/popup-blocked") ||
          error.message.includes("auth/operation-not-supported-in-this-environment"))
      ) {
        await signInWithRedirect(firebaseAuth, googleAuthProvider);
        return;
      }

      setAuthState((currentState) => ({
        ...currentState,
        errorMessage: resolveAuthErrorMessage(error),
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
