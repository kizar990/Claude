import { useRef } from "react";
import { Printer } from "lucide-react";
import type { FullConfig } from "../calculations";
import type { ProjectMeta } from "../store";
import type { ChainData } from "../store";
import { resolve } from "../useOverrides";
import type { Overrides } from "../useOverrides";

const CELL = 14;
const CGAP = 1;

function MiniGrid({
  columns,
  rows,
  blankCells,
  chains,
}: {
  columns: number;
  rows: number;
  blankCells: number[];
  chains: ChainData[];
}) {
  const panelChainInfo = new Map<number, { color: string; seq: number }>();
  for (const chain of chains) {
    chain.panels.forEach((pidx, seq) => {
      panelChainInfo.set(pidx, { color: chain.color, seq: seq + 1 });
    });
  }

  const svgW = columns * (CELL + CGAP) - CGAP + 2;
  const svgH = rows * (CELL + CGAP) - CGAP + 2;

  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ display: "block" }}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: columns }, (_, c) => {
          const idx = r * columns + c;
          const isBlank = blankCells.includes(idx);
          const ci = panelChainInfo.get(idx);
          const x = 1 + c * (CELL + CGAP);
          const y = 1 + r * (CELL + CGAP);
          return (
            <g key={idx}>
              <rect
                x={x} y={y} width={CELL} height={CELL} rx={1}
                fill={isBlank ? "#94a3b8" : ci ? ci.color + "44" : "#e2e8f0"}
                stroke={isBlank ? "#64748b" : ci ? ci.color : "#cbd5e1"}
                strokeWidth={0.5}
              />
              <text
                x={x + CELL / 2} y={y + CELL / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={6} fontFamily="monospace" fill={ci ? ci.color : "#475569"} fontWeight="600"
              >
                {idx + 1}
              </text>
            </g>
          );
        })
      )}
      {chains.map((chain) =>
        chain.panels.slice(0, -1).map((from, i) => {
          const to = chain.panels[i + 1];
          const fx = 1 + (from % columns) * (CELL + CGAP) + CELL / 2;
          const fy = 1 + Math.floor(from / columns) * (CELL + CGAP) + CELL / 2;
          const tx = 1 + (to % columns) * (CELL + CGAP) + CELL / 2;
          const ty = 1 + Math.floor(to / columns) * (CELL + CGAP) + CELL / 2;
          return (
            <line key={`${chain.id}-${i}`} x1={fx} y1={fy} x2={tx} y2={ty}
              stroke={chain.color} strokeWidth={0.8} strokeOpacity={0.8} />
          );
        })
      )}
    </svg>
  );
}

interface Props {
  meta: ProjectMeta;
  calc: FullConfig;
  overrides: Overrides;
  blankCells: number[];
  chains: ChainData[];
}

