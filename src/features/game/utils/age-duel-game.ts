import { pickUniqueRandomItems } from "@/src/lib/utils/random";
import type { DuelAnswer, DuelGameQuestion, DuelGameState, Player } from "@/src/types";

const AGE_DUEL_PROMPTS = ["Plus jeune", "Plus vieux"] as const;

function hasValidBirthDate(player: Player): boolean {
  return player.birthDate !== null && !Number.isNaN(Date.parse(player.birthDate));
}

function getPairKey(prompt: string, leftPlayerId: string, rightPlayerId: string): string {
  const sortedIds = [leftPlayerId, rightPlayerId].sort().join("__");
  return `${prompt}__${sortedIds}`;
}

function resolveAgeAnswer(
  prompt: "Plus jeune" | "Plus vieux",
  leftPlayer: Player,
  rightPlayer: Player,
): DuelAnswer {
  const leftTimestamp = Date.parse(leftPlayer.birthDate ?? "");
  const rightTimestamp = Date.parse(rightPlayer.birthDate ?? "");

  if (prompt === "Plus jeune") {
    return leftTimestamp > rightTimestamp ? "left" : "right";
  }

  return leftTimestamp < rightTimestamp ? "left" : "right";
}

function formatAgeAnswer(question: DuelGameQuestion, playersById: Map<string, Player>): string {
  const winnerId =
    question.correctAnswer === "left"
      ? question.leftPlayerId
      : question.rightPlayerId;
  const winner = playersById.get(winnerId);

  return winner?.name ?? "N/A";
}

export function startAgeDuelGame(players: Player[], bestScore = 0): DuelGameState {
  const firstState: DuelGameState = {
    bestScore,
    currentQuestion: null,
    lastCorrectAnswer: null,
    score: 0,
    status: "idle",
    usedPairKeys: [],
  };
  const firstQuestion = createNextAgeDuelQuestion(players, firstState);

  return {
    ...firstState,
    currentQuestion: firstQuestion,
    status: firstQuestion ? "playing" : "lost",
    usedPairKeys: firstQuestion
      ? [
          getPairKey(
            firstQuestion.prompt,
            firstQuestion.leftPlayerId,
            firstQuestion.rightPlayerId,
          ),
        ]
      : [],
  };
}

export function submitAgeDuelAnswer(
  state: DuelGameState,
  players: Player[],
  answer: DuelAnswer,
): DuelGameState {
  if (state.status !== "playing" || !state.currentQuestion) {
    return state;
  }

  const playersById = new Map(players.map((player) => [player.id, player]));
  const lastCorrectAnswer = formatAgeAnswer(state.currentQuestion, playersById);

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
  const nextQuestion = createNextAgeDuelQuestion(players, nextState);

  return {
    ...nextState,
    currentQuestion: nextQuestion,
    status: nextQuestion ? "playing" : "lost",
    usedPairKeys: nextQuestion
      ? [
          ...nextState.usedPairKeys,
          getPairKey(
            nextQuestion.prompt,
            nextQuestion.leftPlayerId,
            nextQuestion.rightPlayerId,
          ),
        ]
      : nextState.usedPairKeys,
  };
}

export function createNextAgeDuelQuestion(
  players: Player[],
  state: DuelGameState,
): DuelGameQuestion | null {
  const eligiblePlayers = players.filter(hasValidBirthDate);

  if (eligiblePlayers.length < 2) {
    return null;
  }

  const availableQuestions = AGE_DUEL_PROMPTS.flatMap((prompt) =>
    eligiblePlayers.flatMap((leftPlayer, leftIndex) =>
      eligiblePlayers
        .slice(leftIndex + 1)
        .filter(
          (rightPlayer) =>
            Date.parse(leftPlayer.birthDate ?? "") !==
            Date.parse(rightPlayer.birthDate ?? ""),
        )
        .map((rightPlayer) => ({ leftPlayer, prompt, rightPlayer })),
    ),
  ).filter(
    (question) =>
      !state.usedPairKeys.includes(
        getPairKey(
          question.prompt,
          question.leftPlayer.id,
          question.rightPlayer.id,
        ),
      ),
  );
  const [selectedQuestion] = pickUniqueRandomItems(availableQuestions, 1);

  if (!selectedQuestion) {
    return null;
  }

  return {
    correctAnswer: resolveAgeAnswer(
      selectedQuestion.prompt,
      selectedQuestion.leftPlayer,
      selectedQuestion.rightPlayer,
    ),
    leftPlayerId: selectedQuestion.leftPlayer.id,
    prompt: selectedQuestion.prompt,
    rightPlayerId: selectedQuestion.rightPlayer.id,
  };
}
