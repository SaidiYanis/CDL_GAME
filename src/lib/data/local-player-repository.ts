import rawCdlData from "@/src/lib/data/cdl-data.json";
import type { PlayerRepository } from "@/src/features/players/services/player-repository";
import { validateLocalCdlDataSet } from "@/src/lib/data/local-cdl-data-validation";
import { slugify } from "@/src/lib/utils/slugify";
import type {
  LocalCdlDataSet,
  LocalCdlPlayerRecord,
  LocalCdlTeamRecord,
  Player,
  Team,
} from "@/src/types";

const localCdlData = rawCdlData as LocalCdlDataSet;

function normalizeBirthDate(birthDate: string): string | null {
  return birthDate === "YYYY-MM-DD" ? null : birthDate;
}

function mapPlayerRecord(playerRecord: LocalCdlPlayerRecord): Player {
  const playerSlug = slugify(playerRecord.name);

  return {
    id: `${playerRecord.team.toLowerCase()}-${playerSlug}`,
    name: playerRecord.name,
    slug: playerSlug,
    role: playerRecord.role,
    birthDate: normalizeBirthDate(playerRecord.birthDate),
    country: playerRecord.country,
    worldTitleCount: playerRecord.world_title,
    majorTitleCount: playerRecord.major_title,
    rating: playerRecord.note,
    teamTag: playerRecord.team,
    imageUrl: playerRecord.img,
  };
}

function mapTeamRecord(teamRecord: LocalCdlTeamRecord): Team {
  return {
    id: teamRecord.tag.toLowerCase(),
    name: teamRecord.name,
    slug: slugify(teamRecord.name),
    tag: teamRecord.tag,
    logoUrl: teamRecord.img,
    players: teamRecord.players.map(mapPlayerRecord),
  };
}

export class LocalPlayerRepository implements PlayerRepository {
  private readonly issues: string[];
  private readonly teams: Team[];
  private readonly players: Player[];

  constructor(dataSet: LocalCdlDataSet = localCdlData) {
    const validationResult = validateLocalCdlDataSet(dataSet);

    this.issues = validationResult.issues;
    this.teams = validationResult.teams.map(mapTeamRecord);
    this.players = this.teams.flatMap((team) => team.players);

    if (this.issues.length > 0) {
      console.warn(
        `[LocalPlayerRepository] ${this.issues.length} probleme(s) detecte(s):`,
        this.issues,
      );
    }
  }

  async getPlayers(): Promise<Player[]> {
    return this.players;
  }

  async getTeams(): Promise<Team[]> {
    return this.teams;
  }

  async getPlayerById(playerId: string): Promise<Player | null> {
    return this.players.find((player) => player.id === playerId) ?? null;
  }

  async getTeamByTag(teamTag: string): Promise<Team | null> {
    return this.teams.find((team) => team.tag === teamTag) ?? null;
  }

  async getValidationIssues(): Promise<string[]> {
    return this.issues;
  }
}

export const localPlayerRepository = new LocalPlayerRepository();
