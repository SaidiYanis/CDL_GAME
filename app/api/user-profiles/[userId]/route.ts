import { NextResponse } from "next/server";
import { getFirebaseAdminDb } from "@/src/lib/firebase/admin";
import { GAME_MODE_IDS, type UserGameStatsDocument, type UserProfileDocument } from "@/src/types";

interface UserProfileApiParams {
  params: Promise<{
    userId: string;
  }>;
}

async function getUserGameStats(
  userId: string,
): Promise<UserGameStatsDocument[]> {
  const db = getFirebaseAdminDb();
  const statsSnapshots = await Promise.all(
    GAME_MODE_IDS.map((modeId) =>
      db.collection("userGameStats").doc(`${userId}_${modeId}`).get(),
    ),
  );

  return statsSnapshots
    .filter((statsSnapshot) => statsSnapshot.exists)
    .map(
      (statsSnapshot) => statsSnapshot.data() as UserGameStatsDocument,
    );
}

export async function GET(_request: Request, { params }: UserProfileApiParams) {
  try {
    const { userId } = await params;
    const trimmedUserId = userId.trim();

    if (!trimmedUserId) {
      return NextResponse.json(
        { error: "userId invalide." },
        { status: 400 },
      );
    }

    const [userSnapshot, statsDocuments] = await Promise.all([
      getFirebaseAdminDb().collection("users").doc(trimmedUserId).get(),
      getUserGameStats(trimmedUserId),
    ]);

    if (!userSnapshot.exists) {
      return NextResponse.json(
        { error: "Profil joueur introuvable." },
        { status: 404 },
      );
    }

    const userProfile = userSnapshot.data() as UserProfileDocument;

    return NextResponse.json({
      statsDocuments,
      userProfile: {
        displayName: userProfile.displayName,
        photoUrl: userProfile.photoUrl,
        uid: userProfile.uid,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Chargement du profil impossible.",
      },
      { status: 500 },
    );
  }
}
