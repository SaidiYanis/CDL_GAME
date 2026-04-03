import type { Player, Team } from "@/src/types";

export interface PlayerRepository {
  getPlayers(): Promise<Player[]>;
  getTeams(): Promise<Team[]>;
  getPlayerById(playerId: string): Promise<Player | null>;
  getTeamByTag(teamTag: string): Promise<Team | null>;
}
