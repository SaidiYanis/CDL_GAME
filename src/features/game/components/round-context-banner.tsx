"use client";

interface RoundContextBannerProps {
  emphasis: string;
  label: string;
  tone?: "emerald" | "amber" | "sky" | "violet";
}

const toneClasses: Record<NonNullable<RoundContextBannerProps["tone"]>, string> = {
  amber:
    "border-amber-300/30 bg-amber-400/10 text-amber-100 shadow-amber-500/10",
  emerald:
    "border-emerald-300/30 bg-emerald-400/10 text-emerald-100 shadow-emerald-500/10",
  sky: "border-sky-300/30 bg-sky-400/10 text-sky-100 shadow-sky-500/10",
  violet:
    "border-violet-300/30 bg-violet-400/10 text-violet-100 shadow-violet-500/10",
};

export function RoundContextBanner({
  emphasis,
  label,
  tone = "emerald",
}: RoundContextBannerProps) {
  return (
    <article
      className={`mt-4 rounded-[1.5rem] border p-4 text-left shadow-lg sm:mt-5 sm:p-5 ${toneClasses[tone]}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80 sm:text-xs">
        Regle du round
      </p>
      <p className="mt-2 text-lg font-black uppercase tracking-[0.08em] sm:text-2xl">
        {emphasis}
      </p>
      <p className="mt-2 text-sm leading-6 opacity-90 sm:text-base sm:leading-7">
        {label}
      </p>
    </article>
  );
}
