import {
  collection,
  getDocs,
  orderBy,
  query,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from "firebase/firestore";
import type { PlayerRepository } from "@/src/features/players/services/player-repository";
import { firebaseDb } from "@/src/lib/firebase/client";
import type { Player, Team } from "@/src/types";

const playerConverter: FirestoreDataConverter<Player> = {
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions,
  ): Player {
    const data = snapshot.data(options) as Omit<Player, "id">;
    return {
      id: snapshot.id,
      birthDate: data.birthDate,
      country: data.country,
      imageUrl: data.imageUrl,
      majorTitleCount: data.majorTitleCount,
      name: data.name,
      rating: data.rating,
      role: data.role,
      slug: data.slug,
      teamTag: data.teamTag,
      worldTitleCount: data.worldTitleCount,
    };
  },
  toFirestore(player: Player): Omit<Player, "id"> {
    return {
      birthDate: player.birthDate,
      country: player.country,
      imageUrl: player.imageUrl,
      majorTitleCount: player.majorTitleCount,
      name: player.name,
      rating: player.rating,
      role: player.role,
      slug: player.slug,
      teamTag: player.teamTag,
      worldTitleCount: player.worldTitleCount,
    };
  },
};

const teamConverter: FirestoreDataConverter<Team> = {
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Team {
    const data = snapshot.data(options) as Omit<Team, "id" | "players">;
    return {
      id: snapshot.id,
      logoUrl: data.logoUrl,
      name: data.name,
      players: [],
      slug: data.slug,
      tag: data.tag,
    };
  },
  toFirestore(team: Team): Omit<Team, "id" | "players"> {
    return {
      logoUrl: team.logoUrl,
      name: team.name,
      slug: team.slug,
      tag: team.tag,
    };
  },
};

function getFirebaseDbOrThrow() {
  if (!firebaseDb) {
    throw new Error("Firebase Firestore n'est pas configure.");
  }

  return firebaseDb;
}

export class FirebasePlayerRepository implements PlayerRepository {
  async getPlayers(): Promise<Player[]> {
    const db = getFirebaseDbOrThrow();

    const playersSnapshot = await getDocs(
      query(
        collection(db, "players").withConverter(playerConverter),
        orderBy("name", "asc"),
      ),
    );

    return playersSnapshot.docs.map((playerDoc) => playerDoc.data());
  }

  async getTeams(): Promise<Team[]> {
    const db = getFirebaseDbOrThrow();

    const [teamsSnapshot, players] = await Promise.all([
      getDocs(
        query(
          collection(db, "teams").withConverter(teamConverter),
          orderBy("name", "asc"),
        ),
      ),
      this.getPlayers(),
    ]);

    return teamsSnapshot.docs.map((teamDoc) => {
      const team = teamDoc.data();
      return {
        ...team,
        players: players.filter((player) => player.teamTag === team.tag),
      };
    });
  }

  async getPlayerById(playerId: string): Promise<Player | null> {
    const players = await this.getPlayers();
    return players.find((player) => player.id === playerId) ?? null;
  }

  async getTeamByTag(teamTag: string): Promise<Team | null> {
    const teams = await this.getTeams();
    return teams.find((team) => team.tag === teamTag) ?? null;
  }
}

export const firebasePlayerRepository = new FirebasePlayerRepository();
