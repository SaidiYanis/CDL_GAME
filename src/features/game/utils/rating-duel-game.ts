import { pickUniqueRandomItems } from "@/src/lib/utils/random";
import type {
  DuelAnswer,
  DuelGameQuestion,
  DuelGameState,
  Player,
} from "@/src/types";

function hasRating(player: Player): boolean {
  return player.rating !== null;
}

function getPairKey(leftPlayerId: string, rightPlayerId: string): string {
  return [leftPlayerId, rightPlayerId].sort().join("__");
}

function resolveRatingAnswer(
  leftPlayer: Player,
  rightPlayer: Player,
): DuelAnswer {
  const leftRating = leftPlayer.rating ?? 0;
  const rightRating = rightPlayer.rating ?? 0;

  if (leftRating === rightRating) {
    return "same";
  }

  return leftRating > rightRating ? "left" : "right";
}

function formatRatingAnswer(
  question: DuelGameQuestion,
  playersById: Map<string, Player>,
): string {
  if (question.correctAnswer === "same") {
    return "Same";
  }

  const winnerId =
    question.correctAnswer === "left"
      ? question.leftPlayerId
      : question.rightPlayerId;

  return playersById.get(winnerId)?.name ?? "N/A";
}

export function startRatingDuelGame(
  players: Player[],
  bestScore = 0,
): DuelGameState {
  const initialState: DuelGameState = {
    bestScore,
    currentQuestion: null,
    lastCorrectAnswer: null,
    score: 0,
    status: "idle",
    usedPairKeys: [],
  };
  const firstQuestion = createNextRatingDuelQuestion(players, initialState);

  return {
    ...initialState,
    currentQuestion: firstQuestion,
    status: firstQuestion ? "playing" : "lost",
    usedPairKeys: firstQuestion
      ? [getPairKey(firstQuestion.leftPlayerId, firstQuestion.rightPlayerId)]
      : [],
  };
}

export function submitRatingDuelAnswer(
  state: DuelGameState,
  players: Player[],
  answer: DuelAnswer,
): DuelGameState {
  if (state.status !== "playing" || !state.currentQuestion) {
    return state;
  }

  const playersById = new Map(players.map((player) => [player.id, player]));
  const lastCorrectAnswer = formatRatingAnswer(
    state.currentQuestion,
    playersById,
  );

  if (answer !== state.currentQuestion.correctAnswer) {
    return {
      ...state,
      bestScore: Math.max(state.bestScore, state.score),
      lastCorrectAnswer,
      status: "lost",
    };
  }

  const nextScore = state.score + 1;
  const nextState: DuelGameState = {
    ...state,
    bestScore: Math.max(state.bestScore, nextScore),
    lastCorrectAnswer,
    score: nextScore,
  };
  const nextQuestion = createNextRatingDuelQuestion(players, nextState);

  return {
    ...nextState,
    currentQuestion: nextQuestion,
    status: nextQuestion ? "playing" : "lost",
    usedPairKeys: nextQuestion
      ? [
          ...nextState.usedPairKeys,
          getPairKey(nextQuestion.leftPlayerId, nextQuestion.rightPlayerId),
        ]
      : nextState.usedPairKeys,
  };
}

export function createNextRatingDuelQuestion(
  players: Player[],
  state: DuelGameState,
): DuelGameQuestion | null {
  const eligiblePlayers = players.filter(hasRating);

  if (eligiblePlayers.length < 2) {
    return null;
  }

  const availablePairs = eligiblePlayers.flatMap((leftPlayer, leftIndex) =>
    eligiblePlayers.slice(leftIndex + 1).map((rightPlayer) => ({
      leftPlayer,
      rightPlayer,
    })),
  ).filter(
    (pair) =>
      !state.usedPairKeys.includes(
        getPairKey(pair.leftPlayer.id, pair.rightPlayer.id),
      ),
  );
  const [selectedPair] = pickUniqueRandomItems(availablePairs, 1);

  if (!selectedPair) {
    return null;
  }

  return {
    correctAnswer: resolveRatingAnswer(
      selectedPair.leftPlayer,
      selectedPair.rightPlayer,
    ),
    leftPlayerId: selectedPair.leftPlayer.id,
    prompt: "Meilleure note BP",
    rightPlayerId: selectedPair.rightPlayer.id,
  };
}
