'use client';

import { useEffect, useState } from 'react';

interface BarChartProps {
  data: { label: string; value: number }[];
  maxValue?: number;
  height?: number;
  barColor?: string;
  emptyLabel?: string;
}

export default function BarChart({
  data,
  maxValue,
  height = 160,
  barColor = '#6366f1',
  emptyLabel = 'No activity yet',
}: BarChartProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  const barWidth = 100 / data.length;
  const allZero = data.every(d => d.value === 0);

  if (allZero) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-slate-400 italic">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${data.length * 60} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={barColor} />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        {data.map((item, i) => {
          let barH = animated ? (item.value / max) * (height - 30) : 0;
          if (item.value > 0 && barH < 22 && animated) {
            barH = 22; // ensure minimum height for text inside
          }
          const x = i * 60 + 10;
          const y = height - 20 - barH;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={40}
                height={barH}
                rx={6}
                ry={6}
                fill="url(#bar-gradient)"
                opacity={0.9}
                style={{ transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)', transitionDelay: `${i * 80}ms` }}
              />
              {/* Value label */}
              {item.value > 0 && (
                <text
                  x={x + 20}
                  y={y + 14}
                  textAnchor="middle"
                  className="fill-white text-[11px] font-bold"
                  style={{ transition: 'all 0.8s ease', transitionDelay: `${i * 80}ms`, opacity: animated ? 1 : 0 }}
                >
                  {item.value}
                </text>
              )}
              {/* Day label */}
              <text
                x={x + 20}
                y={height - 4}
                textAnchor="middle"
                className="fill-slate-400 text-[11px] font-semibold"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
