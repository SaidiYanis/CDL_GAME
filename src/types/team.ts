import type { Player } from "@/src/types/player";

export interface Team {
  id: string;
  name: string;
  slug: string;
  tag: string;
  logoUrl: string | null;
  players: Player[];
}
