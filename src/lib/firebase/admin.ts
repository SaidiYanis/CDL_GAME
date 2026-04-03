import "server-only";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const DEFAULT_SERVICE_ACCOUNT_PATH =
  "cdl-survival-game-firebase-adminsdk-fbsvc-2c8cbdb37b.json";

function readLocalServiceAccount(): object | null {
  const serviceAccountPath = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_PATH ??
      DEFAULT_SERVICE_ACCOUNT_PATH,
  );

  if (!existsSync(serviceAccountPath)) {
    return null;
  }

  return JSON.parse(readFileSync(serviceAccountPath, "utf-8")) as object;
}

function resolveServiceAccount(): object | null {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) as object;
  }

  try {
    return readLocalServiceAccount();
  } catch (error) {
    console.warn("[firebase-admin] Lecture service account locale impossible.", error);
    return null;
  }
}

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0] as App;
  }

  const serviceAccount = resolveServiceAccount();

  if (!serviceAccount) {
    throw new Error(
      "Firebase Admin non configure. Ajoute FIREBASE_SERVICE_ACCOUNT_JSON ou un fichier *-firebase-adminsdk-*.json local ignore par Git.",
    );
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}
