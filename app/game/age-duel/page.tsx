import { AgeDuelScreen } from "@/src/features/game/components/age-duel-screen";
import { localPlayerRepository } from "@/src/lib/data/local-player-repository";

export default async function AgeDuelPage() {
  const players = await localPlayerRepository.getPlayers();
  const teams = await localPlayerRepository.getTeams();

  return <AgeDuelScreen players={players} teams={teams} />;
}
