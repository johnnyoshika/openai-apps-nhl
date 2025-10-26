import { Spinner } from "@/components/ui/shadcn-io/spinner";
import "@/index.css";
import { mountWidget, useToolOutput } from "skybridge/web";
import { useState } from "react";

type Player = {
  id: number;
  firstName: string;
  lastName: string;
  number?: number;
  positionCode: string;
  positionGroup: "forwards" | "defensemen" | "goalies";
  shootsCatches?: string;
  headshot?: string;
  link?: string;
};

type Roster = {
  team: string;
  players: Player[];
};

const groupOrder = { forwards: 0, defensemen: 1, goalies: 2 } as const;
const label: Record<Player["positionGroup"], string> = {
  forwards: "Forwards",
  defensemen: "Defense",
  goalies: "Goalies",
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
    <div className="grid gap-2 md:grid-cols-2">{children}</div>
  </div>
);

type SkaterStats = { gamesPlayed?: number; goals?: number; assists?: number; points?: number };

const Card = ({ p }: { p: Player }) => {
  const [stats, setStats] = useState<SkaterStats | null>(null);
  const [loading, setLoading] = useState(false);

  const showStats = async () => {
    setLoading(true);
    try {
      type StatsPayload = { gamesPlayed?: number; goals?: number; assists?: number; points?: number };
      const resp = await window.openai?.callTool("nhl-player-landing", { id: p.id });
      const payload =
        (resp as { structuredContent?: StatsPayload })?.structuredContent ||
        (resp as { structuredOutput?: StatsPayload })?.structuredOutput;
      const s: SkaterStats | undefined = payload
        ? {
            gamesPlayed: payload.gamesPlayed,
            goals: payload.goals,
            assists: payload.assists,
            points: payload.points,
          }
        : undefined;
      setStats(s ?? null);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white text-gray-900 border border-gray-200 shadow-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
      <img src={p.headshot} alt={`${p.firstName} ${p.lastName}`} className="w-10 h-10 rounded object-cover" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <a href={p.link} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
            {p.firstName} {p.lastName}
          </a>
          {p.number !== undefined && <span className="text-xs text-gray-500">#{p.number}</span>}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          {p.positionCode} {p.shootsCatches ? `• ${p.shootsCatches}` : ""}
        </div>
        {stats && (
          <div className="text-xs text-gray-700 dark:text-gray-300 mt-1">
            {(() => {
              const { goals, assists, points, gamesPlayed } = stats!;
              const parts: string[] = [];
              if (typeof gamesPlayed === "number") parts.push(`GP ${gamesPlayed}`);
              if (typeof goals === "number") parts.push(`G ${goals}`);
              if (typeof assists === "number") parts.push(`A ${assists}`);
              if (typeof points === "number") parts.push(`P ${points}`);
              return parts.join(" • ");
            })()}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={showStats}
          className="px-2 py-1 rounded border text-xs font-semibold bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
        >
          {loading ? "Loading…" : stats ? "Refresh stats" : "Show stats"}
        </button>
      </div>
    </div>
  );
};

function RosterWidget() {
  const roster = useToolOutput() as Roster | null;

  if (!roster) {
    return (
      <div className="flex justify-center items-center h-50">
        <Spinner />
      </div>
    );
  }

  const byGroup = roster.players.reduce<Record<Player["positionGroup"], Player[]>>(
    (acc, p) => {
      acc[p.positionGroup].push(p);
      return acc;
    },
    { forwards: [], defensemen: [], goalies: [] },
  );

  return (
    <div className="p-4 rounded-xl flex flex-col gap-4 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase">{roster.team} Roster</h2>
        <span className="text-xs text-gray-600 dark:text-gray-300">{roster.players.length} players</span>
      </div>

      {Object.keys(byGroup)
        .sort((a, b) => groupOrder[a as keyof typeof groupOrder] - groupOrder[b as keyof typeof groupOrder])
        .map((k) => {
          const key = k as Player["positionGroup"];
          const players = byGroup[key];
          if (!players.length) return null;
          return (
            <Section key={key} title={label[key]}>
              {players.map((p) => (
                <Card key={p.id} p={p} />
              ))}
            </Section>
          );
        })}
    </div>
  );
}

export default RosterWidget;

mountWidget(<RosterWidget />);
