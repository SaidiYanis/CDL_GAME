import rawCdlData from "@/src/lib/data/cdl-data.json";
import type { PlayerRepository } from "@/src/features/players/services/player-repository";
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
  private readonly teams: Team[];
  private readonly players: Player[];

  constructor(dataSet: LocalCdlDataSet = localCdlData) {
    this.teams = dataSet.teams.map(mapTeamRecord);
    this.players = this.teams.flatMap((team) => team.players);
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
}

export const localPlayerRepository = new LocalPlayerRepository();
