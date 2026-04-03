import {
  getOptionCountByMode,
  getQuestionMode,
} from "@/src/features/game/constants/game-rules";
import { normalizeAnswer } from "@/src/lib/utils/normalize-answer";
import { pickRandomItem, pickUniqueRandomItems } from "@/src/lib/utils/random";
import type { GameQuestion, GameState, Player } from "@/src/types";

export function createInitialGameState(bestScore = 0): GameState {
  return {
    score: 0,
    bestScore,
    status: "idle",
    currentQuestion: null,
    usedPlayerIds: [],
    lastCorrectAnswer: null,
  };
}

export function startSurvivalGame(players: Player[], bestScore = 0): GameState {
  const initialState = createInitialGameState(bestScore);
  const firstQuestion = createNextGameQuestion(players, initialState);

  return {
    ...initialState,
    status: firstQuestion ? "playing" : "lost",
    currentQuestion: firstQuestion,
    usedPlayerIds: firstQuestion ? [firstQuestion.playerId] : [],
  };
}

export function submitSurvivalAnswer(
  state: GameState,
  players: Player[],
  submittedAnswer: string,
): GameState {
  if (state.status !== "playing" || !state.currentQuestion) {
    return state;
  }

  const isCorrectAnswer =
    normalizeAnswer(submittedAnswer) ===
    normalizeAnswer(state.currentQuestion.correctAnswer);

  if (!isCorrectAnswer) {
    return {
      ...state,
      status: "lost",
      bestScore: Math.max(state.bestScore, state.score),
      lastCorrectAnswer: state.currentQuestion.correctAnswer,
    };
  }

  const nextScore = state.score + 1;
  const nextState: GameState = {
    ...state,
    score: nextScore,
    bestScore: Math.max(state.bestScore, nextScore),
    lastCorrectAnswer: state.currentQuestion.correctAnswer,
  };
  const nextQuestion = createNextGameQuestion(players, nextState);

  return {
    ...nextState,
    status: nextQuestion ? "playing" : "lost",
    currentQuestion: nextQuestion,
    usedPlayerIds: nextQuestion
      ? [...nextState.usedPlayerIds, nextQuestion.playerId]
      : nextState.usedPlayerIds,
  };
}

export function createNextGameQuestion(
  players: Player[],
  state: GameState,
): GameQuestion | null {
  const availablePlayers = players.filter(
    (player) => !state.usedPlayerIds.includes(player.id),
  );
  const selectedPlayer = pickRandomItem(availablePlayers);

  if (!selectedPlayer) {
    return null;
  }

  const mode = getQuestionMode(state.score);
  const optionCount = getOptionCountByMode(mode);

  if (mode === "free-input") {
    return {
      playerId: selectedPlayer.id,
      imageUrl: selectedPlayer.imageUrl,
      correctAnswer: selectedPlayer.name,
      options: [],
      mode,
    };
  }

  const wrongOptions = pickUniqueRandomItems(
    players
      .filter((player) => player.id !== selectedPlayer.id)
      .map((player) => player.name),
    optionCount - 1,
  );

  return {
    playerId: selectedPlayer.id,
    imageUrl: selectedPlayer.imageUrl,
    correctAnswer: selectedPlayer.name,
    options: pickUniqueRandomItems(
      [selectedPlayer.name, ...wrongOptions],
      optionCount,
    ),
    mode,
  };
}
