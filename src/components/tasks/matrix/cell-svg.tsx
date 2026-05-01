import type { Cell } from "@/lib/items/matrix";

const CELL_SIZE = 80;
const ICON_SIZE = 22;

export function CellSvg({
  cell,
  size = CELL_SIZE,
}: {
  cell: Cell;
  size?: number;
}) {
  const positions = positionsFor(cell.count, size, ICON_SIZE);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={describe(cell)}
    >
      <rect
        width={size}
        height={size}
        fill="white"
        stroke="rgb(231,233,237)"
        strokeWidth={1}
      />
      {positions.map((p, i) => (
        <g
          key={i}
          transform={`translate(${p.x},${p.y}) rotate(${cell.rotation})`}
        >
          <ShapeSvg shape={cell.shape} color={cell.color} size={ICON_SIZE} />
        </g>
      ))}
    </svg>
  );
}

export function CellPlaceholder({ size = CELL_SIZE }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Casella mancante"
    >
      <rect
        width={size}
        height={size}
        fill="rgb(246,247,249)"
        stroke="rgb(59,184,185)"
        strokeWidth={2}
        strokeDasharray="6 4"
      />
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        fontSize={size * 0.5}
        fill="rgb(138,147,154)"
        fontFamily="serif"
      >
        ?
      </text>
    </svg>
  );
}

function describe(cell: Cell): string {
  return `${cell.count} ${cell.shape}, ${cell.color}, rotazione ${cell.rotation}°`;
}

function positionsFor(count: 1 | 2 | 3, size: number, icon: number) {
  const cx = size / 2;
  const cy = size / 2;
  const offset = icon * 0.7;
  if (count === 1) return [{ x: cx, y: cy }];
  if (count === 2)
    return [
      { x: cx - offset, y: cy },
      { x: cx + offset, y: cy },
    ];
  return [
    { x: cx, y: cy - offset },
    { x: cx - offset, y: cy + offset / 2 },
    { x: cx + offset, y: cy + offset / 2 },
  ];
}

function ShapeSvg({
  shape,
  color,
  size,
}: {
  shape: Cell["shape"];
  color: string;
  size: number;
}) {
  const half = size / 2;
  switch (shape) {
    case "circle":
      return <circle r={half} fill={color} />;
    case "square":
      return <rect x={-half} y={-half} width={size} height={size} fill={color} />;
    case "diamond":
      return (
        <polygon
          points={`0,${-half} ${half},0 0,${half} ${-half},0`}
          fill={color}
        />
      );
    case "triangle":
      return (
        <polygon
          points={`0,${-half} ${half},${half} ${-half},${half}`}
          fill={color}
        />
      );
  }
}
