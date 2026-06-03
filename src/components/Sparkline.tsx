import type { HistoryPoint } from '../types';

interface SparklineProps {
  data: HistoryPoint[];
  width?: number;
  height?: number;
}

export default function Sparkline({ data, width = 400, height = 100 }: SparklineProps) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.rate);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const padX = 12;
  const padY = 10;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const toX = (i: number) => padX + (i / (data.length - 1)) * innerW;
  const toY = (v: number) => padY + innerH - ((v - min) / range) * innerH;

  const points = data.map((d, i) => `${toX(i)},${toY(d.rate)}`).join(' ');

  // Area fill path
  const areaPath =
    `M ${toX(0)},${toY(data[0].rate)} ` +
    data.slice(1).map((d, i) => `L ${toX(i + 1)},${toY(d.rate)}`).join(' ') +
    ` L ${toX(data.length - 1)},${padY + innerH} L ${toX(0)},${padY + innerH} Z`;

  const last = data[data.length - 1];
  const first = data[0];
  const trend = last.rate >= first.rate;
  const color = trend ? '#6366f1' : '#ef4444';
  const fillColor = trend ? '#eef2ff' : '#fee2e2';

  // Axis labels
  const minDate = data[0].date.slice(5); // MM-DD
  const maxDate = data[data.length - 1].date.slice(5);
  const midDate = data[Math.floor(data.length / 2)].date.slice(5);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 -8 ${width} ${height + 28}`}
        className="w-full"
        style={{ minWidth: 240 }}
        aria-label="Évolution du taux sur 30 jours"
        role="img"
      >
        {/* Area */}
        <path d={areaPath} fill={fillColor} opacity={0.6} />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Last point dot */}
        <circle
          cx={toX(data.length - 1)}
          cy={toY(last.rate)}
          r={4}
          fill={color}
        />

        {/* Min/Max labels */}
        <text x={padX} y={toY(max) - 4} fontSize={9} fill="#6b7280" textAnchor="start">
          {max.toFixed(4)}
        </text>
        <text x={padX} y={toY(min) + 12} fontSize={9} fill="#6b7280" textAnchor="start">
          {min.toFixed(4)}
        </text>

        {/* Date labels */}
        <text x={toX(0)} y={height + 16} fontSize={9} fill="#9ca3af" textAnchor="start">
          {minDate}
        </text>
        <text x={toX(Math.floor(data.length / 2))} y={height + 16} fontSize={9} fill="#9ca3af" textAnchor="middle">
          {midDate}
        </text>
        <text x={toX(data.length - 1)} y={height + 16} fontSize={9} fill="#9ca3af" textAnchor="end">
          {maxDate}
        </text>
      </svg>
    </div>
  );
}
