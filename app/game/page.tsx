import { GameScreen } from "@/src/features/game/components/game-screen";
import { localPlayerRepository } from "@/src/lib/data/local-player-repository";

export default async function GamePage() {
  const players = await localPlayerRepository.getPlayers();

  return <GameScreen players={players} />;
}
