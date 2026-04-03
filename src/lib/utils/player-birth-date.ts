const DEFAULT_LOCALE = "fr-FR";

export function getPlayerAgeFromBirthDate(
  birthDate: string | null,
  now = new Date(),
): number | null {
  if (!birthDate) {
    return null;
  }

  const parsedBirthDate = new Date(birthDate);

  if (Number.isNaN(parsedBirthDate.getTime())) {
    return null;
  }

  let age = now.getFullYear() - parsedBirthDate.getFullYear();
  const hasNotHadBirthdayThisYear =
    now.getMonth() < parsedBirthDate.getMonth() ||
    (now.getMonth() === parsedBirthDate.getMonth() &&
      now.getDate() < parsedBirthDate.getDate());

  if (hasNotHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

export function formatPlayerBirthDate(birthDate: string | null): string {
  if (!birthDate) {
    return "--";
  }

  const parsedBirthDate = new Date(birthDate);

  if (Number.isNaN(parsedBirthDate.getTime())) {
    return birthDate;
  }

  return parsedBirthDate.toLocaleDateString(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
