import { RoleSortScreen } from "@/src/features/game/components/role-sort-screen";
import { playerRepository } from "@/src/lib/data/player-repository-provider";

export default async function RoleSortPage() {
  const players = await playerRepository.getPlayers();
  const teams = await playerRepository.getTeams();

  return <RoleSortScreen players={players} teams={teams} />;
}
