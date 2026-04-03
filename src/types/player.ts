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
