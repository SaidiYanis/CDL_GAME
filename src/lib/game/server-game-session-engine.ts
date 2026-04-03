import "server-only";

import {
  startAgeDuelGame,
  submitAgeDuelAnswer,
} from "@/src/features/game/utils/age-duel-game";
import {
  startRatingDuelGame,
  submitRatingDuelAnswer,
} from "@/src/features/game/utils/rating-duel-game";
import {
  startRoleSortGame,
  submitRoleSortRound,
  type RoleAssignments,
} from "@/src/features/game/utils/role-sort-game";
import {
  startSurvivalGame,
  submitSurvivalAnswer,
} from "@/src/features/game/utils/survival-game";
import {
  startTitleDuelGame,
  submitTitleDuelAnswer,
} from "@/src/features/game/utils/title-duel-game";
import {
  startTitleRankGame,
  submitTitleRankRound,
  type TitleRankAssignments,
} from "@/src/features/game/utils/title-rank-game";
import type {
  DuelAnswer,
  DuelGameState,
  GameModeId,
  GameState,
  Player,
  RoleSortGameState,
  TitleRankGameState,
} from "@/src/types";

export interface ServerGameStateByMode {
  "guess-player": GameState;
  "age-duel": DuelGameState;
  "title-duel": DuelGameState;
  "rating-duel": DuelGameState;
  "role-sort": RoleSortGameState;
  "title-rank": TitleRankGameState;
}

export type AnyServerGameState = ServerGameStateByMode[GameModeId];

export interface ServerGameAnswerByMode {
  "guess-player": string;
  "age-duel": DuelAnswer;
  "title-duel": DuelAnswer;
  "rating-duel": DuelAnswer;
  "role-sort": RoleAssignments;
  "title-rank": TitleRankAssignments;
}

export type AnyServerGameAnswer = ServerGameAnswerByMode[GameModeId];

export interface ServerGameSubmitResult<M extends GameModeId = GameModeId> {
  gameState: ServerGameStateByMode[M];
  isCorrectAnswer: boolean;
}

function sanitizeState(
  modeId: GameModeId,
  gameState: AnyServerGameState,
): AnyServerGameState {
  if (gameState.status !== "playing" || !gameState.currentQuestion) {
    return gameState;
  }

  if (modeId === "guess-player") {
    const survivalState = gameState as GameState;
    const currentQuestion = survivalState.currentQuestion;

    if (!currentQuestion) {
      return survivalState;
    }

    return {
      ...survivalState,
      currentQuestion: {
        ...currentQuestion,
        correctAnswer: "",
      },
    };
  }

  if (
    modeId === "age-duel" ||
    modeId === "title-duel" ||
    modeId === "rating-duel"
  ) {
    const duelState = gameState as DuelGameState;
    const currentQuestion = duelState.currentQuestion;

    if (!currentQuestion) {
      return duelState;
    }

    return {
      ...duelState,
      currentQuestion: {
        ...currentQuestion,
        correctAnswer: "same",
      },
    };
  }

  return gameState;
}

function getPersistedCorrectness<M extends GameModeId>(
  previousState: ServerGameStateByMode[M],
  nextState: ServerGameStateByMode[M],
): boolean {
  return nextState.score > previousState.score || nextState.status === "playing";
}

export function startServerGameSession<M extends GameModeId>(
  modeId: M,
  players: Player[],
  bestScore = 0,
): ServerGameStateByMode[M] {
  switch (modeId) {
    case "guess-player":
      return sanitizeState(
        modeId,
        startSurvivalGame(players, bestScore),
      ) as ServerGameStateByMode[M];
    case "age-duel":
      return sanitizeState(
        modeId,
        startAgeDuelGame(players, bestScore),
      ) as ServerGameStateByMode[M];
    case "title-duel":
      return sanitizeState(
        modeId,
        startTitleDuelGame(players, bestScore),
      ) as ServerGameStateByMode[M];
    case "rating-duel":
      return sanitizeState(
        modeId,
        startRatingDuelGame(players, bestScore),
      ) as ServerGameStateByMode[M];
    case "role-sort":
      return sanitizeState(
        modeId,
        startRoleSortGame(players, bestScore),
      ) as ServerGameStateByMode[M];
    case "title-rank":
      return sanitizeState(
        modeId,
        startTitleRankGame(players, bestScore),
      ) as ServerGameStateByMode[M];
  }
}

export function submitServerGameAnswer<M extends GameModeId>(
  modeId: M,
  currentState: ServerGameStateByMode[M],
  players: Player[],
  answer: ServerGameAnswerByMode[M],
): ServerGameSubmitResult<M> {
  switch (modeId) {
    case "guess-player": {
      const nextState = submitSurvivalAnswer(
        currentState as GameState,
        players,
        answer as string,
      );

      return {
        gameState: sanitizeState(modeId, nextState) as ServerGameStateByMode[M],
        isCorrectAnswer: getPersistedCorrectness(
          currentState,
          nextState as ServerGameStateByMode[M],
        ),
      };
    }

    case "age-duel": {
      const nextState = submitAgeDuelAnswer(
        currentState as DuelGameState,
        players,
        answer as DuelAnswer,
      );

      return {
        gameState: sanitizeState(modeId, nextState) as ServerGameStateByMode[M],
        isCorrectAnswer: getPersistedCorrectness(
          currentState,
          nextState as ServerGameStateByMode[M],
        ),
      };
    }

    case "title-duel": {
      const nextState = submitTitleDuelAnswer(
        currentState as DuelGameState,
        players,
        answer as DuelAnswer,
      );

      return {
        gameState: sanitizeState(modeId, nextState) as ServerGameStateByMode[M],
        isCorrectAnswer: getPersistedCorrectness(
          currentState,
          nextState as ServerGameStateByMode[M],
        ),
      };
    }

    case "rating-duel": {
      const nextState = submitRatingDuelAnswer(
        currentState as DuelGameState,
        players,
        answer as DuelAnswer,
      );

      return {
        gameState: sanitizeState(modeId, nextState) as ServerGameStateByMode[M],
        isCorrectAnswer: getPersistedCorrectness(
          currentState,
          nextState as ServerGameStateByMode[M],
        ),
      };
    }

    case "role-sort": {
      const nextState = submitRoleSortRound(
        currentState as RoleSortGameState,
        players,
        answer as RoleAssignments,
      );

      return {
        gameState: sanitizeState(modeId, nextState) as ServerGameStateByMode[M],
        isCorrectAnswer: getPersistedCorrectness(
          currentState,
          nextState as ServerGameStateByMode[M],
        ),
      };
    }

    case "title-rank": {
      const nextState = submitTitleRankRound(
        currentState as TitleRankGameState,
        players,
        answer as TitleRankAssignments,
      );

      return {
        gameState: sanitizeState(modeId, nextState) as ServerGameStateByMode[M],
        isCorrectAnswer: getPersistedCorrectness(
          currentState,
          nextState as ServerGameStateByMode[M],
        ),
      };
    }
  }
}

export function forceServerGameLoss<M extends GameModeId>(
  gameState: ServerGameStateByMode[M],
): ServerGameStateByMode[M] {
  if (gameState.status !== "playing") {
    return gameState;
  }

  return {
    ...gameState,
    bestScore: Math.max(gameState.bestScore, gameState.score),
    status: "lost",
  };
}
