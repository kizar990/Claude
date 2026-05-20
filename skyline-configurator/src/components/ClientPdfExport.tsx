import React, { useState, useCallback } from "react";
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
  G,
} from "@react-pdf/renderer";
import type { FullConfig } from "../calculations";
import type { ProjectMeta, ChainData } from "../store";
import { resolve } from "../useOverrides";
import type { Overrides } from "../useOverrides";
import { C, MARGIN_H, FOOTER_H, BrandHeader, BrandFooter } from "./PdfBranding";

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.dark,
    paddingBottom: FOOTER_H + 12,
  },
  body: {
    paddingHorizontal: MARGIN_H,
    paddingTop: 22,
  },

  // Project metadata
  metaSection: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 0.75,
    borderBottomColor: C.rule,
  },
  metaCol: { flex: 1 },
  metaItem: { marginBottom: 6 },
  metaLabel: {
    fontSize: 6.5,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 1.5,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
  },

  // Section headings — navy text, orange rule (SW logo accent)
  sectionHead: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 1.5,
    borderBottomColor: C.orange,
  },

  // Data table
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4.5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.rule,
  },
  tableRowAlt: { backgroundColor: C.pale },
  tableLabel: { flex: 1, fontSize: 8.5, color: C.mid },
  tableValue: { flex: 1, fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.dark, textAlign: "right" },

  // Content spec callout — coral accent (WS logo)
  callout: {
    backgroundColor: C.paleBlu,
    borderLeftWidth: 3,
    borderLeftColor: C.coral,
    padding: 10,
    marginBottom: 4,
  },
  calloutEyebrow: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.coral,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  calloutMain: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 4 },
  calloutSub: { fontSize: 7.5, color: C.mid, lineHeight: 1.5 },

  // Power / material rows
  powerRow: { flexDirection: "row", paddingVertical: 3.5, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: C.rule },
  powerLabel: { flex: 1, fontSize: 8.5, color: C.mid },
  powerValue: { flex: 1, fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.dark, textAlign: "right" },
  matRow: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: C.rule },
  matLabel: { flex: 3, fontSize: 8, color: C.mid },
  matQty: { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", color: C.dark, textAlign: "right" },

  // Layout page (page 2)
  layoutBody: {
    paddingHorizontal: MARGIN_H,
    paddingTop: 28,
    flex: 1,
  },
  dimLabel: { fontSize: 9, color: C.orange, fontFamily: "Helvetica-Bold" },
  dimRow: { flexDirection: "row", alignItems: "center" },
  gridCaption: { fontSize: 7.5, color: C.muted, marginTop: 8 },
});

// ── Panel grid SVG (cells + dimension lines) ──────────────────────────────────
function PanelGridSvg({
  columns, rows, blankCells, chains, showChains, large = false,
}: {
  columns: number; rows: number; blankCells: number[];
  chains: ChainData[]; showChains: boolean; large?: boolean;
}) {
  const AVAIL_W = large ? 490 : 460;
  const AVAIL_H = large ? 380 : 220;
  const MAX_CELL = large ? 52 : 38;

  const cellSize = Math.min(Math.floor(AVAIL_W / columns), Math.floor(AVAIL_H / rows), MAX_CELL);
  const gridW = columns * cellSize;
  const gridH = rows * cellSize;
  const DIM_ABOVE = 18;
  const DIM_GAP = 10;

  const panelChain = new Map<number, { color: string }>();
  if (showChains) {
    for (const chain of chains) {
      chain.panels.forEach((pidx) => panelChain.set(pidx, { color: chain.color }));
    }
  }

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const idx = r * columns + c;
      const isBlank = blankCells.includes(idx);
      const ci = panelChain.get(idx);
      cells.push(
        <G key={idx}>
          <Rect
            x={c * cellSize} y={DIM_ABOVE + r * cellSize}
            width={cellSize} height={cellSize}
            fill={isBlank ? "#94a3b8" : ci ? ci.color + "33" : "#EDF2F7"}
            stroke={isBlank ? "#64748b" : ci ? ci.color : "#A0AEC0"}
            strokeWidth={0.5}
          />
        </G>
      );
    }
  }

  const chainLines: React.ReactNode[] = [];
  if (showChains) {
    chains.forEach((chain) => {
      chain.panels.slice(0, -1).forEach((from, i) => {
        const to = chain.panels[i + 1];
        chainLines.push(
          <Line key={`${chain.id}-${i}`}
            x1={(from % columns) * cellSize + cellSize / 2}
            y1={DIM_ABOVE + Math.floor(from / columns) * cellSize + cellSize / 2}
            x2={(to % columns) * cellSize + cellSize / 2}
            y2={DIM_ABOVE + Math.floor(to / columns) * cellSize + cellSize / 2}
            stroke={chain.color} strokeWidth={1} strokeOpacity={0.8}
          />
        );
      });
    });
  }

  const hY = 9;
  const vX = gridW + DIM_GAP;

  return (
    <Svg width={gridW + DIM_GAP + 4} height={gridH + DIM_ABOVE}
      viewBox={`0 0 ${gridW + DIM_GAP + 4} ${gridH + DIM_ABOVE}`}>
      {cells}
      {chainLines}
      {/* Width dimension line */}
      <Line x1={0} y1={hY} x2={gridW} y2={hY} stroke={C.orange} strokeWidth={0.9} />
      <Line x1={0} y1={hY - 5} x2={0} y2={hY + 5} stroke={C.orange} strokeWidth={0.9} />
      <Line x1={gridW} y1={hY - 5} x2={gridW} y2={hY + 5} stroke={C.orange} strokeWidth={0.9} />
      {/* Height dimension line */}
      <Line x1={vX} y1={DIM_ABOVE} x2={vX} y2={DIM_ABOVE + gridH} stroke={C.orange} strokeWidth={0.9} />
      <Line x1={vX - 5} y1={DIM_ABOVE} x2={vX + 5} y2={DIM_ABOVE} stroke={C.orange} strokeWidth={0.9} />
      <Line x1={vX - 5} y1={DIM_ABOVE + gridH} x2={vX + 5} y2={DIM_ABOVE + gridH} stroke={C.orange} strokeWidth={0.9} />
    </Svg>
  );
}

