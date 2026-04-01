'use client';

import { useEffect, useState } from 'react';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  bgColor?: string;
  showLabel?: boolean;
}

export default function ProgressRing({
  percentage,
  size = 44,
  strokeWidth = 4,
  bgColor = '#e2e8f0',
  showLabel = true,
}: ProgressRingProps) {
  const [animatedPct, setAnimatedPct] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(percentage), 150);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPct / 100) * circumference;
  const center = size / 2;

  // Color based on completion
  const progressColor = animatedPct >= 100 ? '#459D68' : animatedPct > 50 ? '#4A55E2' : '#f59e0b';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-[10px] font-bold text-slate-700">
          {Math.round(animatedPct)}
        </span>
      )}
    </div>
  );
}
