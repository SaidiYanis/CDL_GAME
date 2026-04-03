import Image from "next/image";
import type { Player, Team } from "@/src/types";

interface PlayerCardProps {
  player: Player;
  revealTeam?: boolean;
  score: number;
  team: Team | null;
}

function formatStatValue(value: number | null): string {
  return value === null ? "--" : String(value);
}

function formatTextValue(value: string | null): string {
  return value ?? "--";
}

export function PlayerCard({
  player,
  revealTeam = true,
  score,
  team,
}: PlayerCardProps) {
  const displayedTeamName = revealTeam ? (team?.name ?? player.teamTag) : "???";
  const displayedTeamTag = revealTeam ? player.teamTag : "???";
  const displayedTeamLogo = revealTeam ? team?.logoUrl : null;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="relative aspect-square w-full overflow-hidden rounded-[1.5rem] bg-slate-900">
        <Image
          key={`${player.imageUrl}-${score}`}
          src={player.imageUrl}
          alt="Joueur CDL a deviner"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-contain"
          unoptimized
        />
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-slate-900/40 p-5">
        <div className="flex items-center gap-4">
          {displayedTeamLogo ? (
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white/5">
              <Image
                src={displayedTeamLogo}
                alt={`Logo ${team?.name ?? player.teamTag}`}
                fill
                sizes="56px"
                className="object-contain p-2"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              {displayedTeamTag}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Indices joueur
            </p>
            <p className="mt-2 text-xl font-black tracking-[-0.04em] text-white">
              {displayedTeamName}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <PlayerStat label="Role" value={formatTextValue(player.role)} />
          <PlayerStat label="Note BP" value={formatStatValue(player.rating)} />
          <PlayerStat
            label="Nationalite"
            value={formatTextValue(player.country)}
          />
          <PlayerStat
            label="Titres"
            value={`${formatStatValue(
              player.worldTitleCount,
            )} World / ${formatStatValue(player.majorTitleCount)} Major`}
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
