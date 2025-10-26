export type LeaderItem = {
  id: number;
  firstName: string;
  lastName: string;
  teamAbbrev: string;
  teamName?: string;
  sweaterNumber?: number;
  position?: string;
  headshot?: string;
  teamLogo?: string;
  value: number;
};

export type LeadersResponse = Record<string, LeaderItem[]>;

const API = "https://api-web.nhle.com/v1/skater-stats-leaders/current" as const;

export const getLeaders = async (
  categories: string[] = ["points", "goals", "assists"],
  limit = 10,
): Promise<LeadersResponse> => {
  const url = `${API}?categories=${encodeURIComponent(categories.join(","))}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch leaders: ${res.status}`);
  const json = await res.json();

  const out: LeadersResponse = {};
  for (const cat of categories) {
    const arr = (json?.[cat] as any[]) || [];
    out[cat] = arr.map((p) => ({
      id: p.id,
      firstName: p.firstName?.default ?? "",
      lastName: p.lastName?.default ?? "",
      teamAbbrev: p.teamAbbrev ?? "",
      teamName: p.teamName?.default ?? undefined,
      sweaterNumber: p.sweaterNumber ?? undefined,
      position: p.position ?? undefined,
      headshot: p.headshot ?? undefined,
      teamLogo: p.teamLogo ?? undefined,
      value: p.value ?? 0,
    }));
  }
  return out;
};
