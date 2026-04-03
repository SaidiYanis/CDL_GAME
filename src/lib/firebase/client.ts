import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "@/src/lib/firebase/config";

function hasFirebaseConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.appId &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId,
  );
}

export const firebaseApp: FirebaseApp | null = hasFirebaseConfig()
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firebaseAuth: Auth | null = firebaseApp
  ? getAuth(firebaseApp)
  : null;
export const firebaseDb: Firestore | null = firebaseApp
  ? getFirestore(firebaseApp)
  : null;

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (!firebaseApp || typeof window === "undefined") {
    return null;
  }

  const supported = await isSupported();

  return supported ? getAnalytics(firebaseApp) : null;
}
