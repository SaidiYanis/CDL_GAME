const RARE_EVENT_RATE = 0.1;

const FEEDBACK_SOUNDS = {
  lose: {
    default: "/ressource/SOUND/loose.mp3",
    rare: "/ressource/SOUND/loose1on10.mp3",
  },
  win: {
    default: "/ressource/SOUND/win.mp3",
    rare: "/ressource/SOUND/win1on10.mp3",
  },
} as const;

export type GameFeedbackSound = keyof typeof FEEDBACK_SOUNDS;

export function playGameFeedbackSound(feedbackType: GameFeedbackSound): void {
  if (typeof window === "undefined") {
    return;
  }

  const shouldPlayRareVariant = Math.random() < RARE_EVENT_RATE;
  const soundsToPlay =
    feedbackType === "win" && shouldPlayRareVariant
      ? [
          FEEDBACK_SOUNDS[feedbackType].default,
          FEEDBACK_SOUNDS[feedbackType].rare,
        ]
      : [
          shouldPlayRareVariant
            ? FEEDBACK_SOUNDS[feedbackType].rare
            : FEEDBACK_SOUNDS[feedbackType].default,
        ];

  soundsToPlay.forEach((soundPath) => {
    const feedbackAudio = new Audio(soundPath);

    feedbackAudio.volume = 0.65;
    void feedbackAudio.play().catch(() => {
      // Browser autoplay restrictions can reject audio if the user gesture was interrupted.
    });
  });
}
