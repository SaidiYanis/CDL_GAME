interface RoundSuccessOverlayProps {
  isVisible: boolean;
}

export function RoundSuccessOverlay({ isVisible }: RoundSuccessOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-50 bg-emerald-400/20 transition-opacity duration-200 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
