import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import cdlData from "../src/lib/data/cdl-data.json";
import { slugify } from "../src/lib/utils/slugify";
import type { GameModeId, LocalCdlDataSet, Player, Team } from "../src/types";

const GAME_MODE_IDS: GameModeId[] = [
  "guess-player",
  "age-duel",
  "title-duel",
  "rating-duel",
  "role-sort",
];

function normalizeBirthDate(birthDate: string): string | null {
  return birthDate === "YYYY-MM-DD" ? null : birthDate;
}

function mapSeedData(dataSet: LocalCdlDataSet) {
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
  const { players, teams } = mapSeedData(cdlData as LocalCdlDataSet);
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
  process.exitCode = 1;
});