export function TechPrintButton({ meta, calc, overrides, blankCells, chains }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    window.print();
  }

  const { dimensions, materials, power, processor } = calc;
  const r = <T extends string | number>(key: string, auto: T): T =>
    resolve(key, auto, overrides) as T;

  const columns = dimensions.columns;
  const rows = dimensions.rows;

  const matItems: [string, number | string][] = [
    ["LED Flightcases", r("mat_ledFlightcases", materials.ledFlightcases)],
    ["LED Panels", r("mat_ledPanels", materials.ledPanels)],
    ["Powerlink 1m", r("mat_powerlink1m", materials.powerlink1m)],
    ["Datalink 1m", r("mat_datalink1m", materials.datalink1m)],
    ["Powerstart 10m", r("mat_powerstart10m", materials.powerstart10m)],
    ["Powerstart 1m", r("mat_powerstart1m", materials.powerstart1m)],
    ["Datastart KIT", r("mat_datastartKit", materials.datastartKit)],
    ["E-tape rolls", r("mat_etapeRolls", materials.etapeRolls)],
    ["FIT KIT", r("mat_fitKit", materials.fitKit)],
    ["Neutrik Couplers", r("mat_neutrikCouplers", materials.neutrikCouplers)],
    ["PROC Flightcase", r("mat_procFlightcase", materials.procFlightcase)],
    ["LED Spares", r("mat_ledSpares", materials.ledSpares)],
    ["Processor", r("mat_processor", materials.processor)],
    ["PWR/HDMI/USB-A/UTP", r("mat_powerHdmiUsbUtp", materials.powerHdmiUsbUtp)],
    ["Mediaplayer", r("mat_mediaplayer", materials.mediaplayer)],
    ["PWR/HDMI/USB stick", r("mat_powerHdmiUsbStick", materials.powerHdmiUsbStick)],
  ];

  const half = Math.ceil(matItems.length / 2);
  const col1 = matItems.slice(0, half);
  const col2 = matItems.slice(half);

  return (
    <>
      {/* Print trigger button */}
      <button
        onClick={handlePrint}
        className="no-print flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <Printer size={13} /> Print tech sheet
      </button>

      {/* Hidden A4 printout — shown only @media print */}
      <div ref={printRef} className="print-only" style={{ display: "none" }}>
        <style>{`
          @media print {
            @page { size: A4 portrait; margin: 12mm; }
            body > * { display: none !important; }
            .print-only { display: block !important; }
            .print-sheet { font-family: Arial, sans-serif; font-size: 8pt; color: #000; }
            .print-sheet * { box-sizing: border-box; }
          }
        `}</style>

        <div className="print-sheet" style={{ maxWidth: "186mm" }}>
          {/* ── Top strip ── */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "6px", borderBottom: "1.5pt solid #000", paddingBottom: "4px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold", fontSize: "12pt" }}>
                {meta.name || "LED Wall Job"}
              </div>
              <div style={{ fontSize: "7pt", color: "#555" }}>{meta.client} — {meta.venue}</div>
            </div>
            <div style={{ textAlign: "right", fontSize: "7pt" }}>
              <div><strong>Job:</strong> {meta.jobNumber}</div>
              <div><strong>Date:</strong> {meta.date}</div>
              <div><strong>Contact:</strong> {meta.contact}</div>
            </div>
          </div>

          {/* ── Screen specs 4-column block ── */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
            {[
              ["Panels", `${dimensions.activePanels} (${columns}×${rows})`],
              ["Size", `${Number(r("widthM", dimensions.widthM)).toFixed(3)}m × ${Number(r("heightM", dimensions.heightM)).toFixed(3)}m`],
              ["Resolution", `${r("pixelsW", dimensions.pixelsW)}×${r("pixelsH", dimensions.pixelsH)}`],
              ["Weight", `${Math.round(Number(r("totalWeight", dimensions.activePanels * 10)))} kg`],
            ].map(([label, val]) => (
              <div key={String(label)} style={{ flex: 1, border: "0.5pt solid #999", borderRadius: "2px", padding: "3px 4px" }}>
                <div style={{ fontSize: "6pt", color: "#666", textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontWeight: "bold", fontSize: "8pt" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* ── Power block (prominent) ── */}
          <div style={{ border: "1pt solid #000", borderRadius: "2px", padding: "4px 6px", marginBottom: "6px", background: "#f5f5f5" }}>
            <div style={{ fontWeight: "bold", fontSize: "8pt", marginBottom: "2px" }}>⚡ POWER</div>
            <div style={{ display: "flex", gap: "16px" }}>
              <div><strong>{Math.round(Number(r("pow_totalWatts", power.totalWatts)))} W</strong> total</div>
              <div><strong>{Number(r("pow_amps", power.amps)).toFixed(2)} A</strong> at 240V</div>
              <div><strong>{r("pow_shukoCircuits", power.circuits)}×</strong> 13A circuits</div>
              <div><strong>{r("pow_dataLines", power.dataLines)}</strong> data lines</div>
              <div><strong>{r("pow_utpData", power.utpDataCables)}</strong> data links (UTP)</div>
            </div>
            {processor.needsUpgrade && (
              <div style={{ marginTop: "2px", color: "#c00", fontSize: "7pt", fontWeight: "bold" }}>
                ⚠ {processor.warning}
              </div>
            )}
          </div>

          {/* ── Material list + diagram ── */}
          <div style={{ display: "flex", gap: "8px" }}>
            {/* Material list — two columns */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "bold", fontSize: "8pt", marginBottom: "2px", borderBottom: "0.5pt solid #999" }}>MATERIAL LIST</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <table style={{ flex: 1, borderCollapse: "collapse", fontSize: "7pt" }}>
                  <tbody>
                    {col1.map(([label, qty]) => (
                      <tr key={String(label)} style={{ borderBottom: "0.3pt solid #ddd" }}>
                        <td style={{ padding: "1.5px 0", color: "#333" }}>{label}</td>
                        <td style={{ padding: "1.5px 0", fontWeight: "bold", textAlign: "right", paddingLeft: "8px" }}>{qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table style={{ flex: 1, borderCollapse: "collapse", fontSize: "7pt" }}>
                  <tbody>
                    {col2.map(([label, qty]) => (
                      <tr key={String(label)} style={{ borderBottom: "0.3pt solid #ddd" }}>
                        <td style={{ padding: "1.5px 0", color: "#333" }}>{label}</td>
                        <td style={{ padding: "1.5px 0", fontWeight: "bold", textAlign: "right", paddingLeft: "8px" }}>{qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mini diagram + cable summary */}
            <div style={{ width: "auto", minWidth: "80px" }}>
              <div style={{ fontWeight: "bold", fontSize: "8pt", marginBottom: "2px", borderBottom: "0.5pt solid #999" }}>LAYOUT</div>
              <MiniGrid columns={columns} rows={rows} blankCells={blankCells} chains={chains} />
              {chains.length > 0 && (
                <div style={{ marginTop: "4px" }}>
                  <div style={{ fontWeight: "bold", fontSize: "7pt", marginBottom: "1px" }}>CABLE RUNS</div>
                  {chains.map((c, i) => (
                    <div key={c.id} style={{ fontSize: "6.5pt", display: "flex", gap: "4px", alignItems: "center" }}>
                      <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: c.color }} />
                      <span>Ch{i + 1}: {c.panels.length} panels</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Content spec ── */}
          <div style={{ marginTop: "6px", padding: "3px 6px", background: "#e8f0fe", borderRadius: "2px", fontSize: "7pt" }}>
            <strong>CONTENT:</strong> {calc.contentSpec}
          </div>
        </div>
      </div>
    </>
  );
}
