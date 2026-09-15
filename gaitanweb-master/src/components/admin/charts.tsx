import { cn, formatTHB } from "@/lib/utils";

export interface ChartPoint {
  label: string;
  value: number;
}

/** Round a max value up to a "nice" axis ceiling (1/2/2.5/5 × 10^n). */
function niceCeil(max: number) {
  if (max <= 0) return 0;
  const mag = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * mag >= max) return step * mag;
  }
  return 10 * mag;
}

function compactTHB(n: number) {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `฿${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return `฿${n}`;
}

export function ChartEmpty({ className, label = "ยังไม่มีข้อมูลในช่วงเวลานี้" }: { className?: string; label?: string }) {
  return (
    <div
      className={cn(
        "flex h-44 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-2",
        className
      )}
    >
      {label}
    </div>
  );
}

export function AreaChart({
  points,
  gradientId = "area-fill",
  className,
}: {
  points: ChartPoint[];
  gradientId?: string;
  className?: string;
}) {
  const max = Math.max(0, ...points.map((p) => p.value));
  if (max === 0) return <ChartEmpty className={className} />;

  const W = 640;
  const H = 210;
  const PL = 48;
  const PR = 14;
  const PT = 14;
  const PB = 30;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const ceil = niceCeil(max);
  const n = points.length;
  const x = (i: number) => PL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => PT + innerH - (v / ceil) * innerH;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const base = (PT + innerH).toFixed(1);
  const area = `${line} L${x(n - 1).toFixed(1)},${base} L${x(0).toFixed(1)},${base} Z`;
  const labelEvery = Math.max(1, Math.ceil(n / 8));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("h-auto w-full", className)} role="img" aria-label="กราฟยอดขายรายวัน">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9d5ff0" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={PL} x2={W - PR} y1={y(ceil * t)} y2={y(ceil * t)} style={{ stroke: "var(--border)" }} strokeDasharray="3 4" />
          <text x={PL - 8} y={y(ceil * t) + 4} textAnchor="end" fontSize="11" style={{ fill: "var(--muted-2)" }}>
            {compactTHB(ceil * t)}
          </text>
        </g>
      ))}

      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" style={{ stroke: "var(--primary-strong)" }} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {points.map(
        (p, i) =>
          p.value > 0 && (
            <circle key={p.label} cx={x(i)} cy={y(p.value)} r="3.5" strokeWidth="2" style={{ fill: "var(--background)", stroke: "var(--primary-strong)" }}>
              <title>{`${p.label}: ${formatTHB(p.value)}`}</title>
            </circle>
          )
      )}

      {points.map(
        (p, i) =>
          i % labelEvery === 0 && (
            <text key={p.label} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" style={{ fill: "var(--muted-2)" }}>
              {p.label}
            </text>
          )
      )}
    </svg>
  );
}

export function ColumnChart({ points, className }: { points: ChartPoint[]; className?: string }) {
  const max = Math.max(0, ...points.map((p) => p.value));
  if (max === 0) return <ChartEmpty className={className} />;

  return (
    <div className={cn("flex h-48 items-end gap-2", className)}>
      {points.map((p) => (
        <div key={p.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-2" title={`${p.label}: ${formatTHB(p.value)}`}>
          <span className="text-[10px] font-semibold text-muted opacity-0 transition-opacity group-hover:opacity-100">
            {compactTHB(p.value)}
          </span>
          <div
            className="w-full rounded-t-sm bg-gradient-to-t from-primary/30 to-primary-strong transition-all group-hover:brightness-125"
            style={{ height: `${p.value === 0 ? 2 : Math.max(4, (p.value / max) * 100)}%`, opacity: p.value === 0 ? 0.3 : 1 }}
          />
          <span className="text-[10px] text-muted-2">{p.label}</span>
        </div>
      ))}
    </div>
  );
}

export interface BarRow {
  label: string;
  sublabel?: string;
  value: number;
  display: string;
  color?: string;
}

export function BarList({ rows, className }: { rows: BarRow[]; className?: string }) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  if (rows.length === 0 || max === 0) return <ChartEmpty className={className} />;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="w-4 shrink-0 text-xs font-bold text-muted-2">{i + 1}</span>
              <span className="truncate font-medium text-foreground">{r.label}</span>
              {r.sublabel && <span className="shrink-0 text-xs text-muted-2">{r.sublabel}</span>}
            </span>
            <span className="shrink-0 font-bold text-foreground">{r.display}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full"
              style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? "linear-gradient(90deg, var(--primary), var(--primary-strong))" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function Donut({ slices, centerLabel, className }: { slices: DonutSlice[]; centerLabel: string; className?: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <ChartEmpty className={className} />;

  const R = 44;
  const C = 2 * Math.PI * R;
  // Each arc starts where the previous one ended.
  const arcs = slices.reduce<{ slice: DonutSlice; len: number; offset: number }[]>((acc, slice) => {
    const prev = acc[acc.length - 1];
    const offset = prev ? prev.offset + prev.len : 0;
    acc.push({ slice, len: (slice.value / total) * C, offset });
    return acc;
  }, []);

  return (
    <div className={cn("flex items-center gap-6", className)}>
      <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0 -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" strokeWidth="14" style={{ stroke: "var(--surface-2)" }} />
        {arcs.map(({ slice: s, len, offset }) => (
          <circle
            key={s.label}
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth="14"
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-offset}
            style={{ stroke: s.color }}
          >
            <title>{`${s.label}: ${s.value} (${Math.round((s.value / total) * 100)}%)`}</title>
          </circle>
        ))}
        <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="800" transform="rotate(90 60 60)" style={{ fill: "var(--foreground)" }}>
          {total}
        </text>
        <text x="60" y="72" textAnchor="middle" fontSize="9" transform="rotate(90 60 60)" style={{ fill: "var(--muted-2)" }}>
          {centerLabel}
        </text>
      </svg>
      <ul className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="truncate text-muted">{s.label}</span>
            </span>
            <span className="shrink-0 font-semibold text-foreground">
              {s.value} <span className="text-xs font-normal text-muted-2">({Math.round((s.value / total) * 100)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
