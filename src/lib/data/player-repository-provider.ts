import type { PlayerRepository } from "@/src/features/players/services/player-repository";
import { env } from "@/src/config/env";
import { localPlayerRepository } from "@/src/lib/data/local-player-repository";

class RepositoryProvider implements PlayerRepository {
  private readonly localRepository = localPlayerRepository;

  private async getActiveRepository(): Promise<PlayerRepository> {
    if (env.dataSource !== "firebase") {
      return this.localRepository;
    }

    try {
      const { firebasePlayerRepository } = await import(
        "@/src/lib/data/firebase-player-repository"
      );

      return firebasePlayerRepository;
    } catch (error) {
      console.warn(
        "[RepositoryProvider] Firebase repository indisponible, fallback local.",
        error,
      );

      return this.localRepository;
    }
  }

  async getPlayers() {
    const repository = await this.getActiveRepository();
    return repository.getPlayers();
  }

  async getTeams() {
    const repository = await this.getActiveRepository();
    return repository.getTeams();
  }

  async getPlayerById(playerId: string) {
    const repository = await this.getActiveRepository();
    return repository.getPlayerById(playerId);
  }

  async getTeamByTag(teamTag: string) {
    const repository = await this.getActiveRepository();
    return repository.getTeamByTag(teamTag);
  }
}

export const playerRepository = new RepositoryProvider();
