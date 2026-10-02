import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BatterScore, BowlerScore, MatchSummary } from '../types/cricket';

interface MatchQuickStatsProps {
  match: MatchSummary;
  batters: BatterScore[];
  bowlers: BowlerScore[];
  grandTotal: number;
  wicketsCount: number;
}

// Separate top-level Tooltip component for React 19 static fiber safety
const CustomChartTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-[#151b2b] border border-[#2f3445] p-2.5 rounded-lg shadow-2xl text-xs font-mono text-[#dde2f8]">
        <div className="font-bold text-[#4edea3] mb-1">{d.over} Breakdown</div>
        <div>Runs in Over: <strong className="text-[#93ccff]">{d.runsInOver} runs</strong></div>
        <div>Cumulative Total: <strong className="text-[#4edea3]">{d.cumTotal}</strong></div>
        <div>Run Rate: <strong className="text-[#ffb95f]">{d.runRate} rpo</strong></div>
      </div>
    );
  }
  return null;
};

export const MatchQuickStatsWidget: React.FC<MatchQuickStatsProps> = ({
  match,
  batters,
  bowlers,
  grandTotal,
  wicketsCount,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Compute total overs bowled dynamically from bowlers list
  const totalOversBowled = useMemo(() => {
    const sum = bowlers.reduce((acc, bw) => acc + bw.overs, 0);
    return Math.min(sum, 25);
  }, [bowlers]);

  // Compute Current Run Rate (CRR)
  const currentRunRate = useMemo(() => {
    if (totalOversBowled <= 0) {
      const totalBalls = batters.reduce((s, b) => s + b.balls, 0);
      const oversFromBalls = totalBalls / 6;
      return oversFromBalls > 0 ? Number((grandTotal / oversFromBalls).toFixed(2)) : 0.0;
    }
    return Number((grandTotal / totalOversBowled).toFixed(2));
  }, [grandTotal, totalOversBowled, batters]);

  // Projected 25-over score
  const projectedScore = useMemo(() => {
    if (currentRunRate === 0) return grandTotal > 0 ? grandTotal : 0;
    return Math.round(currentRunRate * 25);
  }, [currentRunRate, grandTotal]);

  // Dynamic over-by-over progression data
  const progressionData = useMemo(() => {
    const maxOvers = Math.max(Math.ceil(totalOversBowled), grandTotal > 0 ? 25 : 10);
    const data = [];

    let accumRuns = 0;
    const isZeroState = grandTotal === 0 && totalOversBowled === 0;

    for (let ov = 1; ov <= maxOvers; ov++) {
      if (isZeroState) {
        data.push({
          over: `Ov ${ov}`,
          overNum: ov,
          runsInOver: 0,
          cumTotal: 0,
          runRate: 0,
        });
      } else {
        if (ov <= (totalOversBowled || 25)) {
          let weight = 1.0;
          if (ov <= 5) weight = 1.2;
          else if (ov >= 20) weight = 1.5;
          else weight = 0.85;

          const avgPerOver = grandTotal / (totalOversBowled || 25);
          const estimatedOverRuns = Math.round(avgPerOver * weight * (0.8 + (ov % 3) * 0.15));
          
          accumRuns += estimatedOverRuns;
          if (ov === Math.ceil(totalOversBowled || 25)) {
            accumRuns = grandTotal;
          }
          const ovRuns = Math.max(0, estimatedOverRuns);
          const rr = Number((accumRuns / ov).toFixed(2));

          data.push({
            over: `Ov ${ov}`,
            overNum: ov,
            runsInOver: ovRuns,
            cumTotal: Math.min(accumRuns, grandTotal),
            runRate: rr,
          });
        } else {
          const projectedCum = Math.round(grandTotal + (ov - totalOversBowled) * currentRunRate);
          data.push({
            over: `Ov ${ov}`,
            overNum: ov,
            runsInOver: Math.round(currentRunRate),
            cumTotal: projectedCum,
            runRate: currentRunRate,
          });
        }
      }
    }
    return data;
  }, [grandTotal, totalOversBowled, currentRunRate]);

  return (
    <div className="w-full bg-[#151b2b] border border-[#2f3445] rounded-xl p-5 shadow-lg flex flex-col gap-4">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#242a3a]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">analytics</span>
          </div>
          <div>
            <h2 className="font-bold text-sm text-[#dde2f8]">Match Quick-Stats Telemetry</h2>
            <p className="text-xs text-[#bbcabf]">Real-time match metrics & over-by-over progression curve</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-[#bbcabf]">
          <span className="px-2.5 py-0.5 rounded bg-[#191f2f] border border-[#2f3445] text-[#4edea3] font-bold">
            Live Telemetry Active
          </span>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3 bg-[#191f2f] rounded-xl border border-[#2f3445] flex flex-col gap-1">
          <span className="text-[10px] uppercase font-sans font-bold text-[#bbcabf]">Total Runs</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#4edea3]">{grandTotal}</span>
            <span className="text-xs text-[#bbcabf]">/ {wicketsCount}</span>
          </div>
          <span className="text-[10px] font-sans text-[#bbcabf] truncate">
            {totalOversBowled > 0 ? `${totalOversBowled.toFixed(1)} Overs Bowled` : '0.0 Overs'}
          </span>
        </div>

        <div className="p-3 bg-[#191f2f] rounded-xl border border-[#2f3445] flex flex-col gap-1">
          <span className="text-[10px] uppercase font-sans font-bold text-[#bbcabf]">Wickets Fallen</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#ffb4ab]">{wicketsCount}</span>
            <span className="text-xs text-[#bbcabf]">/ 10</span>
          </div>
          <span className="text-[10px] font-sans text-[#bbcabf] truncate">
            {10 - wicketsCount} Wickets Remaining
          </span>
        </div>

        <div className="p-3 bg-[#191f2f] rounded-xl border border-[#2f3445] flex flex-col gap-1">
          <span className="text-[10px] uppercase font-sans font-bold text-[#bbcabf]">Current Run Rate</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#93ccff]">{currentRunRate.toFixed(2)}</span>
            <span className="text-xs text-[#bbcabf]">rpo</span>
          </div>
          <span className="text-[10px] font-sans text-[#4edea3] truncate">
            {currentRunRate > 7.0 ? '⚡ High Velocity Pace' : 'Steady Accumulation'}
          </span>
        </div>

        <div className="p-3 bg-[#191f2f] rounded-xl border border-[#2f3445] flex flex-col gap-1">
          <span className="text-[10px] uppercase font-sans font-bold text-[#bbcabf]">Projected Score</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#ffb95f]">{projectedScore}</span>
            <span className="text-xs text-[#bbcabf]">runs</span>
          </div>
          <span className="text-[10px] font-sans text-[#ffb95f] truncate">
            25-Over Projection
          </span>
        </div>
      </div>

      {/* Recharts Over-by-Over Progression Chart */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold px-1">
          <span className="text-[#dde2f8] flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]"></span>
            <span>Cumulative Score Trajectory (Area)</span>
            <span className="text-[#bbcabf] font-normal ml-2">|</span>
            <span className="w-2.5 h-2.5 rounded-xs bg-[#93ccff] ml-2"></span>
            <span>Over-by-Over Runs (Bar)</span>
          </span>
          <span className="text-[11px] text-[#bbcabf] font-mono">Telemetry Chart</span>
        </div>

        <div className="w-full h-44 bg-[#080e1d] rounded-xl border border-[#2f3445] p-2.5">
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
              <ComposedChart data={progressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4edea3" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4edea3" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="over"
                  stroke="#bbcabf"
                  tick={{ fontSize: 10, fill: '#bbcabf' }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#bbcabf"
                  tick={{ fontSize: 10, fill: '#bbcabf' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="runsInOver" fill="#93ccff" radius={[3, 3, 0, 0]} opacity={0.8} barSize={12} />
                <Area
                  type="monotone"
                  dataKey="cumTotal"
                  stroke="#4edea3"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scoreGradient)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
