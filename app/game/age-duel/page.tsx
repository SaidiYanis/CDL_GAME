import { AgeDuelScreen } from "@/src/features/game/components/age-duel-screen";
import { playerRepository } from "@/src/lib/data/player-repository-provider";

export default async function AgeDuelPage() {
  const players = await playerRepository.getPlayers();
  const teams = await playerRepository.getTeams();

  return <AgeDuelScreen players={players} teams={teams} />;
}
