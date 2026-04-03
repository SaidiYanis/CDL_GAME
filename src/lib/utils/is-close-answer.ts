import { normalizeAnswer } from "@/src/lib/utils/normalize-answer";

function getEditDistance(leftValue: string, rightValue: string): number {
  const distances = Array.from({ length: leftValue.length + 1 }, (_, rowIndex) =>
    Array.from({ length: rightValue.length + 1 }, (_, columnIndex) =>
      rowIndex === 0
        ? columnIndex
        : columnIndex === 0
          ? rowIndex
          : 0,
    ),
  );

  for (let rowIndex = 1; rowIndex <= leftValue.length; rowIndex += 1) {
    for (
      let columnIndex = 1;
      columnIndex <= rightValue.length;
      columnIndex += 1
    ) {
      const substitutionCost =
        leftValue[rowIndex - 1] === rightValue[columnIndex - 1] ? 0 : 1;

      distances[rowIndex][columnIndex] = Math.min(
        (distances[rowIndex - 1][columnIndex] ?? 0) + 1,
        (distances[rowIndex][columnIndex - 1] ?? 0) + 1,
        (distances[rowIndex - 1][columnIndex - 1] ?? 0) + substitutionCost,
      );
    }
  }

  return distances[leftValue.length][rightValue.length] ?? Number.MAX_SAFE_INTEGER;
}

export function isCloseAnswer(
  submittedAnswer: string,
  correctAnswer: string,
  maxDistance = 1,
): boolean {
  const normalizedSubmittedAnswer = normalizeAnswer(submittedAnswer);
  const normalizedCorrectAnswer = normalizeAnswer(correctAnswer);

  if (!normalizedSubmittedAnswer) {
    return false;
  }

  return (
    getEditDistance(normalizedSubmittedAnswer, normalizedCorrectAnswer) <=
    maxDistance
  );
}
