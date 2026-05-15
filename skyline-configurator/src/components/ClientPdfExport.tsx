import { useState, useCallback } from "react";
import { X, FileDown } from "lucide-react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Svg,
  Rect,
  Line,
} from "@react-pdf/renderer";
import type { FullConfig } from "../calculations";
import type { ProjectMeta } from "../store";
import type { ChainData } from "../store";
import { resolve } from "../useOverrides";
import type { Overrides } from "../useOverrides";
import { CONFIG } from "../config";

// ── PDF styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 9, color: "#111827" },
  header: { marginBottom: 20 },
  company: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#1d4ed8", marginBottom: 2 },
  title: { fontSize: 11, color: "#6b7280" },
  metaTable: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, borderTop: "1pt solid #e5e7eb", paddingTop: 8 },
  metaCell: { width: "33%", marginBottom: 6 },
  metaLabel: { fontSize: 7, color: "#9ca3af", textTransform: "uppercase", marginBottom: 1 },
  metaValue: { fontSize: 9, color: "#111827" },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1d4ed8", marginBottom: 6, marginTop: 14, borderBottom: "1pt solid #dbeafe", paddingBottom: 3 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: "55%", color: "#374151" },
  value: { width: "45%", fontFamily: "Helvetica-Bold", color: "#111827" },
  warning: { backgroundColor: "#fef3c7", padding: 6, borderRadius: 3, marginBottom: 8 },
  warnText: { fontSize: 8, color: "#92400e" },
  callout: { backgroundColor: "#eff6ff", padding: 8, borderRadius: 3, marginBottom: 8 },
  calloutText: { fontSize: 8, color: "#1e40af", fontFamily: "Helvetica-Bold" },
  calloutSub: { fontSize: 7.5, color: "#3b82f6", marginTop: 2 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: "#9ca3af", borderTop: "0.5pt solid #e5e7eb", paddingTop: 4 },
  matRow: { flexDirection: "row", paddingVertical: 2, borderBottom: "0.5pt solid #f3f4f6" },
  matLabel: { flex: 3, color: "#374151" },
  matQty: { flex: 1, fontFamily: "Helvetica-Bold", textAlign: "right", color: "#111827" },
  gridContainer: { marginTop: 6 },
});

// ── Field picker config ────────────────────────────────────────────────────────
export interface PdfFields {
  projectInfo: boolean;
  screenSpecs: boolean;
  contentSpec: boolean;
  powerRequirements: boolean;
  materialList: boolean;
  visualRender: boolean;
  chainOverlay: boolean;
}

const DEFAULT_FIELDS: PdfFields = {
  projectInfo: true,
  screenSpecs: true,
  contentSpec: true,
  powerRequirements: false,
  materialList: false,
  visualRender: true,
  chainOverlay: false,
};

// ── SVG grid for PDF (simplified, no interactivity) ──────────────────────────
const CELL = 18;
const CGAP = 1;

function PdfGrid({
  columns,
  rows,
  blankCells,
  chains,
  showChains,
}: {
  columns: number;
  rows: number;
  blankCells: number[];
  chains: ChainData[];
  showChains: boolean;
}) {
  const panelChainInfo = new Map<number, { color: string; seq: number }>();
  if (showChains) {
    for (const chain of chains) {
      chain.panels.forEach((pidx, seq) => {
        panelChainInfo.set(pidx, { color: chain.color, seq: seq + 1 });
      });
    }
  }

  const svgW = columns * (CELL + CGAP) - CGAP + 2;
  const svgH = rows * (CELL + CGAP) - CGAP + 2;

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const idx = r * columns + c;
      const isBlank = blankCells.includes(idx);
      const ci = panelChainInfo.get(idx);
      const x = 1 + c * (CELL + CGAP);
      const y = 1 + r * (CELL + CGAP);
      cells.push(
        <Rect
          key={`r${idx}`}
          x={x} y={y} width={CELL} height={CELL}
          rx={1}
          fill={isBlank ? "#94a3b8" : ci ? ci.color + "44" : "#e2e8f0"}
          stroke={isBlank ? "#64748b" : ci ? ci.color : "#cbd5e1"}
          strokeWidth={0.5}
        />
      );
    }
  }

  const arrows: React.ReactNode[] = [];
  if (showChains) {
    chains.forEach((chain) => {
      for (let i = 0; i < chain.panels.length - 1; i++) {
        const from = chain.panels[i];
        const to = chain.panels[i + 1];
        const fc = from % columns;
        const fr = Math.floor(from / columns);
        const tc = to % columns;
        const tr = Math.floor(to / columns);
        arrows.push(
          <Line
            key={`arr-${chain.id}-${i}`}
            x1={1 + fc * (CELL + CGAP) + CELL / 2}
            y1={1 + fr * (CELL + CGAP) + CELL / 2}
            x2={1 + tc * (CELL + CGAP) + CELL / 2}
            y2={1 + tr * (CELL + CGAP) + CELL / 2}
            stroke={chain.color}
            strokeWidth={1}
            strokeOpacity={0.8}
          />
        );
      }
    });
  }

  return (
    <View style={s.gridContainer}>
      <Svg width={Math.min(svgW, 480)} height={Math.min(svgH * (480 / svgW), svgH)} viewBox={`0 0 ${svgW} ${svgH}`}>
        {cells}
        {arrows}
      </Svg>
    </View>
  );
}

