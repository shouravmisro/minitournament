import React from 'react';

const AXES = [
  { key: 'goals',       label: 'Goals',   max: 15 },
  { key: 'assists',     label: 'Assists', max: 12 },
  { key: 'matches',     label: 'Matches', max: 20 },
  { key: 'cleanSheets', label: 'Defense', max: 10 },
  { key: 'avgRating',   label: 'Rating',  max: 10 },
];

function computePolygonPoints(stats = {}, cx, cy, r) {
  return AXES.map((axis, idx) => {
    const angle = (Math.PI * 2 * idx) / AXES.length - Math.PI / 2;
    const raw = Number(stats[axis.key]) || 0;
    const norm = Math.min(1, Math.max(0.12, raw / axis.max));
    const px = cx + Math.cos(angle) * r * norm;
    const py = cy + Math.sin(angle) * r * norm;
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  }).join(' ');
}

export default function PlayerRadarChart({ playerA, playerB = null, size = 230 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.34;
  const rings = [0.25, 0.5, 0.75, 1];

  const ptsA = computePolygonPoints(playerA?.stats, cx, cy, r);
  const ptsB = playerB ? computePolygonPoints(playerB?.stats, cx, cy, r) : null;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Concentric grid rings */}
        {rings.map((ring) => {
          const ringPts = AXES.map((_, idx) => {
            const angle = (Math.PI * 2 * idx) / AXES.length - Math.PI / 2;
            const px = cx + Math.cos(angle) * r * ring;
            const py = cy + Math.sin(angle) * r * ring;
            return `${px.toFixed(1)},${py.toFixed(1)}`;
          }).join(' ');
          return (
            <polygon
              key={ring}
              points={ringPts}
              fill="none"
              stroke="rgba(245, 158, 11, 0.16)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines + labels */}
        {AXES.map((axis, idx) => {
          const angle = (Math.PI * 2 * idx) / AXES.length - Math.PI / 2;
          const x2 = cx + Math.cos(angle) * r;
          const y2 = cy + Math.sin(angle) * r;
          const lx = cx + Math.cos(angle) * (r + 18);
          const ly = cy + Math.sin(angle) * (r + 18);
          return (
            <g key={axis.key}>
              <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="rgba(245, 158, 11, 0.2)" strokeWidth="1" />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(253, 230, 138, 0.8)"
                fontSize="10"
                fontFamily="monospace"
              >
                {axis.label}
              </text>
            </g>
          );
        })}

        {/* Player B comparison polygon */}
        {ptsB && (
          <polygon
            points={ptsB}
            fill="rgba(6, 182, 212, 0.22)"
            stroke="#22d3ee"
            strokeWidth="2"
          />
        )}

        {/* Player A primary polygon */}
        <polygon
          points={ptsA}
          fill="rgba(245, 158, 11, 0.26)"
          stroke="#fbbf24"
          strokeWidth="2"
        />
      </svg>

      {playerB && (
        <div className="flex items-center gap-4 text-[11px] font-mono mt-1">
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            {playerA?.name}
          </span>
          <span className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            {playerB?.name}
          </span>
        </div>
      )}
    </div>
  );
}
