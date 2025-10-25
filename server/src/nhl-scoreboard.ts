export type NhlScoreboardGame = {
  state: string;
  date: string;
  startTimeUTC: string;
  venue: string;
  home: { abbrev: string; name: string; record?: string; score?: number; logo: string };
  away: { abbrev: string; name: string; record?: string; score?: number; logo: string };
  tv: string[];
  links: { gameCenter?: string; tickets?: string };
};

type RawTeam = {
  abbrev: string;
  name?: { default?: string };
  record?: string;
  score?: number;
  logo?: string;
};

type RawGame = {
  gameState: string;
  gameDate: string;
  startTimeUTC: string;
  venue?: { default?: string };
  homeTeam?: RawTeam;
  awayTeam?: RawTeam;
  tvBroadcasts?: { network?: string }[];
  gameCenterLink?: string;
  ticketsLink?: string;
};

export const getTeamScoreboard = async (team: string): Promise<{ team: string; games: NhlScoreboardGame[] }> => {
  const code = team.toUpperCase();
  const res = await fetch(`https://api-web.nhle.com/v1/scoreboard/${code}/now`);
  if (!res.ok) throw new Error(`Failed to fetch scoreboard for ${code}`);
  const data = await res.json();

  const allGames: (RawGame & { date: string })[] = (
    (data.gamesByDate || []) as { date: string; games: RawGame[] }[]
  ).flatMap((d) => d.games.map((g) => ({ date: d.date, ...g })));

  const relevantStates = new Set(["LIVE", "CRIT", "PRE", "FUT"]);
  const selected = allGames
    .filter((g) => relevantStates.has(g.gameState))
    .sort((a, b) => new Date(a.startTimeUTC).getTime() - new Date(b.startTimeUTC).getTime());

  const games: NhlScoreboardGame[] = selected.map((g) => ({
    state: g.gameState,
    date: g.gameDate,
    startTimeUTC: g.startTimeUTC,
    venue: g.venue?.default ?? "",
    home: {
      abbrev: g.homeTeam?.abbrev ?? "",
      name: g.homeTeam?.name?.default ?? "",
      record: g.homeTeam?.record,
      score: typeof g.homeTeam?.score === "number" ? g.homeTeam.score : undefined,
      logo: g.homeTeam?.logo ?? "",
    },
    away: {
      abbrev: g.awayTeam?.abbrev ?? "",
      name: g.awayTeam?.name?.default ?? "",
      record: g.awayTeam?.record,
      score: typeof g.awayTeam?.score === "number" ? g.awayTeam.score : undefined,
      logo: g.awayTeam?.logo ?? "",
    },
    tv: (g.tvBroadcasts || []).map((b) => b.network || "").filter(Boolean) as string[],
    links: {
      gameCenter: g.gameCenterLink ? `https://www.nhl.com${g.gameCenterLink}` : undefined,
      tickets: g.ticketsLink,
    },
  }));

  return { team: code, games };
};
