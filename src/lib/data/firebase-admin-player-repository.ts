import "server-only";

import type { Player, Team } from "@/src/types";
import { getFirebaseAdminDb } from "@/src/lib/firebase/admin";

function normalizeOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeOptionalInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function toPlayer(playerId: string, data: FirebaseFirestore.DocumentData): Player {
  return {
    id: playerId,
    birthDate: normalizeOptionalString(data.birthDate),
    country: normalizeOptionalString(data.country),
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    majorTitleCount: normalizeOptionalInteger(data.majorTitleCount),
    name: typeof data.name === "string" ? data.name : "Unknown",
    rating: normalizeOptionalInteger(data.rating),
    role: data.role === "AR" || data.role === "SMG" ? data.role : null,
    slug: typeof data.slug === "string" ? data.slug : playerId,
    teamTag: typeof data.teamTag === "string" ? data.teamTag : "FA",
    worldTitleCount: normalizeOptionalInteger(data.worldTitleCount),
  };
}

function toTeam(teamId: string, data: FirebaseFirestore.DocumentData): Team {
  return {
    id: teamId,
    logoUrl: normalizeOptionalString(data.logoUrl),
    name: typeof data.name === "string" ? data.name : "Unknown",
    players: [],
    slug: typeof data.slug === "string" ? data.slug : teamId,
    tag: typeof data.tag === "string" ? data.tag : teamId,
  };
}

export async function getServerPlayers(): Promise<Player[]> {
  const playersSnapshot = await getFirebaseAdminDb()
    .collection("players")
    .orderBy("name", "asc")
    .get();

  return playersSnapshot.docs.map((playerDoc) =>
    toPlayer(playerDoc.id, playerDoc.data()),
  );
}

export async function getServerTeams(): Promise<Team[]> {
  const [teamsSnapshot, players] = await Promise.all([
    getFirebaseAdminDb().collection("teams").orderBy("name", "asc").get(),
    getServerPlayers(),
  ]);

  return teamsSnapshot.docs.map((teamDoc) => {
    const team = toTeam(teamDoc.id, teamDoc.data());

    return {
      ...team,
      players: players.filter((player) => player.teamTag === team.tag),
    };
  });
}
