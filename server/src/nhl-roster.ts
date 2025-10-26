export type NhlPlayer = {
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

export type NhlRoster = {
  team: string;
  players: NhlPlayer[];
};

export const getTeamRoster = async (team: string): Promise<NhlRoster> => {
  const code = team.toUpperCase();
  const res = await fetch(`https://api-web.nhle.com/v1/roster/${code}/current`);
  if (!res.ok) throw new Error(`Failed to fetch roster for ${code}`);
  const data = await res.json();

  const collect = (group: "forwards" | "defensemen" | "goalies") =>
    ((data?.[group] as any[]) || []).map((p) => ({
      id: p.id as number,
      firstName: p.firstName?.default ?? "",
      lastName: p.lastName?.default ?? "",
      number: p.sweaterNumber as number | undefined,
      positionCode: p.positionCode as string,
      positionGroup: group,
      shootsCatches: p.shootsCatches as string | undefined,
      headshot: p.headshot as string | undefined,
      link: p.id ? `https://www.nhl.com/player/${p.id}` : undefined,
    }));

  const players = [
    ...collect("forwards"),
    ...collect("defensemen"),
    ...collect("goalies"),
  ].sort((a, b) => {
    const order = { forwards: 0, defensemen: 1, goalies: 2 } as const;
    if (order[a.positionGroup] !== order[b.positionGroup])
      return order[a.positionGroup] - order[b.positionGroup];
    if ((a.number ?? 0) !== (b.number ?? 0))
      return (a.number ?? 999) - (b.number ?? 999);
    return a.lastName.localeCompare(b.lastName);
  });

  return { team: code, players };
};
