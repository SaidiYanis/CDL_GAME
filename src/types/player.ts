export type PlayerRole = "AR" | "SMG";

export interface Player {
  id: string;
  name: string;
  slug: string;
  role: PlayerRole | null;
  birthDate: string | null;
  country: string | null;
  worldTitleCount: number | null;
  majorTitleCount: number | null;
  rating: number | null;
  teamTag: string;
  imageUrl: string;
}

export interface LocalCdlPlayerRecord {
  name: string;
  role: PlayerRole | null;
  birthDate: string;
  country: string | null;
  world_title: number | null;
  major_title: number | null;
  team: string;
  img: string;
  note: number | null;
}
