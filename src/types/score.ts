export type GameModeId =
  | "guess-player"
  | "age-duel"
  | "title-duel"
  | "rating-duel"
  | "role-sort";

export type ModeBestScores = Record<GameModeId, number>;
