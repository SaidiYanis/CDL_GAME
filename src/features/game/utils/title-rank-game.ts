import { isCumulativeTitleRound } from "@/src/features/game/utils/title-duel-game";
import { pickRandomItem, pickUniqueRandomItems } from "@/src/lib/utils/random";
import type {
  Player,
  TitleRankAnswer,
  TitleRankGameQuestion,
  TitleRankGameState,
} from "@/src/types";

const TITLE_RANK_ROUND_SIZE = 5;
const BALANCED_ROUND_PROBABILITY = 0.9;
const TARGET_TITLE_WEIGHTS = [
  { value: 0, weight: 13 },
  { value: 1, weight: 17 },
  { value: 2, weight: 16 },
  { value: 3, weight: 14 },
  { value: 4, weight: 10 },
  { value: 5, weight: 8 },
  { value: 6, weight: 6 },
  { value: 7, weight: 5 },
  { value: 8, weight: 4 },
  { value: 9, weight: 2 },
  { value: 10, weight: 2 },
];

export type TitleRankAssignments = Record<string, TitleRankAnswer | null>;

function getPlayerTitleCount(player: Player, score: number): number {
  if (isCumulativeTitleRound(score)) {
    return (player.majorTitleCount ?? 0) + (player.worldTitleCount ?? 0);
  }

  return player.majorTitleCount ?? 0;
}

function getExpectedAnswer(
  player: Player,
  targetTitleCount: number,
  score: number,
): TitleRankAnswer {
  const playerTitleCount = getPlayerTitleCount(player, score);

  if (playerTitleCount > targetTitleCount) {
    return "higher";
  }

  if (playerTitleCount < targetTitleCount) {
    return "lower";
  }

  return "same";
}

function pickWeightedTargetTitleCount(): number {
  const totalWeight = TARGET_TITLE_WEIGHTS.reduce(
    (sum, targetWeight) => sum + targetWeight.weight,
    0,
  );
  let randomWeight = Math.random() * totalWeight;

  for (const targetWeight of TARGET_TITLE_WEIGHTS) {
    randomWeight -= targetWeight.weight;

    if (randomWeight <= 0) {
      return targetWeight.value;
    }
  }

  return TARGET_TITLE_WEIGHTS[TARGET_TITLE_WEIGHTS.length - 1]?.value ?? 0;
}

function createBalancedQuestion(
  players: Player[],
  score: number,
  targetTitleCount: number,
): TitleRankGameQuestion | null {
  const lowerPlayers = players.filter(
    (player) => getPlayerTitleCount(player, score) < targetTitleCount,
  );
  const samePlayers = players.filter(
    (player) => getPlayerTitleCount(player, score) === targetTitleCount,
  );
  const higherPlayers = players.filter(
    (player) => getPlayerTitleCount(player, score) > targetTitleCount,
  );

  if (
    lowerPlayers.length === 0 ||
    samePlayers.length === 0 ||
    higherPlayers.length === 0
  ) {
    return null;
  }

  const pickedPlayers = [
    pickRandomItem(lowerPlayers),
    pickRandomItem(samePlayers),
    pickRandomItem(higherPlayers),
  ].filter((player): player is Player => player !== null);
  const pickedPlayerIds = new Set(pickedPlayers.map((player) => player.id));
  const remainingPlayers = players.filter(
    (player) => !pickedPlayerIds.has(player.id),
  );
  const extraPlayers = pickUniqueRandomItems(
    remainingPlayers,
    TITLE_RANK_ROUND_SIZE - pickedPlayers.length,
  );
  const questionPlayers = pickUniqueRandomItems(
    [...pickedPlayers, ...extraPlayers],
    TITLE_RANK_ROUND_SIZE,
  );

  if (questionPlayers.length < TITLE_RANK_ROUND_SIZE) {
    return null;
  }

  return {
    comparisonMode: isCumulativeTitleRound(score) ? "cumulative" : "major",
    playerIds: questionPlayers.map((player) => player.id),
    targetTitleCount,
  };
}

