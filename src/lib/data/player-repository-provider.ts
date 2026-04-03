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

  private async executeWithFallback<T>(
    repositoryAction: (repository: PlayerRepository) => Promise<T>,
  ): Promise<T> {
    const repository = await this.getActiveRepository();

    try {
      return await repositoryAction(repository);
    } catch (error) {
      if (repository === this.localRepository) {
        throw error;
      }

      console.warn(
        "[RepositoryProvider] Lecture Firebase impossible, fallback local.",
        error,
      );

      return repositoryAction(this.localRepository);
    }
  }

  async getPlayers() {
    return this.executeWithFallback((repository) => repository.getPlayers());
  }

  async getTeams() {
    return this.executeWithFallback((repository) => repository.getTeams());
  }

  async getPlayerById(playerId: string) {
    return this.executeWithFallback((repository) =>
      repository.getPlayerById(playerId),
    );
  }

  async getTeamByTag(teamTag: string) {
    return this.executeWithFallback((repository) =>
      repository.getTeamByTag(teamTag),
    );
  }
}

export const playerRepository = new RepositoryProvider();
