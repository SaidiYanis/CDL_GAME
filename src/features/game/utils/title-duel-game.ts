import { pickUniqueRandomItems } from "@/src/lib/utils/random";
import type { DuelAnswer, DuelGameQuestion, DuelGameState, Player } from "@/src/types";

function getTotalTitles(player: Player): number {
  return (player.worldTitleCount ?? 0) + (player.majorTitleCount ?? 0);
}

function getPairKey(leftPlayerId: string, rightPlayerId: string): string {
  return [leftPlayerId, rightPlayerId].sort().join("__");
}

function resolveTitleAnswer(leftPlayer: Player, rightPlayer: Player): DuelAnswer {
  const leftTitles = getTotalTitles(leftPlayer);
  const rightTitles = getTotalTitles(rightPlayer);

  if (leftTitles === rightTitles) {
    return "same";
  }

  return leftTitles > rightTitles ? "left" : "right";
}

function formatTitleAnswer(
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

export function startTitleDuelGame(
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
  const firstQuestion = createNextTitleDuelQuestion(players, initialState);

  return {
    ...initialState,
    currentQuestion: firstQuestion,
    status: firstQuestion ? "playing" : "lost",
    usedPairKeys: firstQuestion
      ? [getPairKey(firstQuestion.leftPlayerId, firstQuestion.rightPlayerId)]
      : [],
  };
}

export function submitTitleDuelAnswer(
  state: DuelGameState,
  players: Player[],
  answer: DuelAnswer,
): DuelGameState {
  if (state.status !== "playing" || !state.currentQuestion) {
    return state;
  }

  const playersById = new Map(players.map((player) => [player.id, player]));
  const lastCorrectAnswer = formatTitleAnswer(
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
  const nextQuestion = createNextTitleDuelQuestion(players, nextState);

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

export function createNextTitleDuelQuestion(
  players: Player[],
  state: DuelGameState,
): DuelGameQuestion | null {
  if (players.length < 2) {
    return null;
  }

  const availablePairs = players.flatMap((leftPlayer, leftIndex) =>
    players.slice(leftIndex + 1).map((rightPlayer) => ({
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
    correctAnswer: resolveTitleAnswer(
      selectedPair.leftPlayer,
      selectedPair.rightPlayer,
    ),
    leftPlayerId: selectedPair.leftPlayer.id,
    prompt: "Plus de titres",
    rightPlayerId: selectedPair.rightPlayer.id,
  };
}
