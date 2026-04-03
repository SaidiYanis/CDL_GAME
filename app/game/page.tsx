import { GameScreen } from "@/src/features/game/components/game-screen";
import { playerRepository } from "@/src/lib/data/player-repository-provider";

export default async function GamePage() {
  const players = await playerRepository.getPlayers();
  const teams = await playerRepository.getTeams();

  return <GameScreen players={players} teams={teams} />;
}
