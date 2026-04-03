export interface GameModeCard {
  description: string;
  href: string | null;
  id: string;
  isAvailable: boolean;
  label: string;
  title: string;
}

export const GAME_MODES: GameModeCard[] = [
  {
    id: "guess-player",
    title: "Deviner le joueur",
    label: "Jouable",
    description:
      "Mode survie classique : trouve le pseudo du joueur affiche et continue jusqu'a la premiere erreur.",
    href: "/game",
    isAvailable: true,
  },
  {
    id: "age-duel",
    title: "Plus jeune / plus vieux",
    label: "Jouable",
    description:
      "Compare deux joueurs et choisis qui est le plus jeune ou le plus age pour faire monter le score.",
    href: "/game/age-duel",
    isAvailable: true,
  },
  {
    id: "titles-duel",
    title: "Plus de titres / same",
    label: "Bientot",
    description:
      "Choisis quel joueur a le plus gros palmares, ou same en cas d'egalite.",
    href: null,
    isAvailable: false,
  },
  {
    id: "rating-duel",
    title: "Meilleure note BP",
    label: "Bientot",
    description:
      "Duel base sur la note BP : trouve le joueur le mieux note, ou same si les deux sont a egalite.",
    href: null,
    isAvailable: false,
  },
  {
    id: "role-sort",
    title: "Trier AR / SMG",
    label: "Bientot",
    description:
      "Trie un pool de joueurs entre AR et SMG et valide ton classement sans te tromper.",
    href: null,
    isAvailable: false,
  },
];
