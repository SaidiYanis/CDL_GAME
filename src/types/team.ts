import type { LocalCdlPlayerRecord, Player } from "@/src/types/player";

export interface Team {
  id: string;
  name: string;
  slug: string;
  tag: string;
  logoUrl: string | null;
  players: Player[];
}

export interface LocalCdlTeamRecord {
  name: string;
  tag: string;
  players: LocalCdlPlayerRecord[];
}

export interface LocalCdlDataSet {
  teams: LocalCdlTeamRecord[];
}
