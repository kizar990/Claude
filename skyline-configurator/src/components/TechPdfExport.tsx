import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  PDFDownloadLink,
  Svg,
  Rect,
  Line,
  G,
} from "@react-pdf/renderer";
import { Download } from "lucide-react";
import type { FullConfig } from "../calculations";
import type { ProjectMeta, ChainData } from "../store";
import { resolve } from "../useOverrides";
import type { Overrides } from "../useOverrides";
import { CONFIG } from "../config";

// ── Mini grid (PDF SVG primitives) ──────────────────────────────────────────

const CELL = 14;
const CGAP = 1;

function PdfMiniGrid({
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
  const panelChain = new Map<number, { color: string }>();
  for (const chain of chains) {
    chain.panels.forEach((pidx) => panelChain.set(pidx, { color: chain.color }));
  }

  const svgW = columns * (CELL + CGAP) - CGAP + 2;
  const svgH = rows * (CELL + CGAP) - CGAP + 2;

  return (
    <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: columns }, (_, c) => {
          const idx = r * columns + c;
          const isBlank = blankCells.includes(idx);
          const ci = panelChain.get(idx);
          const x = 1 + c * (CELL + CGAP);
          const y = 1 + r * (CELL + CGAP);
          return (
            <G key={idx}>
              <Rect
                x={x} y={y} width={CELL} height={CELL} rx={1}
                fill={isBlank ? "#94a3b8" : ci ? ci.color + "44" : "#e2e8f0"}
                stroke={isBlank ? "#64748b" : ci ? ci.color : "#cbd5e1"}
                strokeWidth={0.5}
              />
            </G>
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
            <Line key={`${chain.id}-${i}`}
              x1={fx} y1={fy} x2={tx} y2={ty}
              stroke={chain.color} strokeWidth={1} strokeOpacity={0.8}
            />
          );
        })
      )}
    </Svg>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page:        { fontFamily: "Helvetica", fontSize: 8, color: "#000", padding: 34 },
  // header
  header:      { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1.5, borderBottomColor: "#000", paddingBottom: 4, marginBottom: 6 },
  jobTitle:    { fontSize: 13, fontFamily: "Helvetica-Bold" },
  subTitle:    { fontSize: 7, color: "#555", marginTop: 1 },
  metaRight:   { textAlign: "right", fontSize: 7 },
  metaLine:    { marginBottom: 1 },
  // spec boxes
  specRow:     { flexDirection: "row", gap: 4, marginBottom: 6 },
  specBox:     { flex: 1, borderWidth: 0.5, borderColor: "#999", borderRadius: 2, padding: "3 4" },
  specLabel:   { fontSize: 6, color: "#666", textTransform: "uppercase", marginBottom: 1 },
  specValue:   { fontSize: 8, fontFamily: "Helvetica-Bold" },
  // power block
  powerBlock:  { borderWidth: 1, borderColor: "#000", borderRadius: 2, padding: "4 6", marginBottom: 6, backgroundColor: "#f5f5f5" },
  powerTitle:  { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  powerRow:    { flexDirection: "row", gap: 16 },
  powerItem:   { fontSize: 7 },
  powerBold:   { fontFamily: "Helvetica-Bold" },
  warning:     { fontSize: 7, color: "#cc0000", fontFamily: "Helvetica-Bold", marginTop: 2 },
  // material + layout
  body:        { flexDirection: "row", gap: 8 },
  matSection:  { flex: 1 },
  sectionHead: { fontSize: 8, fontFamily: "Helvetica-Bold", borderBottomWidth: 0.5, borderBottomColor: "#999", paddingBottom: 1, marginBottom: 2 },
  matCols:     { flexDirection: "row", gap: 8 },
  matTable:    { flex: 1 },
  matRow:      { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 0.3, borderBottomColor: "#ddd", paddingTop: 1.5, paddingBottom: 1.5 },
  matLabel:    { fontSize: 7, color: "#333" },
  matQty:      { fontSize: 7, fontFamily: "Helvetica-Bold" },
  // layout panel
  layoutPanel: { minWidth: 80 },
  chainRow:    { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  chainDot:    { width: 6, height: 6, borderRadius: 3 },
  chainLabel:  { fontSize: 6.5 },
  // content spec
  contentBox:  { marginTop: 6, backgroundColor: "#e8f0fe", borderRadius: 2, padding: "3 6" },
  contentText: { fontSize: 7 },
});

