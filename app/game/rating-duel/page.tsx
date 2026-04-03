import { RatingDuelScreen } from "@/src/features/game/components/rating-duel-screen";
import { playerRepository } from "@/src/lib/data/player-repository-provider";

export default async function RatingDuelPage() {
  const players = await playerRepository.getPlayers();
  const teams = await playerRepository.getTeams();

  return <RatingDuelScreen players={players} teams={teams} />;
}
