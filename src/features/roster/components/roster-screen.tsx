import Image from "next/image";
import Link from "next/link";
import { CountryFlagLabel } from "@/src/features/common/components/country-flag-label";
import type { Team } from "@/src/types";
import {
  formatPlayerBirthDate,
  getPlayerAgeFromBirthDate,
} from "@/src/lib/utils/player-birth-date";

interface RosterScreenProps {
  teams: Team[];
}

function formatNumberStat(value: number | null): string {
  return value === null ? "--" : String(value);
}

function formatAgeLabel(birthDate: string | null): string {
  const age = getPlayerAgeFromBirthDate(birthDate);

  if (age === null) {
    return "--";
  }

  return `${age} ans`;
}

export function RosterScreen({ teams }: RosterScreenProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:gap-10 sm:px-10 sm:py-10 lg:px-12">
        <header className="flex flex-col gap-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:gap-6 sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Roster CDL
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-200 transition-colors hover:border-emerald-400/40 hover:text-emerald-300"
            >
              Retour accueil
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl">
              Explore les rosters, team par team.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Clique sur une equipe ou sur les joueurs affiches pour derouler le
              bloc de stats. Tu peux ouvrir plusieurs teams en meme temps et
              comparer age, nationalite, role, note BP et titres.
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-5">
          {teams.map((team) => (
            <details
              key={team.id}
            className="group rounded-[1.5rem] border border-white/10 bg-white/5 p-4 transition-colors open:border-emerald-400/30 open:bg-white/[0.07] sm:rounded-[2rem] sm:p-6"
            >
              <summary className="flex cursor-pointer list-none flex-col gap-6 [&::-webkit-details-marker]:hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-5">
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-white/5 sm:h-16 sm:w-16">
                      {team.logoUrl ? (
                        <Image
                          src={team.logoUrl}
                          alt={`Logo ${team.name}`}
                          fill
                          sizes="64px"
                          className="object-contain p-2"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-black uppercase tracking-[0.2em] text-slate-300">
                          {team.tag}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                        {team.tag}
                      </p>
                      <h2 className="mt-2 text-xl font-black tracking-[-0.04em] text-white sm:text-2xl">
                        {team.name}
                      </h2>
                    </div>
                  </div>

                  <span className="rounded-full border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-slate-300 transition-colors group-open:border-emerald-400/30 group-open:text-emerald-300">
                    Voir details
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {team.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-3 rounded-[1.5rem] bg-slate-900/40 p-3"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-900">
                        <Image
                          src={player.imageUrl}
                          alt={`Portrait ${player.name}`}
                          fill
                          sizes="56px"
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                          {player.role ?? "--"}
                        </p>
                        <p className="mt-1 text-sm font-black uppercase tracking-[0.15em] text-white">
                          {player.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </summary>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {team.players.map((player) => (
                  <article
                    key={`${team.id}-${player.id}`}
                    className="rounded-[1.75rem] border border-white/10 bg-slate-900/40 p-4 sm:p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.5rem] bg-slate-900">
                        <Image
                          src={player.imageUrl}
                          alt={`Portrait ${player.name}`}
                          fill
                          sizes="80px"
                          className="object-contain"
                          unoptimized
                        />
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-300">
                          {team.tag}
                        </p>
                        <h3 className="mt-2 text-xl font-black tracking-[-0.04em] text-white sm:text-2xl">
                          {player.name}
                        </h3>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <RosterStat label="Role" value={player.role ?? "--"} />
                      <RosterStat
                        label="Nationalite"
                        value={<CountryFlagLabel country={player.country} />}
                      />
                      <RosterStat
                        label="Age"
                        value={formatAgeLabel(player.birthDate)}
                      />
                      <RosterStat
                        label="Naissance"
                        value={formatPlayerBirthDate(player.birthDate)}
                      />
                      <RosterStat
                        label="Note BP"
                        value={formatNumberStat(player.rating)}
                      />
                      <RosterStat
                        label="Titres"
                        value={`${formatNumberStat(
                          player.worldTitleCount,
                        )} World / ${formatNumberStat(
                          player.majorTitleCount,
                        )} Major`}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

function RosterStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white/5 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold tracking-[0.08em] text-white">
        {value}
      </p>
    </div>
  );
}
