'use client';

import { BarChart, Bar, ResponsiveContainer, Cell, Tooltip, XAxis } from 'recharts';

interface MiniBarChartProps {
  data: { name: string; value: number }[];
  color?: string;
  height?: number;
}

export default function MiniBarChart({ 
  data, 
  color = '#4f46e5', 
  height = 60 
}: MiniBarChartProps) {
  
  if (!data || data.length === 0) return null;

  return (
    <div 
      className="w-full mt-2 h-[50px] animate-in fade-in duration-1000 mx-auto"
      style={{ maxWidth: data.length === 1 ? '30px' : data.length === 2 ? '50px' : data.length === 3 ? '70px' : data.length === 4 ? '90px' : '110px' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap={4}>
          <Tooltip 
            cursor={{ fill: 'transparent' }} 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl border border-white/10 uppercase tracking-tighter">
                    {payload[0].payload.name}: {payload[0].value}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="value" 
            radius={[3, 3, 3, 3]}
            animationBegin={300}
            animationDuration={1500}
            barSize={16}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={color} 
                fillOpacity={0.4 + (index / (data.length - 1)) * 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
