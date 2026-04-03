import { RoleSortScreen } from "@/src/features/game/components/role-sort-screen";
import { localPlayerRepository } from "@/src/lib/data/local-player-repository";

export default async function RoleSortPage() {
  const players = await localPlayerRepository.getPlayers();
  const teams = await localPlayerRepository.getTeams();

  return <RoleSortScreen players={players} teams={teams} />;
}
