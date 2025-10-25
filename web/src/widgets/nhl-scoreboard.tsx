import { Spinner } from "@/components/ui/shadcn-io/spinner";
import "@/index.css";

import { mountWidget, useToolOutput } from "skybridge/web";

type TeamInfo = {
  abbrev: string;
  name: string;
  record?: string;
  score?: number;
  logo: string;
};

type Game = {
  state: string;
  date: string;
  startTimeUTC: string;
  venue: string;
  home: TeamInfo;
  away: TeamInfo;
  tv: string[];
  links: { gameCenter?: string; tickets?: string };
};

type Scoreboard = {
  team: string;
  games: Game[];
};

const formatDateTime = (isoUtc: string) => {
  try {
    const d = new Date(isoUtc);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return isoUtc;
  }
};

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 text-xs font-semibold">
    {children}
  </span>
);

const Tile = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 rounded-xl bg-white text-gray-900 border border-gray-200 shadow-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
    {children}
  </div>
);

function ScoreboardWidget() {
  const data = useToolOutput() as Scoreboard | null;

  if (!data) {
    return (
      <div className="flex justify-center items-center h-50">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl flex flex-col gap-4 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase text-gray-900 dark:text-gray-100">{data.team} Scoreboard</h2>
        <Badge>{data.games.length} games</Badge>
      </div>

      <div className="flex flex-col gap-3">
        {data.games.map((g, i) => (
          <Tile key={`${g.startTimeUTC}-${i}`}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge>{g.state}</Badge>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{formatDateTime(g.startTimeUTC)}</span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{g.venue}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <TeamRow team={g.away} right />
                <TeamRow team={g.home} />
              </div>

              <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                <div className="flex gap-2 flex-wrap">
                  {g.tv.map((n, idx) => (
                    <Badge key={`${n}-${idx}`}>{n}</Badge>
                  ))}
                </div>
                <div className="flex gap-3">
                  {g.links.gameCenter && (
                    <a
                      className="text-blue-700 hover:underline dark:text-blue-400"
                      href={g.links.gameCenter}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Game Center
                    </a>
                  )}
                  {g.links.tickets && (
                    <a
                      className="text-blue-700 hover:underline dark:text-blue-400"
                      href={g.links.tickets}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Tickets
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Tile>
        ))}
      </div>
    </div>
  );
}

const TeamRow = ({ team, right }: { team: TeamInfo; right?: boolean }) => (
  <div className={`flex items-center ${right ? "justify-end" : ""} gap-3`}>
    <img src={team.logo} alt={team.abbrev} className="w-8 h-8 object-contain" />
    <div className={`flex flex-col ${right ? "items-end" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{team.name}</span>
        {team.record && <span className="text-xs text-gray-500">{team.record}</span>}
      </div>
      {typeof team.score === "number" && <div className="text-xl font-bold">{team.score}</div>}
    </div>
  </div>
);

export default ScoreboardWidget;

mountWidget(<ScoreboardWidget />);