function createRandomQuestion(
  players: Player[],
  score: number,
  targetTitleCount: number,
): TitleRankGameQuestion | null {
  const pickedPlayers = pickUniqueRandomItems(players, TITLE_RANK_ROUND_SIZE);

  if (pickedPlayers.length < TITLE_RANK_ROUND_SIZE) {
    return null;
  }

  return {
    comparisonMode: isCumulativeTitleRound(score) ? "cumulative" : "major",
    playerIds: pickedPlayers.map((player) => player.id),
    targetTitleCount,
  };
}

function createNextTitleRankQuestion(
  players: Player[],
  score: number,
): TitleRankGameQuestion | null {
  if (players.length < TITLE_RANK_ROUND_SIZE) {
    return null;
  }

  const targetTitleCount = pickWeightedTargetTitleCount();
  const useBalancedRound = Math.random() < BALANCED_ROUND_PROBABILITY;

  if (useBalancedRound) {
    const balancedQuestion = createBalancedQuestion(
      players,
      score,
      targetTitleCount,
    );

    if (balancedQuestion) {
      return balancedQuestion;
    }
  }

  return createRandomQuestion(players, score, targetTitleCount);
}

function buildIncorrectAnswerSummary(
  question: TitleRankGameQuestion,
  playersById: Map<string, Player>,
  assignments: TitleRankAssignments,
  score: number,
): string {
  const answerLabels: Record<TitleRankAnswer, string> = {
    higher: "+",
    lower: "-",
    same: "=",
  };
  const wrongPlayers = question.playerIds
    .map((playerId) => playersById.get(playerId))
    .filter((player): player is Player => player !== undefined)
    .filter(
      (player) =>
        assignments[player.id] !==
        getExpectedAnswer(player, question.targetTitleCount, score),
    )
    .map((player) => {
      const expectedAnswer = getExpectedAnswer(
        player,
        question.targetTitleCount,
        score,
      );

      return `${player.name}${answerLabels[expectedAnswer]}`;
    });

  return wrongPlayers.length > 0 ? wrongPlayers.join(", ") : "Round parfait";
}

export function createEmptyTitleRankAssignments(
  question: TitleRankGameQuestion | null,
): TitleRankAssignments {
  if (!question) {
    return {};
  }

  return Object.fromEntries(
    question.playerIds.map((playerId) => [playerId, null]),
  );
}

export function getTitleRankRoundLabel(question: TitleRankGameQuestion): string {
  return question.comparisonMode === "cumulative"
    ? "Round bonus : Major + World cumules"
    : "Compare les Major uniquement";
}

export function startTitleRankGame(
  players: Player[],
  bestScore = 0,
): TitleRankGameState {
  const firstQuestion = createNextTitleRankQuestion(players, 0);

  return {
    bestScore,
    currentQuestion: firstQuestion,
    lastCorrectAnswer: null,
    score: 0,
    status: firstQuestion ? "playing" : "lost",
  };
}

export function submitTitleRankRound(
  state: TitleRankGameState,
  players: Player[],
  assignments: TitleRankAssignments,
): TitleRankGameState {
  if (state.status !== "playing" || !state.currentQuestion) {
    return state;
  }

  const playersById = new Map(players.map((player) => [player.id, player]));
  const allCorrect = state.currentQuestion.playerIds.every((playerId) => {
    const player = playersById.get(playerId);

    return (
      player !== undefined &&
      assignments[playerId] ===
        getExpectedAnswer(
          player,
          state.currentQuestion?.targetTitleCount ?? 0,
          state.score,
        )
    );
  });

  if (!allCorrect) {
    return {
      ...state,
      bestScore: Math.max(state.bestScore, state.score),
      lastCorrectAnswer: buildIncorrectAnswerSummary(
        state.currentQuestion,
        playersById,
        assignments,
        state.score,
      ),
      status: "lost",
    };
  }

  const nextScore = state.score + 1;
  const nextQuestion = createNextTitleRankQuestion(players, nextScore);

  return {
    bestScore: Math.max(state.bestScore, nextScore),
    currentQuestion: nextQuestion,
    lastCorrectAnswer: "Round parfait",
    score: nextScore,
    status: nextQuestion ? "playing" : "lost",
  };
}
