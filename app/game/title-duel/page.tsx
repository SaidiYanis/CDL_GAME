import { TitleDuelScreen } from "@/src/features/game/components/title-duel-screen";
import { localPlayerRepository } from "@/src/lib/data/local-player-repository";

export default async function TitleDuelPage() {
  const players = await localPlayerRepository.getPlayers();
  const teams = await localPlayerRepository.getTeams();

  return <TitleDuelScreen players={players} teams={teams} />;
}
