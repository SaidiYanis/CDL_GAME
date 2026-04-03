import { RatingDuelScreen } from "@/src/features/game/components/rating-duel-screen";
import { localPlayerRepository } from "@/src/lib/data/local-player-repository";

export default async function RatingDuelPage() {
  const players = await localPlayerRepository.getPlayers();
  const teams = await localPlayerRepository.getTeams();

  return <RatingDuelScreen players={players} teams={teams} />;
}