function PanelGridWithLabels({
  columns, rows, blankCells, chains, showChains, widthM, heightM, large = false,
}: {
  columns: number; rows: number; blankCells: number[]; chains: ChainData[];
  showChains: boolean; widthM: number; heightM: number; large?: boolean;
}) {
  const AVAIL_W = large ? 490 : 460;
  const AVAIL_H = large ? 380 : 220;
  const MAX_CELL = large ? 52 : 38;
  const cellSize = Math.min(Math.floor(AVAIL_W / columns), Math.floor(AVAIL_H / rows), MAX_CELL);
  const gridW = columns * cellSize;

  return (
    <View style={s.dimRow}>
      <View>
        {/* Width label above */}
        <View style={{ width: gridW, alignItems: "center", marginBottom: 3 }}>
          <Text style={s.dimLabel}>← {widthM.toFixed(3)} m →</Text>
        </View>
        <PanelGridSvg
          columns={columns} rows={rows} blankCells={blankCells}
          chains={chains} showChains={showChains} large={large}
        />
      </View>
      {/* Height label to the right */}
      <Text style={[s.dimLabel, { marginLeft: 8 }]}>{heightM.toFixed(3)} m</Text>
    </View>
  );
}

// ── Field picker config ───────────────────────────────────────────────────────
export interface PdfFields {
  projectInfo:       boolean;
  screenSpecs:       boolean;
  contentSpec:       boolean;
  powerRequirements: boolean;
  materialList:      boolean;
  visualRender:      boolean;
  chainOverlay:      boolean;
}

const DEFAULT_FIELDS: PdfFields = {
  projectInfo:       true,
  screenSpecs:       true,
  contentSpec:       true,
  powerRequirements: false,
  materialList:      false,
  visualRender:      true,
  chainOverlay:      false,
};

