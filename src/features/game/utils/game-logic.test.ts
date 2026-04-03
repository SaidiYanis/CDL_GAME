import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  startAgeDuelGame,
  submitAgeDuelAnswer,
} from "@/src/features/game/utils/age-duel-game";
import {
  startRatingDuelGame,
  submitRatingDuelAnswer,
} from "@/src/features/game/utils/rating-duel-game";
import {
  createEmptyRoleAssignments,
  startRoleSortGame,
  submitRoleSortRound,
} from "@/src/features/game/utils/role-sort-game";
import {
  startSurvivalGame,
  submitSurvivalAnswer,
} from "@/src/features/game/utils/survival-game";
import {
  createNextTitleDuelQuestion,
  startTitleDuelGame,
  submitTitleDuelAnswer,
} from "@/src/features/game/utils/title-duel-game";
import {
  createEmptyTitleRankAssignments,
  startTitleRankGame,
  submitTitleRankRound,
} from "@/src/features/game/utils/title-rank-game";
import type { Player, PlayerRole, TitleRankAnswer } from "@/src/types";

const originalMathRandom = Math.random;

function createPlayer(overrides: Partial<Player> = {}): Player {
  return {
    birthDate: "2000-01-01",
    country: "France",
    id: "player-a",
    imageUrl: "/ressource/test/player-a.png",
    majorTitleCount: 1,
    name: "Player A",
    rating: 80,
    role: "AR",
    slug: "player-a",
    teamTag: "AAA",
    worldTitleCount: 0,
    ...overrides,
  };
}

function createRoleSortPlayers(): Player[] {
  return Array.from({ length: 10 }, (_, index) =>
    createPlayer({
      id: `role-player-${index}`,
      name: `Role Player ${index}`,
      role: index % 2 === 0 ? "AR" : "SMG",
      slug: `role-player-${index}`,
    }),
  );
}

beforeEach(() => {
  Math.random = () => 0;
});

afterEach(() => {
  Math.random = originalMathRandom;
});

test("startSurvivalGame generates a first question and submitSurvivalAnswer increments score on a correct answer", () => {
  const players = [
    createPlayer({ id: "optic-dashy", name: "Dashy", slug: "dashy" }),
    createPlayer({ id: "lat-hydra", name: "HyDra", slug: "hydra" }),
    createPlayer({ id: "faze-simp", name: "Simp", slug: "simp" }),
    createPlayer({ id: "g2-skyz", name: "Skyz", slug: "skyz" }),
  ];

  const initialState = startSurvivalGame(players, 7);

  assert.equal(initialState.status, "playing");
  assert.equal(initialState.bestScore, 7);
  assert.ok(initialState.currentQuestion);

  const nextState = submitSurvivalAnswer(
    initialState,
    players,
    initialState.currentQuestion.correctAnswer,
  );

  assert.equal(nextState.score, 1);
  assert.equal(nextState.bestScore, 7);
});

test("submitSurvivalAnswer ends the game on wrong input and keeps the expected answer", () => {
  const players = [
    createPlayer({ id: "optic-dashy", name: "Dashy", slug: "dashy" }),
    createPlayer({ id: "lat-hydra", name: "HyDra", slug: "hydra" }),
    createPlayer({ id: "faze-simp", name: "Simp", slug: "simp" }),
    createPlayer({ id: "g2-skyz", name: "Skyz", slug: "skyz" }),
  ];

  const initialState = startSurvivalGame(players, 0);
  const nextState = submitSurvivalAnswer(initialState, players, "Wrong");

  assert.equal(nextState.status, "lost");
  assert.equal(
    nextState.lastCorrectAnswer,
    initialState.currentQuestion?.correctAnswer,
  );
});

test("age duel accepts the correct side and updates score", () => {
  const players = [
    createPlayer({
      birthDate: "2004-01-01",
      id: "young",
      name: "Young",
      slug: "young",
    }),
    createPlayer({
      birthDate: "1999-01-01",
      id: "old",
      name: "Old",
      slug: "old",
    }),
  ];

  const initialState = startAgeDuelGame(players, 0);

  assert.ok(initialState.currentQuestion);

  const nextState = submitAgeDuelAnswer(
    initialState,
    players,
    initialState.currentQuestion.correctAnswer,
  );

  assert.equal(nextState.score, 1);
  assert.ok(["playing", "lost"].includes(nextState.status));
});

