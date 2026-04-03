import { pickUniqueRandomItems } from "@/src/lib/utils/random";
import type {
  Player,
  PlayerRole,
  RoleSortGameQuestion,
  RoleSortGameState,
} from "@/src/types";

const ROLE_SORT_ROUND_SIZE = 5;

export type RoleAssignments = Record<string, PlayerRole | null>;

function createNextRoleSortQuestion(players: Player[]): RoleSortGameQuestion | null {
  const eligiblePlayers = players.filter((player) => player.role !== null);

  if (eligiblePlayers.length < ROLE_SORT_ROUND_SIZE) {
    return null;
  }

  return {
    playerIds: pickUniqueRandomItems(eligiblePlayers, ROLE_SORT_ROUND_SIZE).map(
      (player) => player.id,
    ),
  };
}

function buildIncorrectAnswerSummary(
  question: RoleSortGameQuestion,
  playersById: Map<string, Player>,
  assignments: RoleAssignments,
): string {
  const wrongPlayers = question.playerIds
    .map((playerId) => playersById.get(playerId))
    .filter((player): player is Player => player !== undefined)
    .filter((player) => assignments[player.id] !== player.role)
    .map((player) => `${player.name}=${player.role ?? "N/A"}`);

  return wrongPlayers.length > 0 ? wrongPlayers.join(", ") : "Tous corrects";
}

export function createEmptyRoleAssignments(
  question: RoleSortGameQuestion | null,
): RoleAssignments {
  if (!question) {
    return {};
  }

  return Object.fromEntries(
    question.playerIds.map((playerId) => [playerId, null]),
  );
}

export function startRoleSortGame(
  players: Player[],
  bestScore = 0,
): RoleSortGameState {
  const firstQuestion = createNextRoleSortQuestion(players);

  return {
    bestScore,
    currentQuestion: firstQuestion,
    lastCorrectAnswer: null,
    score: 0,
    status: firstQuestion ? "playing" : "lost",
  };
}

export function submitRoleSortRound(
  state: RoleSortGameState,
  players: Player[],
  assignments: RoleAssignments,
): RoleSortGameState {
  if (state.status !== "playing" || !state.currentQuestion) {
    return state;
  }

  const playersById = new Map(players.map((player) => [player.id, player]));
  const allCorrect = state.currentQuestion.playerIds.every((playerId) => {
    const player = playersById.get(playerId);
    return player?.role !== null && assignments[playerId] === player?.role;
  });

  if (!allCorrect) {
    return {
      ...state,
      bestScore: Math.max(state.bestScore, state.score),
      lastCorrectAnswer: buildIncorrectAnswerSummary(
        state.currentQuestion,
        playersById,
        assignments,
      ),
      status: "lost",
    };
  }

  const nextScore = state.score + 1;
  const nextQuestion = createNextRoleSortQuestion(players);

  return {
    bestScore: Math.max(state.bestScore, nextScore),
    currentQuestion: nextQuestion,
    lastCorrectAnswer: "Round parfait",
    score: nextScore,
    status: nextQuestion ? "playing" : "lost",
  };
}
