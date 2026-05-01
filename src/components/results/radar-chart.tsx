import { FACTOR_CODES, type FactorCode } from "@/types/scoring";
import { TASKS } from "@/lib/tasks/catalog";

type Props = {
  factorZScores: Record<FactorCode, number>;
  size?: number;
};

const FACTOR_LABELS: Record<FactorCode, string> = {
  Gf: "Ragionamento fluido",
  Gwm: "Memoria di lavoro",
  Gs: "Velocità di elaborazione",
  Gv: "Visuospaziale",
  Gc: "Conoscenza cristallizzata",
};

const Z_MIN = -3;
const Z_MAX = 3;

export function RadarChart({ factorZScores, size = 360 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const labelRadius = radius + 36;

  const n = FACTOR_CODES.length;
  // Punti del poligono dei valori
  const points = FACTOR_CODES.map((f, i) => {
    const z = clamp(factorZScores[f], Z_MIN, Z_MAX);
    const r = (radius * (z - Z_MIN)) / (Z_MAX - Z_MIN);
    return polar(cx, cy, r, angle(i, n));
  });
  const valuePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ") + " Z";

  // grid: 5 cerchi concentrici (z = -3, -1.5, 0, 1.5, 3)
  const gridLevels = [Z_MIN, -1.5, 0, 1.5, Z_MAX];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Radar a 5 dimensioni: ${FACTOR_CODES.map((f) => `${f} z=${factorZScores[f].toFixed(2)}`).join(", ")}`}
    >
      {/* griglia: cerchi */}
      {gridLevels.map((g) => {
        const r = (radius * (g - Z_MIN)) / (Z_MAX - Z_MIN);
        return (
          <circle
            key={g}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgb(231,233,237)"
            strokeWidth={g === 0 ? 1.5 : 1}
            strokeDasharray={g === 0 ? "" : "2 4"}
          />
        );
      })}
      {/* assi */}
      {FACTOR_CODES.map((_, i) => {
        const p = polar(cx, cy, radius, angle(i, n));
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgb(231,233,237)"
          />
        );
      })}
      {/* poligono valori */}
      <path
        d={valuePath}
        fill="rgba(59,184,185,0.18)"
        stroke="rgb(35,52,96)"
        strokeWidth={2}
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={4}
          fill="rgb(35,52,96)"
        />
      ))}
      {/* etichette assi */}
      {FACTOR_CODES.map((f, i) => {
        const p = polar(cx, cy, labelRadius, angle(i, n));
        return (
          <g key={f}>
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="13"
              fontWeight={600}
              fill="rgb(35,52,96)"
            >
              {f}
            </text>
            <text
              x={p.x}
              y={p.y + 14}
              textAnchor="middle"
              fontSize="10"
              fill="rgb(138,147,154)"
            >
              {shortLabel(FACTOR_LABELS[f])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function angle(i: number, n: number): number {
  // 0 = top, clockwise
  return (Math.PI * 2 * i) / n - Math.PI / 2;
}

function polar(cx: number, cy: number, r: number, a: number) {
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function shortLabel(s: string): string {
  return s.length > 22 ? s.slice(0, 20) + "..." : s;
}

void TASKS;