// ── PDF Document ─────────────────────────────────────────────────────────────

interface DocProps {
  meta: ProjectMeta;
  calc: FullConfig;
  overrides: Overrides;
  blankCells: number[];
  chains: ChainData[];
}

function TechDocument({ meta, calc, overrides, blankCells, chains }: DocProps) {
  const { dimensions, materials, power, processor } = calc;
  const r = <T extends string | number>(key: string, auto: T): T =>
    resolve(key, auto, overrides) as T;

  const columns = Math.round(dimensions.pixelsW / CONFIG.PANEL_PIXELS_W);
  const rows    = Math.round(dimensions.pixelsH / CONFIG.PANEL_PIXELS_H);

  const matItems: [string, string][] = [
    ["LED Flightcases",    String(r("mat_ledFlightcases",  materials.ledFlightcases))],
    ["LED Panels",         String(r("mat_ledPanels",       materials.ledPanels))],
    ["Powerlink 1m",       String(r("mat_powerlink1m",     materials.powerlink1m))],
    ["Datalink 1m",        String(r("mat_datalink1m",      materials.datalink1m))],
    ["Powerstart 10m",     String(r("mat_powerstart10m",   materials.powerstart10m))],
    ["Powerstart 1m",      String(r("mat_powerstart1m",    materials.powerstart1m))],
    ["Datastart KIT",      String(r("mat_datastartKit",    materials.datastartKit))],
    ["E-tape rolls",       String(r("mat_etapeRolls",      materials.etapeRolls))],
    ["FIT KIT",            String(r("mat_fitKit",          materials.fitKit))],
    ["Neutrik Couplers",   String(r("mat_neutrikCouplers", materials.neutrikCouplers))],
    ["PROC Flightcase",    String(r("mat_procFlightcase",  materials.procFlightcase))],
    ["LED Spares",         String(r("mat_ledSpares",       materials.ledSpares))],
    ["Processor",          String(r("mat_processor",       materials.processor))],
    ["PWR/HDMI/USB-A/UTP", String(r("mat_powerHdmiUsbUtp",materials.powerHdmiUsbUtp))],
    ["Mediaplayer",        String(r("mat_mediaplayer",     materials.mediaplayer))],
    ["PWR/HDMI/USB stick", String(r("mat_powerHdmiUsbStick",materials.powerHdmiUsbStick))],
  ];

  const half = Math.ceil(matItems.length / 2);
  const col1 = matItems.slice(0, half);
  const col2 = matItems.slice(half);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.jobTitle}>{meta.name || "LED Wall Job"}</Text>
            <Text style={s.subTitle}>{meta.client}{meta.venue ? ` — ${meta.venue}` : ""}</Text>
          </View>
          <View style={s.metaRight}>
            {meta.jobNumber ? <Text style={s.metaLine}>Job: {meta.jobNumber}</Text> : null}
            {meta.date      ? <Text style={s.metaLine}>Date: {meta.date}</Text>      : null}
            {meta.contact   ? <Text style={s.metaLine}>Contact: {meta.contact}</Text>: null}
          </View>
        </View>

        {/* Screen specs */}
        <View style={s.specRow}>
          {([
            ["Panels",     `${dimensions.activePanels} (${columns}×${rows})`],
            ["Size",       `${Number(r("widthM", dimensions.widthM)).toFixed(3)}m × ${Number(r("heightM", dimensions.heightM)).toFixed(3)}m`],
            ["Resolution", `${r("pixelsW", dimensions.pixelsW)}×${r("pixelsH", dimensions.pixelsH)}`],
            ["Weight",     `${Math.round(Number(r("totalWeight", dimensions.activePanels * 10)))} kg`],
            ["Processor",  processor.modelName],
          ] as [string, string][]).map(([label, val]) => (
            <View key={label} style={s.specBox}>
              <Text style={s.specLabel}>{label}</Text>
              <Text style={s.specValue}>{val}</Text>
            </View>
          ))}
        </View>

        {/* Power block */}
        <View style={s.powerBlock}>
          <Text style={s.powerTitle}>POWER</Text>
          <View style={s.powerRow}>
            <Text style={s.powerItem}><Text style={s.powerBold}>{Math.round(Number(r("pow_totalWatts", power.totalWatts)))} W</Text> total</Text>
            <Text style={s.powerItem}><Text style={s.powerBold}>{Number(r("pow_amps", power.amps)).toFixed(2)} A</Text> at 240V</Text>
            <Text style={s.powerItem}><Text style={s.powerBold}>{r("pow_shukoCircuits", power.circuits)}×</Text> 13A circuits</Text>
            <Text style={s.powerItem}><Text style={s.powerBold}>{r("pow_dataLines", power.dataLines)}</Text> data lines</Text>
            <Text style={s.powerItem}><Text style={s.powerBold}>{r("pow_utpData", power.utpDataCables)}</Text> data links (UTP)</Text>
          </View>
          {processor.needsUpgrade && (
            <Text style={s.warning}>{processor.warning}</Text>
          )}
        </View>

        {/* Material list + layout diagram */}
        <View style={s.body}>
          <View style={s.matSection}>
            <Text style={s.sectionHead}>MATERIAL LIST</Text>
            <View style={s.matCols}>
              <View style={s.matTable}>
                {col1.map(([label, qty]) => (
                  <View key={label} style={s.matRow}>
                    <Text style={s.matLabel}>{label}</Text>
                    <Text style={s.matQty}>{qty}</Text>
                  </View>
                ))}
              </View>
              <View style={s.matTable}>
                {col2.map(([label, qty]) => (
                  <View key={label} style={s.matRow}>
                    <Text style={s.matLabel}>{label}</Text>
                    <Text style={s.matQty}>{qty}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={s.layoutPanel}>
            <Text style={s.sectionHead}>LAYOUT</Text>
            <PdfMiniGrid columns={columns} rows={rows} blankCells={blankCells} chains={chains} />
            {chains.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={[s.sectionHead, { marginTop: 2 }]}>CABLE RUNS</Text>
                {chains.map((c, i) => (
                  <View key={c.id} style={s.chainRow}>
                    <View style={[s.chainDot, { backgroundColor: c.color }]} />
                    <Text style={s.chainLabel}>Ch{i + 1}: {c.panels.length} panels</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Content spec */}
        <View style={s.contentBox}>
          <Text style={s.contentText}><Text style={{ fontFamily: "Helvetica-Bold" }}>CONTENT: </Text>{calc.contentSpec}</Text>
        </View>

      </Page>
    </Document>
  );
}

// ── Download button (exported — lazy-loaded in App) ──────────────────────────

interface ButtonProps extends DocProps {
  processorId?: string;
}

export function TechPdfDownloadButton({ meta, calc, overrides, blankCells, chains }: ButtonProps) {
  const slug = [meta.jobNumber, meta.name].filter(Boolean).join("-").replace(/\s+/g, "-") || "tech-sheet";
  const fileName = `tech-sheet-${slug}.pdf`;

  return (
    <PDFDownloadLink
      document={<TechDocument meta={meta} calc={calc} overrides={overrides} blankCells={blankCells} chains={chains} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <span className="no-print flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
          <Download size={13} /> {loading ? "Building…" : "Tech PDF"}
        </span>
      )}
    </PDFDownloadLink>
  );
}
