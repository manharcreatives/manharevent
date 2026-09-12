"use client";

interface DataPoint {
  label: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  label?: string;
}

export function SalesChart({ data, label = "Sales" }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 320;
  const h = 120;
  const pad = { top: 8, right: 8, bottom: 24, left: 40 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const barW = Math.max(2, chartW / data.length - 4);

  return (
    <div>
      {label && <p className="mb-2 text-xs text-muted-foreground">{label}</p>}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        role="img"
        aria-label={label}
      >
        {/* Y-axis labels */}
        {[0, 0.5, 1].map((frac) => {
          const y = pad.top + chartH * (1 - frac);
          const val = Math.round(max * frac);
          return (
            <g key={frac}>
              <line
                x1={pad.left} y1={y}
                x2={w - pad.right} y2={y}
                stroke="hsl(240 8% 20%)" strokeWidth={0.5}
              />
              <text
                x={pad.left - 4} y={y + 4}
                textAnchor="end"
                fontSize={9}
                fill="hsl(240 6% 44%)"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.value / max) * chartH;
          const x = pad.left + (chartW / data.length) * i + (chartW / data.length - barW) / 2;
          const y = pad.top + chartH - barH;
          return (
            <g key={i}>
              <rect
                x={x} y={y}
                width={barW} height={barH}
                rx={2}
                fill="hsl(14 92% 56% / 0.8)"
              />
              <text
                x={x + barW / 2}
                y={h - pad.bottom + 12}
                textAnchor="middle"
                fontSize={8}
                fill="hsl(240 6% 44%)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
