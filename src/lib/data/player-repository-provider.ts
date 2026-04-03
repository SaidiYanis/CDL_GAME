import type { PlayerRepository } from "@/src/features/players/services/player-repository";
import { firebasePlayerRepository } from "@/src/lib/data/firebase-player-repository";

class RepositoryProvider implements PlayerRepository {
  private readonly repository = firebasePlayerRepository;

  private async executeSafely<T>(
    repositoryAction: (repository: PlayerRepository) => Promise<T>,
    fallbackValue: T,
  ): Promise<T> {
    try {
      return await repositoryAction(this.repository);
    } catch (error) {
      console.warn(
        "[RepositoryProvider] Lecture Firestore impossible.",
        error,
      );

      return fallbackValue;
    }
  }

  async getPlayers() {
    return this.executeSafely(
      (repository) => repository.getPlayers(),
      [],
    );
  }

  async getTeams() {
    return this.executeSafely(
      (repository) => repository.getTeams(),
      [],
    );
  }

  async getPlayerById(playerId: string) {
    return this.executeSafely(
      (repository) => repository.getPlayerById(playerId),
      null,
    );
  }

  async getTeamByTag(teamTag: string) {
    return this.executeSafely(
      (repository) => repository.getTeamByTag(teamTag),
      null,
    );
  }
}

export const playerRepository = new RepositoryProvider();
