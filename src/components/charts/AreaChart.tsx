'use client';

import { useEffect, useState, useMemo } from 'react';

interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
  lineColor?: string;
  gradientStart?: string;
  gradientEnd?: string;
}

export default function AreaChart({
  data,
  height = 240,
  lineColor = '#4F46E5', // Indigo-600
  gradientStart = 'rgba(79, 70, 229, 0.4)',
  gradientEnd = 'rgba(79, 70, 229, 0.0)'
}: AreaChartProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { pathData, areaPathData, points } = useMemo(() => {
    if (data.length === 0) return { pathData: '', areaPathData: '', points: [] };

    const maxVal = Math.max(...data.map(d => d.value), 4); // minimum ceiling of 4
    const minVal = 0;
    const range = maxVal - minVal;

    const width = 800; // SVG viewBox width
    const paddingX = 40;
    const paddingYTop = 20;
    const paddingYBottom = 40;
    const chartWidth = width - paddingX * 2;
    const chartHeight = height - paddingYTop - paddingYBottom;

    const stepX = chartWidth / (data.length - 1);

    const calcY = (val: number) => {
      if (!animated) return height - paddingYBottom;
      return height - paddingYBottom - ((val - minVal) / range) * chartHeight;
    };

    const pts = data.map((d, i) => ({
      x: paddingX + i * stepX,
      y: calcY(d.value),
      label: d.label
    }));

    // Create cubic bezier curve path
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        // Control points for smooth curve
        const cp1x = p1.x + (p2.x - p1.x) / 2;
        const cp1y = p1.y;
        const cp2x = p1.x + (p2.x - p1.x) / 2;
        const cp2y = p2.y;
        
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }

    // Create area path (close the curve to the bottom)
    const areaPath = `${path} L ${pts[pts.length - 1].x} ${height - paddingYBottom} L ${pts[0].x} ${height - paddingYBottom} Z`;

    return { pathData: path, areaPathData: areaPath, points: pts };
  }, [data, animated, height]);

  if (data.every(d => d.value === 0)) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-slate-400 italic font-medium">No activity data available.</p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 800 ${height}`} 
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientStart} />
            <stop offset="100%" stopColor={gradientEnd} />
          </linearGradient>
          {/* Subtle drop shadow for the line */}
          <filter id="line-shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={lineColor} floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Filled Area */}
        <path
          d={areaPathData}
          fill="url(#area-gradient)"
          className="transition-all duration-1000 ease-in-out"
        />

        {/* Smooth Line */}
        <path
          d={pathData}
          fill="none"
          stroke={lineColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#line-shadow)"
          className="transition-all duration-1000 ease-in-out"
        />

        {/* X-Axis Labels */}
        {points.map((p, i) => {
          // If we have many points (e.g. Month view), skip some labels to avoid crowding
          const shouldShowLabel = points.length <= 7 || i % Math.ceil(points.length / 5) === 0 || i === points.length - 1;
          
          if (!shouldShowLabel) return null;
          
          return (
            <text
              key={i}
              x={p.x}
              y={height - 10}
              textAnchor="middle"
              className="fill-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider"
            >
              {p.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
