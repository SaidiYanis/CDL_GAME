export function pickRandomItem<TItem>(items: TItem[]): TItem | null {
  if (items.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex] ?? null;
}

export function pickUniqueRandomItems<TItem>(
  items: TItem[],
  count: number,
): TItem[] {
  if (count <= 0 || items.length === 0) {
    return [];
  }

  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[swapIndex]] = [
      shuffledItems[swapIndex] as TItem,
      shuffledItems[index] as TItem,
    ];
  }

  return shuffledItems.slice(0, Math.min(count, shuffledItems.length));
}
