import Image from "next/image";
import type { Player, Team } from "@/src/types";

interface DuelPlayerCardProps {
  player: Player;
  sideLabel: string;
  team: Team | null;
}

function formatMetaValue(value: string | null): string {
  return value ?? "--";
}

export function DuelPlayerCard({
  player,
  sideLabel,
  team,
}: DuelPlayerCardProps) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">
          {sideLabel}
        </p>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
          {player.role ?? "--"}
        </p>
      </div>

      <div className="relative mt-5 aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-slate-900">
        <Image
          src={player.imageUrl}
          alt={`Portrait de ${player.name}`}
          fill
          sizes="(max-width: 768px) 100vw, 420px"
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="mt-5 flex items-center gap-4 rounded-[1.5rem] bg-slate-900/40 p-4">
        {team?.logoUrl ? (
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white/5">
            <Image
              src={team.logoUrl}
              alt={`Logo ${team.name}`}
              fill
              sizes="48px"
              className="object-contain p-2"
              unoptimized
            />
          </div>
        ) : null}

        <div>
          <h2 className="text-xl font-black tracking-[-0.04em] text-white">
            {player.name}
          </h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {formatMetaValue(team?.name ?? player.teamTag)} -{" "}
            {formatMetaValue(player.country)}
          </p>
        </div>
      </div>
    </article>
  );
}
