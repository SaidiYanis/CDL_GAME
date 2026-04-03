import type {
  LocalCdlDataSet,
  LocalCdlPlayerRecord,
  LocalCdlTeamRecord,
  PlayerRole,
} from "@/src/types";

interface SanitizedTeamRecord {
  issues: string[];
  teamRecord: LocalCdlTeamRecord | null;
}

function isValidRole(role: LocalCdlPlayerRecord["role"]): role is PlayerRole {
  return role === "AR" || role === "SMG";
}

function isValidRating(value: number | null): value is number {
  return (
    value !== null &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 99
  );
}

function isValidAssetPath(value: string): boolean {
  return value.trim().startsWith("/ressource/") && value.trim().length > 11;
}

function sanitizeBirthDate(value: string): string {
  if (value === "YYYY-MM-DD") {
    return value;
  }

  return Number.isNaN(Date.parse(value)) ? "YYYY-MM-DD" : value;
}

function sanitizePlayerRecord(
  teamTag: string,
  playerRecord: LocalCdlPlayerRecord,
): { issues: string[]; playerRecord: LocalCdlPlayerRecord | null } {
  const issues: string[] = [];
  const playerName = playerRecord.name.trim();

  if (!playerName) {
    return {
      issues: [`${teamTag}: joueur ignore car son nom est vide.`],
      playerRecord: null,
    };
  }

  if (playerRecord.team !== teamTag) {
    issues.push(
      `${playerName}: tag team '${playerRecord.team}' incoherent, remplace par '${teamTag}'.`,
    );
  }

  if (!isValidAssetPath(playerRecord.img)) {
    return {
      issues: [
        ...issues,
        `${playerName}: joueur ignore car le chemin image est invalide.`,
      ],
      playerRecord: null,
    };
  }

  if (playerRecord.role !== null && !isValidRole(playerRecord.role)) {
    issues.push(`${playerName}: role invalide, fallback null.`);
  }

  if (!isValidRating(playerRecord.note)) {
    issues.push(`${playerName}: note BP invalide, fallback null.`);
  }

  return {
    issues,
    playerRecord: {
      ...playerRecord,
      birthDate: sanitizeBirthDate(playerRecord.birthDate),
      img: playerRecord.img.trim(),
      name: playerName,
      note: isValidRating(playerRecord.note) ? playerRecord.note : null,
      role: isValidRole(playerRecord.role) ? playerRecord.role : null,
      team: teamTag,
    },
  };
}

function sanitizeTeamRecord(teamRecord: LocalCdlTeamRecord): SanitizedTeamRecord {
  const issues: string[] = [];
  const teamName = teamRecord.name.trim();
  const teamTag = teamRecord.tag.trim();

  if (!teamName || !teamTag) {
    return {
      issues: ["Une equipe a ete ignoree car son nom ou son tag est vide."],
      teamRecord: null,
    };
  }

  if (!isValidAssetPath(teamRecord.img)) {
    issues.push(`${teamTag}: logo equipe invalide, fallback null dans l'UI.`);
  }

  const players = teamRecord.players
    .map((playerRecord) => sanitizePlayerRecord(teamTag, playerRecord))
    .flatMap((result) => {
      issues.push(...result.issues);
      return result.playerRecord ? [result.playerRecord] : [];
    });

  if (players.length === 0) {
    return {
      issues: [
        ...issues,
        `${teamTag}: equipe ignoree car aucun joueur valide n'a ete conserve.`,
      ],
      teamRecord: null,
    };
  }

  return {
    issues,
    teamRecord: {
      name: teamName,
      tag: teamTag,
      img: isValidAssetPath(teamRecord.img) ? teamRecord.img.trim() : "",
      players,
    },
  };
}

export function validateLocalCdlDataSet(
  dataSet: LocalCdlDataSet,
): { issues: string[]; teams: LocalCdlTeamRecord[] } {
  const issues: string[] = [];
  const teams = dataSet.teams.flatMap((teamRecord) => {
    const validationResult = sanitizeTeamRecord(teamRecord);
    issues.push(...validationResult.issues);
    return validationResult.teamRecord ? [validationResult.teamRecord] : [];
  });

  return { issues, teams };
}
