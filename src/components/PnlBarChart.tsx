import { useMemo } from 'react';

interface BarChartProps {
  data: { label: string; value: number }[];
  title: string;
  icon: string;
  height?: number;
}

export default function PnlBarChart({ data, title, icon, height = 160 }: BarChartProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return { bars: [], maxAbs: 0 };
    const maxAbs = Math.max(...data.map(d => Math.abs(d.value)), 1);
    return { bars: data, maxAbs };
  }, [data]);

  const fmt = (v: number) => (v >= 0 ? '+' : '-') + '$' + Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 });

  if (data.length === 0) {
    return (
      <div className="bg-surface-container border border-outline-variant rounded flex flex-col">
        <div className="px-3 py-2 border-b border-outline-variant flex items-center gap-1.5 bg-surface-container-high">
          <span className="material-symbols-outlined text-primary text-fluid-14">{icon}</span>
          <span className="text-fluid-10 text-on-surface-variant uppercase tracking-wider font-bold">{title}</span>
        </div>
        <div className="flex items-center justify-center text-on-surface-variant text-xs italic" style={{ height }}>
          No data
        </div>
      </div>
    );
  }

  const barWidth = Math.max(16, Math.min(48, Math.floor((600 - data.length * 4) / data.length)));
  const midY = height / 2;

  return (
    <div className={`${title ? 'bg-surface-container border border-outline-variant rounded' : ''} flex flex-col overflow-hidden`}>
      {title && (
        <div className="px-3 py-2 border-b border-outline-variant flex items-center justify-between bg-surface-container-high">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-fluid-14">{icon}</span>
            <span className="text-fluid-10 text-on-surface-variant uppercase tracking-wider font-bold">{title}</span>
          </div>
          <span className="text-fluid-9 font-mono-data text-on-surface-variant">{data.length} periods</span>
        </div>
      )}
      <div className="px-3 py-2 overflow-x-auto">
        <svg width="100%" height={height} viewBox={`0 0 ${Math.max(data.length * (barWidth + 4) + 40, 200)} ${height}`} preserveAspectRatio="xMidYMid meet">
          {/* Zero line */}
          <line x1="30" y1={midY} x2={data.length * (barWidth + 4) + 36} y2={midY} stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="3,3" />
          {/* Y-axis labels */}
          <text x="28" y={12} textAnchor="end" className="fill-current text-on-surface-variant" fontSize="8" fontFamily="monospace">{fmt(chartData.maxAbs)}</text>
          <text x="28" y={midY + 3} textAnchor="end" className="fill-current text-on-surface-variant" fontSize="8" fontFamily="monospace">$0</text>
          <text x="28" y={height - 4} textAnchor="end" className="fill-current text-on-surface-variant" fontSize="8" fontFamily="monospace">{fmt(-chartData.maxAbs)}</text>

          {/* Bars */}
          {chartData.bars.map((d, i) => {
            const x = 36 + i * (barWidth + 4);
            const barH = (Math.abs(d.value) / chartData.maxAbs) * (midY - 14);
            const isPositive = d.value >= 0;
            const y = isPositive ? midY - barH : midY;
            const fill = isPositive ? '#4ade80' : '#f87171';

            return (
              <g key={i}>
                <rect x={x} y={y} width={barWidth} height={Math.max(barH, 1)} fill={fill} rx="2" opacity="0.85">
                  <title>{d.label}: {fmt(d.value)}</title>
                </rect>
                {/* Hover glow */}
                <rect x={x} y={y} width={barWidth} height={Math.max(barH, 1)} fill={fill} rx="2" opacity="0" className="hover:opacity-30 transition-opacity">
                  <title>{d.label}: {fmt(d.value)}</title>
                </rect>
                {/* Value label on bar */}
                {barH > 14 && (
                  <text x={x + barWidth / 2} y={isPositive ? y + barH / 2 + 3 : y + barH / 2 + 3} textAnchor="middle" fontSize="7" fontFamily="monospace" fill="white" opacity="0.9">
                    {fmt(d.value)}
                  </text>
                )}
                {/* X-axis label */}
                <text x={x + barWidth / 2} y={height - 1} textAnchor="middle" fontSize="7" fontFamily="monospace" className="fill-current text-on-surface-variant" opacity="0.7">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
