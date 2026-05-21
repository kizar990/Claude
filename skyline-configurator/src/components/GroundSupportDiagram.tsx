import { useState } from "react";
import type { Profile } from "../profiles";

interface Props {
  columns: number;
  rows: number;
  panelWidthMm: number;
  panelHeightMm: number;
  panelWeightKg: number;
  profile: Profile;
  blankCells?: number[];
}

export function GroundSupportDiagram({
  columns,
  rows,
  panelWidthMm,
  panelHeightMm,
  panelWeightKg,
  profile,
  blankCells = [],
}: Props) {
  const defaultSpacing = columns <= 4 ? 1 : columns <= 10 ? 2 : columns <= 20 ? 3 : 4;
  const [trussEvery, setTrussEvery] = useState(defaultSpacing);

  if (columns < 1 || rows < 1) return null;

  const T = profile.terminology;
  const accent = profile.accentColor;

  // ── Truss positions (panel-column boundaries: 0 … columns) ────────────────
  const positions: number[] = [0];
  for (let c = trussEvery; c < columns; c += trussEvery) positions.push(c);
  if (positions[positions.length - 1] !== columns) positions.push(columns);

  const numRearTrusses = positions.length;
  const numBaseTrusses = numRearTrusses;

  const activePanels = columns * rows - blankCells.length;
  const totalWeightKg = Math.round(activePanels * panelWeightKg);

  // ── Pickup load via tributary-area method ─────────────────────────────────
  function pickupLoad(i: number): number {
    const leftSpan = i === 0 ? 0 : positions[i] - positions[i - 1];
    const rightSpan = i === positions.length - 1 ? 0 : positions[i + 1] - positions[i];
    const tributaryPanels = ((leftSpan + rightSpan) / 2) * rows;
    return Math.ceil(tributaryPanels * panelWeightKg);
  }

  const maxLoad = Math.max(...positions.map((_, i) => pickupLoad(i)));

  // ── Bridge clamps: one at each truss × each row junction + top ────────────
  const bridgeClamps = numRearTrusses * (rows + 1);
  // Sandbags: 2 per base truss for counterweight
  const sandbags = numBaseTrusses * 2;

  // ── SVG layout ─────────────────────────────────────────────────────────────
  const CELL = Math.min(30, Math.max(10, Math.floor(340 / columns)));
  const GAP = 1;
  const gridW = columns * CELL + Math.max(0, columns - 1) * GAP;
  const gridH = rows * CELL + Math.max(0, rows - 1) * GAP;

  const TW = 5;         // truss bar width
  const PAD_L = 8;
  const PAD_R = 60;     // room for right-side labels
  const PAD_T = 18;     // room for "FRONT VIEW" + dim callout
  const BASE_GAP = 5;   // gap between wall bottom and base beam
  const BASE_H = 8;     // base beam height
  const FOOT_H = 18;    // foot stub height
  const FOOT_PLATE = 3;
  const PAD_B = 24;

  const svgW = PAD_L + gridW + PAD_R;
  const svgH = PAD_T + gridH + BASE_GAP + BASE_H + FOOT_H + FOOT_PLATE + PAD_B;

  const wallTop = PAD_T;
  const wallBottom = PAD_T + gridH;
  const beamTop = wallBottom + BASE_GAP;
  const beamBottom = beamTop + BASE_H;
  const footBottom = beamBottom + FOOT_H;

  function trussX(col: number) {
    if (col === 0) return PAD_L + TW / 2;
    if (col === columns) return PAD_L + gridW - TW / 2;
    return PAD_L + col * (CELL + GAP) - GAP / 2;
  }

  return (
    <div className="space-y-4">
      {/* Spacing controls */}
      <div className="flex items-center gap-3 flex-wrap text-xs">
        <span className="text-gray-500 dark:text-gray-400 font-medium">Truss every</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6].filter((n) => n <= columns).map((n) => (
            <button
              key={n}
              onClick={() => setTrussEvery(n)}
              className={`px-2.5 py-1 rounded border font-medium transition-colors ${
                trussEvery === n
                  ? "text-white border-transparent"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              style={trussEvery === n ? { backgroundColor: accent } : undefined}
            >
              {n}
            </button>
          ))}
          <span className="self-center text-gray-400 pl-1">panel column{trussEvery > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Hardware counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Rear trusses",    value: numRearTrusses, sub: "vertical uprights" },
          { label: "Base trusses",    value: numBaseTrusses, sub: "one per upright" },
          { label: "Bridge clamps",   value: bridgeClamps,   sub: `${numRearTrusses} trusses × ${rows + 1}` },
          { label: "Sandbags",        value: sandbags,       sub: "2 per base truss" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-2.5 border border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Weight summary */}
      <div
        className="flex items-center gap-6 px-4 py-3 rounded-lg border text-sm flex-wrap"
        style={{ borderColor: accent + "66", backgroundColor: accent + "11" }}
      >
        <span style={{ color: accent }} className="font-semibold">Panel weight: {totalWeightKg} kg</span>
        <span className="text-gray-500 dark:text-gray-400">
          Max per {T.panelSupport.toLowerCase()}: <span className="font-semibold text-gray-700 dark:text-gray-300">{maxLoad} kg</span>
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          Avg: <span className="font-semibold text-gray-700 dark:text-gray-300">{Math.ceil(totalWeightKg / numRearTrusses)} kg</span>
        </span>
        <span className="text-xs text-gray-400">Panel weight only — excludes structure &amp; cabling</span>
      </div>

      {/* Front-view diagram */}
      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-2">
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ display: "block", maxWidth: "100%" }}
        >
          {/* "FRONT VIEW" label */}
          <text x={PAD_L} y={10} fontSize={6} fill="#94A3B8" fontFamily="Helvetica, sans-serif" letterSpacing={1}>
            FRONT ELEVATION
          </text>

          {/* Width callout */}
          <line x1={PAD_L} y1={wallTop - 4} x2={PAD_L + gridW} y2={wallTop - 4} stroke="#E2E8F0" strokeWidth={0.8} />
          <text x={PAD_L + gridW / 2} y={wallTop - 6} textAnchor="middle" fontSize={6.5} fill="#94A3B8" fontFamily="Helvetica, sans-serif">
            {(columns * panelWidthMm / 1000).toFixed(2)} m
          </text>

          {/* Height callout (right side) */}
          <line
            x1={PAD_L + gridW + 6} y1={wallTop}
            x2={PAD_L + gridW + 6} y2={wallBottom}
            stroke="#E2E8F0" strokeWidth={0.8}
          />
          <text
            x={PAD_L + gridW + 10} y={wallTop + gridH / 2}
            fontSize={6.5} fill="#94A3B8" fontFamily="Helvetica, sans-serif"
            dominantBaseline="middle"
          >
            {(rows * panelHeightMm / 1000).toFixed(2)} m
          </text>

          {/* Panel grid */}
          {Array.from({ length: rows }, (_, r) =>
            Array.from({ length: columns }, (_, c) => {
              const idx = r * columns + c;
              const isBlank = blankCells.includes(idx);
              return (
                <rect
                  key={idx}
                  x={PAD_L + c * (CELL + GAP)}
                  y={wallTop + r * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  fill={isBlank ? "#94A3B8" : "#DBEAFE"}
                  stroke={isBlank ? "#64748B" : "#93C5FD"}
                  strokeWidth={0.5}
                />
              );
            })
          )}

          {/* Rear truss bars (vertical, through wall + beam) */}
          {positions.map((col, i) => {
            const x = trussX(col);
            return (
              <rect
                key={`rt-${i}`}
                x={x - TW / 2}
                y={wallTop}
                width={TW}
                height={gridH + BASE_GAP + BASE_H}
                fill={accent}
                rx={1.5}
                opacity={0.9}
              />
            );
          })}

          {/* Base beam (horizontal) */}
          <rect
            x={PAD_L}
            y={beamTop}
            width={gridW}
            height={BASE_H}
            fill={accent}
            fillOpacity={0.35}
            stroke={accent}
            strokeWidth={1}
            rx={2}
          />

          {/* Base truss stubs + foot plates */}
          {positions.map((col, i) => {
            const x = trussX(col);
            return (
              <g key={`bt-${i}`}>
                {/* Stub */}
                <rect x={x - TW / 2} y={beamBottom} width={TW} height={FOOT_H} fill={accent} rx={1} opacity={0.9} />
                {/* Foot plate */}
                <rect x={x - 9} y={footBottom} width={18} height={FOOT_PLATE} fill={accent} rx={1} opacity={0.85} />
              </g>
            );
          })}

          {/* Pickup labels below foot plates */}
          {positions.map((col, i) => {
            const x = trussX(col);
            const load = pickupLoad(i);
            return (
              <text
                key={`lbl-${i}`}
                x={x}
                y={footBottom + FOOT_PLATE + 10}
                textAnchor="middle"
                fontSize={Math.min(7, CELL - 2)}
                fill="#64748B"
                fontFamily="Helvetica, sans-serif"
              >
                {load}kg
              </text>
            );
          })}

          {/* Legend */}
          <g transform={`translate(${PAD_L}, ${svgH - 14})`}>
            <rect x={0} y={0} width={6} height={10} fill={accent} rx={1} />
            <text x={9} y={8} fontSize={6.5} fill="#64748B" fontFamily="Helvetica, sans-serif">
              Rear / base truss ({numRearTrusses}×)
            </text>
            <rect x={80} y={2} width={20} height={6} fill={accent} fillOpacity={0.4} stroke={accent} strokeWidth={0.8} rx={1} />
            <text x={105} y={8} fontSize={6.5} fill="#64748B" fontFamily="Helvetica, sans-serif">
              Base beam
            </text>
          </g>
        </svg>
      </div>

      {/* Pickup weights table */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
          {T.panelSupport} weights
        </h4>
        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">{T.panelSupport}</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Pos. from L</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Spans</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Est. load</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {positions.map((col, i) => {
                const load = pickupLoad(i);
                const leftSpan = i === 0 ? 0 : col - positions[i - 1];
                const rightSpan = i === positions.length - 1 ? 0 : positions[i + 1] - col;
                return (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-1.5 font-medium text-gray-800 dark:text-gray-200">
                      <span
                        className="inline-block w-2 h-2 rounded-sm mr-1.5 align-middle"
                        style={{ backgroundColor: accent }}
                      />
                      {T.panelSupport} #{i + 1}
                    </td>
                    <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 font-mono">
                      {(col * panelWidthMm / 1000).toFixed(3)} m
                    </td>
                    <td className="px-3 py-1.5 text-gray-500 dark:text-gray-400">
                      {leftSpan > 0 && rightSpan > 0
                        ? `← ${leftSpan} + ${rightSpan} →`
                        : leftSpan > 0
                        ? `← ${leftSpan} (end)`
                        : `${rightSpan} → (end)`}
                    </td>
                    <td className="px-3 py-1.5 text-right font-semibold text-gray-900 dark:text-gray-100 font-mono">
                      ~{load} kg
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-700">
                <td colSpan={3} className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300">
                  Total ({activePanels} panels × {panelWeightKg} kg)
                </td>
                <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-gray-100 font-mono">
                  {totalWeightKg} kg
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
          Loads use the tributary-area method. Excludes structure, cabling &amp; dynamic loads — always verify with a qualified rigger.
        </p>
      </div>
    </div>
  );
}
