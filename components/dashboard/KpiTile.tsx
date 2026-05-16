import LiveNumber from "./LiveNumber";

interface KpiTileProps {
  label: string;
  value: number;
  sub?: string;
  format?: (v: number) => string;
}

export default function KpiTile({ label, value, sub, format }: KpiTileProps) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-mono uppercase tracking-wider text-stone-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-mono font-semibold text-stone-900">
        <LiveNumber value={value} format={format} />
      </div>
      {sub && (
        <div className="mt-1 text-xs text-stone-600">{sub}</div>
      )}
    </div>
  );
}