test("title duel resolves same when both players have identical title counts", () => {
  const players = [
    createPlayer({
      id: "alpha",
      majorTitleCount: 1,
      name: "Alpha",
      slug: "alpha",
      worldTitleCount: 1,
    }),
    createPlayer({
      id: "beta",
      majorTitleCount: 1,
      name: "Beta",
      slug: "beta",
      worldTitleCount: 0,
    }),
  ];

  const initialState = startTitleDuelGame(players, 0);

  assert.equal(initialState.currentQuestion?.correctAnswer, "same");
  assert.equal(
    submitTitleDuelAnswer(initialState, players, "same").score,
    1,
  );
});

test("title duel compares major titles only on regular rounds", () => {
  const players = [
    createPlayer({
      id: "major-lead",
      majorTitleCount: 2,
      name: "Major Lead",
      slug: "major-lead",
      worldTitleCount: 0,
    }),
    createPlayer({
      id: "world-heavy",
      majorTitleCount: 1,
      name: "World Heavy",
      slug: "world-heavy",
      worldTitleCount: 3,
    }),
  ];

  const initialState = startTitleDuelGame(players, 0);

  assert.equal(initialState.currentQuestion?.correctAnswer, "left");
});

test("title duel compares major plus world titles every third round", () => {
  const players = [
    createPlayer({
      id: "major-lead",
      majorTitleCount: 2,
      name: "Major Lead",
      slug: "major-lead",
      worldTitleCount: 0,
    }),
    createPlayer({
      id: "world-heavy",
      majorTitleCount: 1,
      name: "World Heavy",
      slug: "world-heavy",
      worldTitleCount: 3,
    }),
  ];

  const thirdRoundQuestion = createNextTitleDuelQuestion(players, {
    bestScore: 0,
    currentQuestion: null,
    lastCorrectAnswer: null,
    score: 2,
    status: "playing",
    usedPairKeys: [],
  });

  assert.equal(thirdRoundQuestion?.correctAnswer, "right");
});

test("rating duel selects the higher rated player and loses on a wrong answer", () => {
  const players = [
    createPlayer({ id: "low", name: "Low", rating: 70, slug: "low" }),
    createPlayer({ id: "high", name: "High", rating: 95, slug: "high" }),
  ];

  const initialState = startRatingDuelGame(players, 3);

  assert.equal(initialState.currentQuestion?.correctAnswer, "right");

  const nextState = submitRatingDuelAnswer(initialState, players, "left");

  assert.equal(nextState.status, "lost");
  assert.equal(nextState.bestScore, 3);
  assert.equal(nextState.lastCorrectAnswer, "High");
});

test("role sort validates a full AR/SMG round and returns an error summary on wrong assignments", () => {
  const players = createRoleSortPlayers();
  const initialState = startRoleSortGame(players, 2);

  assert.equal(initialState.status, "playing");
  assert.equal(initialState.currentQuestion?.playerIds.length, 10);

  const correctAssignments = Object.fromEntries(
    players.map((player) => [player.id, player.role as PlayerRole]),
  );
  const perfectRoundState = submitRoleSortRound(
    initialState,
    players,
    correctAssignments,
  );

  assert.equal(perfectRoundState.score, 1);
  assert.equal(perfectRoundState.lastCorrectAnswer, "Round parfait");

  const emptyAssignments = createEmptyRoleAssignments(
    initialState.currentQuestion,
  );
  const failedState = submitRoleSortRound(
    initialState,
    players,
    emptyAssignments,
  );

  assert.equal(failedState.status, "lost");
  assert.ok(failedState.lastCorrectAnswer?.includes("Role Player"));
});

test("title rank validates a full 5-player round and increments score", () => {
  const players = Array.from({ length: 5 }, (_, index) =>
    createPlayer({
      id: `title-rank-${index}`,
      majorTitleCount: 0,
      name: `Title Rank ${index}`,
      slug: `title-rank-${index}`,
      worldTitleCount: 0,
    }),
  );
  const initialState = startTitleRankGame(players, 0);

  assert.equal(initialState.status, "playing");
  assert.equal(initialState.currentQuestion?.playerIds.length, 5);
  assert.equal(initialState.currentQuestion?.targetTitleCount, 0);

  const assignments = Object.fromEntries(
    (initialState.currentQuestion?.playerIds ?? []).map((playerId) => [
      playerId,
      "same" satisfies TitleRankAnswer,
    ]),
  );
  const nextState = submitTitleRankRound(initialState, players, assignments);

  assert.equal(nextState.score, 1);
  assert.equal(nextState.lastCorrectAnswer, "Round parfait");
  assert.equal(
    Object.keys(
      createEmptyTitleRankAssignments(nextState.currentQuestion),
    ).length,
    nextState.currentQuestion?.playerIds.length ?? 0,
  );
});
