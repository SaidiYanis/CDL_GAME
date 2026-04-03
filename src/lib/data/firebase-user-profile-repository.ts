import { doc, getDoc, setDoc } from "firebase/firestore";
import type { UserProfileRepository } from "@/src/features/auth/services/user-profile-repository";
import { firebaseDb } from "@/src/lib/firebase/client";
import type { AuthenticatedUserProfile, UserProfileDocument } from "@/src/types";

function getFirebaseDbOrThrow() {
  if (!firebaseDb) {
    throw new Error("Firebase Firestore n'est pas configure.");
  }

  return firebaseDb;
}

export class FirebaseUserProfileRepository implements UserProfileRepository {
  async saveUserProfile(userProfile: AuthenticatedUserProfile): Promise<void> {
    const db = getFirebaseDbOrThrow();
    const userDocumentRef = doc(db, "users", userProfile.uid);
    const currentSnapshot = await getDoc(userDocumentRef);
    const now = new Date().toISOString();

    await setDoc(
      userDocumentRef,
      {
        ...userProfile,
        createdAt:
          currentSnapshot.exists() && currentSnapshot.data().createdAt
            ? String(currentSnapshot.data().createdAt)
            : now,
        lastLoginAt: now,
      } satisfies UserProfileDocument,
      { merge: true },
    );
  }
}

export const firebaseUserProfileRepository =
  new FirebaseUserProfileRepository();