// ── PDF Document ──────────────────────────────────────────────────────────────
function ClientPdfDocument({
  meta,
  calc,
  overrides,
  blankCells,
  chains,
  fields,
  companyName,
}: {
  meta: ProjectMeta;
  calc: FullConfig;
  overrides: Overrides;
  blankCells: number[];
  chains: ChainData[];
  fields: PdfFields;
  companyName: string;
}) {
  const { dimensions, materials, power, processor } = calc;
  const r = <T extends string | number>(key: string, auto: T) => resolve(key, auto, overrides);

  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.company}>{companyName}</Text>
          <Text style={s.title}>LED Wall Configuration — {meta.name || "Untitled Project"}</Text>
        </View>

        {/* Project info */}
        {fields.projectInfo && (
          <>
            <View style={s.metaTable}>
              {[
                ["Project", meta.name],
                ["Job number", meta.jobNumber],
                ["Client", meta.client],
                ["Date", meta.date],
                ["Venue", meta.venue],
                ["Contact", meta.contact],
              ].map(([label, value]) => (
                <View key={label} style={s.metaCell}>
                  <Text style={s.metaLabel}>{label}</Text>
                  <Text style={s.metaValue}>{value || "—"}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Screen specs */}
        {fields.screenSpecs && (
          <>
            <Text style={s.sectionTitle}>Screen Specifications</Text>
            {processor.needsUpgrade && (
              <View style={s.warning}>
                <Text style={s.warnText}>{processor.warning}</Text>
              </View>
            )}
            <View style={s.row}><Text style={s.label}>Width × Height</Text><Text style={s.value}>{Number(r("widthM", dimensions.widthM)).toFixed(1)} m × {Number(r("heightM", dimensions.heightM)).toFixed(1)} m</Text></View>
            <View style={s.row}><Text style={s.label}>Resolution</Text><Text style={s.value}>{r("pixelsW", dimensions.pixelsW)} × {r("pixelsH", dimensions.pixelsH)} px</Text></View>
            <View style={s.row}><Text style={s.label}>Aspect ratio</Text><Text style={s.value}>{r("aspectRatio", dimensions.aspectRatio)}</Text></View>
            <View style={s.row}><Text style={s.label}>Total panels</Text><Text style={s.value}>{r("totalPanels", dimensions.activePanels)}</Text></View>
            <View style={s.row}><Text style={s.label}>Total weight</Text><Text style={s.value}>{Math.round(Number(r("totalWeight", dimensions.activePanels * 10)))} kg</Text></View>
            <View style={s.row}><Text style={s.label}>Pixel pitch</Text><Text style={s.value}>{CONFIG.PIXEL_PITCH}</Text></View>
          </>
        )}

        {/* Content spec */}
        {fields.contentSpec && (
          <>
            <Text style={s.sectionTitle}>Content Specification</Text>
            <View style={s.callout}>
              <Text style={s.calloutText}>{calc.contentSpec}</Text>
              <Text style={s.calloutSub}>Codec: MP4 H.264 · Frame rate: 50 Hz · Start pixel: X:0 Y:0 · Corner: top-left</Text>
            </View>
          </>
        )}

        {/* Power */}
        {fields.powerRequirements && (
          <>
            <Text style={s.sectionTitle}>Power Requirements</Text>
            <View style={s.row}><Text style={s.label}>Total power draw</Text><Text style={s.value}>{Math.round(Number(r("pow_totalWatts", power.totalWatts)))} W</Text></View>
            <View style={s.row}><Text style={s.label}>Current at 240V</Text><Text style={s.value}>{Number(r("pow_amps", power.amps)).toFixed(3)} A</Text></View>
            <View style={s.row}><Text style={s.label}>Shuko 16A circuits required</Text><Text style={s.value}>{r("pow_shukoCircuits", power.circuits)}</Text></View>
            <View style={s.row}><Text style={s.label}>Data lines</Text><Text style={s.value}>{r("pow_dataLines", power.dataLines)}</Text></View>
            <View style={s.row}><Text style={s.label}>UTP data cables</Text><Text style={s.value}>{r("pow_utpData", power.utpDataCables)}</Text></View>
            <View style={s.row}><Text style={s.label}>UTP backup cables</Text><Text style={s.value}>{r("pow_utpBackup", 0)}</Text></View>
          </>
        )}

        {/* Material list */}
        {fields.materialList && (
          <>
            <Text style={s.sectionTitle}>Material List</Text>
            {[
              ["LED Flightcases", r("mat_ledFlightcases", materials.ledFlightcases)],
              ["LED Panels", r("mat_ledPanels", materials.ledPanels)],
              ["Powerlink 1m", r("mat_powerlink1m", materials.powerlink1m)],
              ["Datalink 1m", r("mat_datalink1m", materials.datalink1m)],
              ["Powerstart 10m", r("mat_powerstart10m", materials.powerstart10m)],
              ["Powerstart 1m", r("mat_powerstart1m", materials.powerstart1m)],
              ["Datastart KIT (20/10/5/3)", r("mat_datastartKit", materials.datastartKit)],
              ["E-tape rolls", r("mat_etapeRolls", materials.etapeRolls)],
              ["FIT KIT (Quicfix + T-Bone)", r("mat_fitKit", materials.fitKit)],
              ["Neutrik Couplers", r("mat_neutrikCouplers", materials.neutrikCouplers)],
              ["PROC Flightcase", r("mat_procFlightcase", materials.procFlightcase)],
              ["LED Spares", r("mat_ledSpares", materials.ledSpares)],
              ["Processor", r("mat_processor", materials.processor)],
              ["POWER/HDMI/USB-A/UTP kit", r("mat_powerHdmiUsbUtp", materials.powerHdmiUsbUtp)],
              ["Mediaplayer", r("mat_mediaplayer", materials.mediaplayer)],
              ["POWER/HDMI/USB stick kit", r("mat_powerHdmiUsbStick", materials.powerHdmiUsbStick)],
            ].map(([label, qty]) => (
              <View key={String(label)} style={s.matRow}>
                <Text style={s.matLabel}>{label}</Text>
                <Text style={s.matQty}>{qty}</Text>
              </View>
            ))}
          </>
        )}

        {/* Visual render */}
        {fields.visualRender && (
          <>
            <Text style={s.sectionTitle}>Screen Layout</Text>
            <PdfGrid
              columns={dimensions.pixelsW / CONFIG.PANEL_PIXELS_W}
              rows={dimensions.pixelsH / CONFIG.PANEL_PIXELS_H}
              blankCells={blankCells}
              chains={chains}
              showChains={fields.chainOverlay}
            />
          </>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text>{companyName} — {meta.name || "LED Wall Configuration"}</Text>
          <Text>Generated {today}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// ── Modal component ────────────────────────────────────────────────────────────
interface ModalProps {
  meta: ProjectMeta;
  calc: FullConfig;
  overrides: Overrides;
  blankCells: number[];
  chains: ChainData[];
  companyName: string;
  onClose: () => void;
}

export function ClientPdfModal({
  meta,
  calc,
  overrides,
  blankCells,
  chains,
  companyName,
  onClose,
}: ModalProps) {
  const [fields, setFields] = useState<PdfFields>(DEFAULT_FIELDS);
  const [generating, setGenerating] = useState(false);

  const toggle = (key: keyof PdfFields) =>
    setFields((f) => ({ ...f, [key]: !f[key] }));

  const handleExport = useCallback(async () => {
    setGenerating(true);
    try {
      const doc = (
        <ClientPdfDocument
          meta={meta}
          calc={calc}
          overrides={overrides}
          blankCells={blankCells}
          chains={chains}
          fields={fields}
          companyName={companyName}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meta.jobNumber || "led-wall"}-client.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  }, [meta, calc, overrides, blankCells, chains, fields, companyName]);

  const sections: { key: keyof PdfFields; label: string; defaultOn: boolean; note?: string }[] = [
    { key: "projectInfo", label: "Project info", defaultOn: true },
    { key: "screenSpecs", label: "Screen specifications", defaultOn: true },
    { key: "contentSpec", label: "Content specification", defaultOn: true },
    { key: "powerRequirements", label: "Power requirements", defaultOn: false, note: "Sensitive — off by default" },
    { key: "materialList", label: "Material list", defaultOn: false },
    { key: "visualRender", label: "Screen layout diagram", defaultOn: true },
    { key: "chainOverlay", label: "Include daisy chain overlay", defaultOn: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Export client PDF</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Choose what to include</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-2">
          {sections.map(({ key, label, note }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={fields[key]}
                onChange={() => toggle(key)}
                className="mt-0.5 rounded border-gray-300 text-blue-600"
              />
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                {note && (
                  <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">{note}</span>
                )}
              </div>
            </label>
          ))}
        </div>

        <div className="px-5 pb-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={generating}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <FileDown size={15} />
            {generating ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
