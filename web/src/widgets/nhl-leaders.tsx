import { Spinner } from "@/components/ui/shadcn-io/spinner";
import "@/index.css";
import { mountWidget, useToolOutput } from "skybridge/web";

type LeaderItem = {
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

type Leaders = Record<string, LeaderItem[]>;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">{children}</div>
  </div>
);

const Row = ({ p, rank }: { p: LeaderItem; rank: number }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-white text-gray-900 border border-gray-200 shadow-sm dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
    <div className="w-6 text-right font-semibold text-gray-600 dark:text-gray-300">{rank}.</div>
    <img src={p.headshot} alt={`${p.firstName} ${p.lastName}`} className="w-10 h-10 rounded object-cover" />
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <span className="font-semibold">
          {p.firstName} {p.lastName}
        </span>
        {p.sweaterNumber != null && <span className="text-xs text-gray-500">#{p.sweaterNumber}</span>}
      </div>
      <div className="text-xs text-gray-600 dark:text-gray-300">
        {p.teamAbbrev} • {p.position}
      </div>
    </div>
    <div className="text-lg font-bold tabular-nums">{p.value}</div>
  </div>
);

function LeadersWidget() {
  const leaders = useToolOutput() as Leaders | null;

  if (!leaders) {
    return (
      <div className="flex justify-center items-center h-50">
        <Spinner />
      </div>
    );
  }

  const sections: Array<[string, string]> = [
    ["points", "Points"],
    ["goals", "Goals"],
    ["assists", "Assists"],
  ];

  return (
    <div className="p-4 rounded-xl flex flex-col gap-4 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase">Leaders</h2>
      </div>

      {sections.map(([key, title]) => (
        <Section key={key} title={title}>
          {(leaders[key] ?? []).map((p, idx) => (
            <Row key={`${key}-${p.id}`} p={p} rank={idx + 1} />
          ))}
        </Section>
      ))}
    </div>
  );
}

export default LeadersWidget;

mountWidget(<LeadersWidget />);
