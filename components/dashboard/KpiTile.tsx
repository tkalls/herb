import LiveNumber from "./LiveNumber";

type Accent = "amber" | "emerald" | "blue" | "orange" | "red";

interface KpiTileProps {
  label: string;
  value: number;
  sub?: string;
  format?: (v: number) => string;
  accent?: Accent;
}

const accentMap: Record<Accent, { bar: string; value: string; dot: string }> = {
  amber:   { bar: "bg-amber-500",   value: "text-amber-400",   dot: "bg-amber-500" },
  emerald: { bar: "bg-emerald-500", value: "text-emerald-400", dot: "bg-emerald-500" },
  blue:    { bar: "bg-blue-500",    value: "text-blue-400",    dot: "bg-blue-500" },
  orange:  { bar: "bg-orange-500",  value: "text-orange-400",  dot: "bg-orange-500" },
  red:     { bar: "bg-red-500",     value: "text-red-400",     dot: "bg-red-500" },
};

export default function KpiTile({ label, value, sub, format, accent }: KpiTileProps) {
  const ac = accent ? accentMap[accent] : null;
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 relative overflow-hidden">
      {ac && (
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${ac.bar}`} />
      )}
      <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-black tabular-nums ${ac ? ac.value : "text-white"}`}>
        <LiveNumber value={value} format={format} />
      </div>
      {sub && (
        <div className="mt-1 text-xs text-zinc-600">{sub}</div>
      )}
    </div>
  );
}