// ── PDF Document ──────────────────────────────────────────────────────────────
export function ClientPdfDocument({
  meta, calc, overrides, blankCells, chains, fields,
}: {
  meta: ProjectMeta; calc: FullConfig; overrides: Overrides;
  blankCells: number[]; chains: ChainData[]; fields: PdfFields;
}) {
  const { dimensions, materials, power, processor } = calc;
  const r = <T extends string | number>(key: string, auto: T) =>
    resolve(key, auto, overrides) as T;

  const columns = dimensions.columns;
  const rows    = dimensions.rows;
  const today   = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const specRows: [string, string][] = [
    ["Width",         `${Number(r("widthM",  dimensions.widthM)).toFixed(3)} m`],
    ["Height",        `${Number(r("heightM", dimensions.heightM)).toFixed(3)} m`],
    ["Aspect ratio",  String(r("aspectRatio", dimensions.aspectRatio))],
    ["Resolution",    `${r("pixelsW", dimensions.pixelsW)} × ${r("pixelsH", dimensions.pixelsH)} px`],
    ["Total panels",  String(r("totalPanels", dimensions.activePanels))],
    ["Total weight",  `${Math.round(Number(r("totalWeight", dimensions.activePanels * 10)))} kg`],
    ["Pixel pitch",   dimensions.pixelPitch],
    ["Processor",     processor.modelName],
  ];

  const footerRows = [
    { label: "Client",       value: meta.client },
    { label: "Project Name", value: meta.name },
    { label: "Job Number",   value: meta.jobNumber },
    { label: "Document",     value: "LED Wall Configuration" },
    { label: "Generated By", value: "Skyline Whitespace" },
    { label: "Date",         value: meta.date || today },
    { label: "Version",      value: "1.0" },
  ];

  return (
    <Document
      title={`LED Wall Configuration — ${meta.name || "Untitled"}`}
      author="Skyline Whitespace"
      creator="Skyline LED Wall Configurator"
    >
      {/* ── PAGE 1: Text content ── */}
      <Page size="A4" style={s.page}>
        <BrandHeader docType="LED Wall" docTitle={meta.name || "LED Wall Configuration"} />

        <View style={s.body}>
          {/* Project metadata */}
          {fields.projectInfo && (
            <View style={s.metaSection}>
              <View style={s.metaCol}>
                {([ ["Client", meta.client], ["Venue", meta.venue], ["Contact", meta.contact] ] as [string,string][])
                  .map(([label, value]) => (
                    <View key={label} style={s.metaItem}>
                      <Text style={s.metaLabel}>{label}</Text>
                      <Text style={s.metaValue}>{value || "—"}</Text>
                    </View>
                  ))}
              </View>
              <View style={s.metaCol}>
                {([ ["Project Name", meta.name], ["Job Number", meta.jobNumber], ["Date", meta.date] ] as [string,string][])
                  .map(([label, value]) => (
                    <View key={label} style={s.metaItem}>
                      <Text style={s.metaLabel}>{label}</Text>
                      <Text style={s.metaValue}>{value || "—"}</Text>
                    </View>
                  ))}
              </View>
            </View>
          )}

          {/* Screen Specifications */}
          {fields.screenSpecs && (
            <>
              <Text style={s.sectionHead}>Screen Specifications</Text>
              {processor.needsUpgrade && (
                <View style={{ backgroundColor: "#FFF5F5", borderLeftWidth: 3, borderLeftColor: C.orange, padding: 8, marginBottom: 8 }}>
                  <Text style={{ fontSize: 8, color: C.orange }}>{processor.warning}</Text>
                </View>
              )}
              <View>
                {specRows.map(([label, value], i) => (
                  <View key={label} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                    <Text style={s.tableLabel}>{label}</Text>
                    <Text style={s.tableValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Content Specification */}
          {fields.contentSpec && (
            <>
              <Text style={s.sectionHead}>Content Specification</Text>
              <View style={s.callout}>
                <Text style={s.calloutEyebrow}>For your content creator</Text>
                <Text style={s.calloutMain}>{calc.contentSpec}</Text>
                <Text style={s.calloutSub}>
                  Codec: MP4 H.264   ·   Frame rate: 50 Hz   ·   Start pixel: X:0 Y:0   ·   Corner: top-left
                </Text>
              </View>
            </>
          )}

          {/* Power Requirements */}
          {fields.powerRequirements && (
            <>
              <Text style={s.sectionHead}>Power Requirements</Text>
              {([ ["Total power draw", `${Math.round(Number(r("pow_totalWatts", power.totalWatts)))} W`],
                  ["Current at 240 V", `${Number(r("pow_amps", power.amps)).toFixed(2)} A`],
                  ["13A circuits",      String(r("pow_shukoCircuits", power.circuits))],
                  ["Data lines",       String(r("pow_dataLines", power.dataLines))],
                  ["Data links (UTP)", String(r("pow_utpData", power.utpDataCables))],
              ] as [string,string][]).map(([label, value], i) => (
                <View key={label} style={[s.powerRow, i % 2 === 1 ? { backgroundColor: C.pale } : {}]}>
                  <Text style={s.powerLabel}>{label}</Text>
                  <Text style={s.powerValue}>{value}</Text>
                </View>
              ))}
            </>
          )}

          {/* Material List */}
          {fields.materialList && (
            <>
              <Text style={s.sectionHead}>Material List</Text>
              {([ ["LED Flightcases",    r("mat_ledFlightcases",   materials.ledFlightcases)],
                  ["LED Panels",         r("mat_ledPanels",        materials.ledPanels)],
                  ["Powerlink 1m",       r("mat_powerlink1m",      materials.powerlink1m)],
                  ["Datalink 1m",        r("mat_datalink1m",       materials.datalink1m)],
                  ["Powerstart 10m",     r("mat_powerstart10m",    materials.powerstart10m)],
                  ["Powerstart 1m",      r("mat_powerstart1m",     materials.powerstart1m)],
                  ["Datastart KIT",      r("mat_datastartKit",     materials.datastartKit)],
                  ["E-tape rolls",       r("mat_etapeRolls",       materials.etapeRolls)],
                  ["FIT KIT",            r("mat_fitKit",           materials.fitKit)],
                  ["Neutrik Couplers",   r("mat_neutrikCouplers",  materials.neutrikCouplers)],
                  ["PROC Flightcase",    r("mat_procFlightcase",   materials.procFlightcase)],
                  ["LED Spares",         r("mat_ledSpares",        materials.ledSpares)],
                  ["Processor",          r("mat_processor",        materials.processor)],
                  ["PWR/HDMI/USB-A/UTP", r("mat_powerHdmiUsbUtp", materials.powerHdmiUsbUtp)],
                  ["Mediaplayer",        r("mat_mediaplayer",      materials.mediaplayer)],
                  ["PWR/HDMI/USB stick", r("mat_powerHdmiUsbStick",materials.powerHdmiUsbStick)],
              ] as [string, string|number][]).map(([label, qty], i) => (
                <View key={String(label)} style={[s.matRow, i % 2 === 1 ? { backgroundColor: C.pale } : {}]}>
                  <Text style={s.matLabel}>{label}</Text>
                  <Text style={s.matQty}>{qty}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <BrandFooter rows={footerRows} />
      </Page>

      {/* ── PAGE 2: Screen layout diagram ── */}
      {fields.visualRender && (
        <Page size="A4" style={s.page}>
          <BrandHeader docType="LED Wall" docTitle={meta.name || "LED Wall Configuration"} />

          <View style={s.layoutBody}>
            <Text style={s.sectionHead}>Screen Layout</Text>
            <PanelGridWithLabels
              columns={columns}
              rows={rows}
              blankCells={blankCells}
              chains={chains}
              showChains={fields.chainOverlay}
              widthM={Number(r("widthM", dimensions.widthM))}
              heightM={Number(r("heightM", dimensions.heightM))}
              large
            />
            <Text style={s.gridCaption}>
              {columns} × {rows} panels  ·  {dimensions.panelWidthMm} × {dimensions.panelHeightMm} mm per panel  ·  {dimensions.pixelPitch}  ·  {dimensions.activePanels} panels total
            </Text>
          </View>

          <BrandFooter rows={footerRows} />
        </Page>
      )}
    </Document>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  meta: ProjectMeta; calc: FullConfig; overrides: Overrides;
  blankCells: number[]; chains: ChainData[];
  companyName: string; onClose: () => void;
}

export function ClientPdfModal({ meta, calc, overrides, blankCells, chains, onClose }: ModalProps) {
  const [fields, setFields] = useState<PdfFields>(DEFAULT_FIELDS);
  const [generating, setGenerating] = useState(false);

  const toggle = (key: keyof PdfFields) => setFields((f) => ({ ...f, [key]: !f[key] }));

  const handleExport = useCallback(async () => {
    setGenerating(true);
    try {
      const blob = await pdf(
        <ClientPdfDocument meta={meta} calc={calc} overrides={overrides}
          blankCells={blankCells} chains={chains} fields={fields} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${meta.jobNumber || "led-wall"}-${(meta.name || "config").replace(/\s+/g, "-")}-client.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  }, [meta, calc, overrides, blankCells, chains, fields]);

  const sections: { key: keyof PdfFields; label: string; note?: string }[] = [
    { key: "projectInfo",       label: "Project info" },
    { key: "screenSpecs",       label: "Screen specifications" },
    { key: "contentSpec",       label: "Content specification" },
    { key: "powerRequirements", label: "Power requirements", note: "Sensitive — off by default" },
    { key: "materialList",      label: "Material list" },
    { key: "visualRender",      label: "Screen layout diagram (page 2)" },
    { key: "chainOverlay",      label: "Include daisy chain overlay" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Export client PDF</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Choose sections to include</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-2">
          {sections.map(({ key, label, note }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={fields[key]} onChange={() => toggle(key)}
                className="mt-0.5 rounded border-gray-300 text-blue-600" />
              <div>
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                {note && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">{note}</span>}
              </div>
            </label>
          ))}
        </div>
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose}
            className="text-sm px-4 py-2 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
            Cancel
          </button>
          <button onClick={handleExport} disabled={generating}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
            <FileDown size={15} />
            {generating ? "Generating…" : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
