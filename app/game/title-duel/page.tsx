import { TitleDuelScreen } from "@/src/features/game/components/title-duel-screen";
import { playerRepository } from "@/src/lib/data/player-repository-provider";

export default async function TitleDuelPage() {
  const players = await playerRepository.getPlayers();
  const teams = await playerRepository.getTeams();

  return <TitleDuelScreen players={players} teams={teams} />;
}
