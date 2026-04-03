import { RosterScreen } from "@/src/features/roster/components/roster-screen";
import { playerRepository } from "@/src/lib/data/player-repository-provider";

export default async function RosterPage() {
  const teams = await playerRepository.getTeams();

  return <RosterScreen teams={teams} />;
}
