import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { GAME_MODE_IDS } from "../src/types";
import { slugify } from "../src/lib/utils/slugify";
import type { Player, PlayerRole, Team } from "../src/types";
const DEFAULT_IMPORT_SOURCE_PATH = path.resolve(
  process.cwd(),
  "scripts/firestore-import-data.local.json",
);

interface FirestoreImportPlayerRecord {
  birthDate: string;
  country: string | null;
  img: string;
  major_title: number | null;
  name: string;
  note: number | null;
  role: PlayerRole | null;
  team: string;
  world_title: number | null;
}

interface FirestoreImportTeamRecord {
  img: string;
  name: string;
  players: FirestoreImportPlayerRecord[];
  tag: string;
}

interface FirestoreImportDataSet {
  teams: FirestoreImportTeamRecord[];
}

function normalizeBirthDate(birthDate: string): string | null {
  return birthDate === "YYYY-MM-DD" ? null : birthDate;
}

async function readImportDataSet(): Promise<FirestoreImportDataSet> {
  const importSourcePath =
    process.env.FIRESTORE_IMPORT_SOURCE_PATH ?? DEFAULT_IMPORT_SOURCE_PATH;
  const rawImportData = await readFile(importSourcePath, "utf-8");

  return JSON.parse(rawImportData) as FirestoreImportDataSet;
}

function mapSeedData(dataSet: FirestoreImportDataSet) {
  const teams: Team[] = dataSet.teams.map((teamRecord) => ({
    id: teamRecord.tag.toLowerCase(),
    logoUrl: teamRecord.img,
    name: teamRecord.name,
    players: [],
    slug: slugify(teamRecord.name),
    tag: teamRecord.tag,
  }));

  const players: Player[] = dataSet.teams.flatMap((teamRecord) =>
    teamRecord.players.map((playerRecord) => {
      const playerSlug = slugify(playerRecord.name);

      return {
        id: `${playerRecord.team.toLowerCase()}-${playerSlug}`,
        birthDate: normalizeBirthDate(playerRecord.birthDate),
        country: playerRecord.country,
        imageUrl: playerRecord.img,
        majorTitleCount: playerRecord.major_title,
        name: playerRecord.name,
        rating: playerRecord.note,
        role: playerRecord.role,
        slug: playerSlug,
        teamTag: playerRecord.team,
        worldTitleCount: playerRecord.world_title,
      } satisfies Player;
    }),
  );

  return { players, teams };
}

async function importFirestore() {
  if (getApps().length === 0) {
    initializeApp({
      credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
        : applicationDefault(),
    });
  }

  const db = getFirestore();
  const { players, teams } = mapSeedData(await readImportDataSet());
  const now = new Date().toISOString();
  const batch = db.batch();

  teams.forEach(({ players, ...team }) => {
    void players;
    batch.set(db.collection("teams").doc(team.id), team);
  });

  players.forEach((player) => {
    batch.set(db.collection("players").doc(player.id), player);
  });

  GAME_MODE_IDS.forEach((modeId) => {
    batch.set(
      db.collection("leaderboards").doc(modeId),
      {
        modeId,
        topPlayers: [],
        updatedAt: now,
      },
      { merge: true },
    );
  });

  await batch.commit();

  console.log(
    `[import-firestore] OK: ${teams.length} teams, ${players.length} players, ${GAME_MODE_IDS.length} leaderboards importes.`,
  );
  console.log(
    "[import-firestore] Les collections users, userBestScores, userGameStats et gameSessions seront remplies par l'app au login Google et a la fin des parties.",
  );
}

importFirestore().catch((error) => {
  console.error("[import-firestore] Echec import Firestore:", error);
  console.error(
    "[import-firestore] Definis FIRESTORE_IMPORT_SOURCE_PATH ou cree scripts/firestore-import-data.local.json (ignore par Git).",
  );
  process.exitCode = 1;
});
