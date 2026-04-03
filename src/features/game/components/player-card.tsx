import Image from "next/image";
import type { Player, Team } from "@/src/types";

interface PlayerCardProps {
  player: Player;
  score: number;
  team: Team | null;
}

function formatStatValue(value: number | null): string {
  return value === null ? "--" : String(value);
}

function formatTextValue(value: string | null): string {
  return value ?? "--";
}

export function PlayerCard({ player, score, team }: PlayerCardProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] bg-slate-900">
        <Image
          key={`${player.imageUrl}-${score}`}
          src={player.imageUrl}
          alt="Joueur CDL a deviner"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-900/40 p-5">
        <div className="flex items-center gap-4">
          {team?.logoUrl ? (
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white/5">
              <Image
                src={team.logoUrl}
                alt={`Logo ${team.name}`}
                fill
                sizes="56px"
                className="object-contain p-2"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {player.teamTag}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Indices joueur
            </p>
            <p className="mt-2 text-xl font-black tracking-[-0.04em] text-white">
              {team?.name ?? player.teamTag}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <PlayerStat label="Role" value={formatTextValue(player.role)} />
          <PlayerStat label="Pays" value={formatTextValue(player.country)} />
          <PlayerStat label="Note BP" value={formatStatValue(player.rating)} />
          <PlayerStat
            label="Titres"
            value={`${formatStatValue(player.worldTitleCount)}W / ${formatStatValue(
              player.majorTitleCount,
            )}M`}
          />
        </div>
      </div>
    </section>
  );
}

function PlayerStat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-3xl bg-white/5 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold uppercase tracking-[0.15em] text-white">
        {value}
      </p>
    </article>
  );
}
