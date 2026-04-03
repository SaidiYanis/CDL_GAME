import { TitleRankScreen } from "@/src/features/game/components/title-rank-screen";
import { playerRepository } from "@/src/lib/data/player-repository-provider";

export default async function TitleRankPage() {
  const players = await playerRepository.getPlayers();
  const teams = await playerRepository.getTeams();

  return <TitleRankScreen players={players} teams={teams} />;
}
