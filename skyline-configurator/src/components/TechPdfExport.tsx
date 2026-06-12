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
  Circle,
} from "@react-pdf/renderer";
import { Download } from "lucide-react";
import type { FullConfig } from "../calculations";
import type { ProjectMeta, ChainData } from "../store";
import { resolve } from "../useOverrides";
import type { Overrides } from "../useOverrides";
import { term } from "../profiles";
import type { ProfileTerminology } from "../profiles";

// ── Main layout grid (larger, for page 1) ────────────────────────────────────

const LAYOUT_TARGET_W = 360;
const LAYOUT_CELL_GAP = 0.5;
const LAYOUT_CELL_MAX = 42;

function PdfLayoutGrid({
  columns,
  rows,
  blankCells,
  chains,
  widthM,
  heightM,
}: {
  columns: number;
  rows: number;
  blankCells: number[];
  chains: ChainData[];
  widthM: number;
  heightM: number;
}) {
  const cellSize = Math.min(
    (LAYOUT_TARGET_W - LAYOUT_CELL_GAP * (columns - 1)) / columns,
    LAYOUT_CELL_MAX
  );
  const gridW = columns * cellSize + LAYOUT_CELL_GAP * Math.max(0, columns - 1);
  const gridH = rows * cellSize + LAYOUT_CELL_GAP * Math.max(0, rows - 1);

  const CALLOUT_T = 16;
  const CALLOUT_R = 50;
  const svgW = gridW + CALLOUT_R;
  const svgH = CALLOUT_T + gridH + 4;

  const panelChain = new Map<number, string>();
  for (const chain of chains) {
    chain.panels.forEach((pidx) => panelChain.set(pidx, chain.color));
  }

  function cellX(c: number) { return c * (cellSize + LAYOUT_CELL_GAP); }
  function cellY(r: number) { return CALLOUT_T + r * (cellSize + LAYOUT_CELL_GAP); }

  return (
    <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      {/* Width callout */}
      <Line x1={0} y1={8} x2={gridW} y2={8} stroke="#D63025" strokeWidth={1} />
      <Line x1={0} y1={4} x2={0} y2={12} stroke="#D63025" strokeWidth={1} />
      <Line x1={gridW} y1={4} x2={gridW} y2={12} stroke="#D63025" strokeWidth={1} />
      <Text x={gridW / 2} y={5} textAnchor="middle"
        style={{ fontSize: 6, fill: "#D63025", fontFamily: "Helvetica-Bold" }}>
        {widthM.toFixed(3)} m
      </Text>
      {/* Height callout */}
      <Line x1={gridW + 10} y1={CALLOUT_T} x2={gridW + 10} y2={CALLOUT_T + gridH} stroke="#D63025" strokeWidth={1} />
      <Line x1={gridW + 6} y1={CALLOUT_T} x2={gridW + 14} y2={CALLOUT_T} stroke="#D63025" strokeWidth={1} />
      <Line x1={gridW + 6} y1={CALLOUT_T + gridH} x2={gridW + 14} y2={CALLOUT_T + gridH} stroke="#D63025" strokeWidth={1} />
      <Text x={gridW + 16} y={CALLOUT_T + gridH / 2} dominantBaseline="middle"
        style={{ fontSize: 6, fill: "#D63025", fontFamily: "Helvetica-Bold" }}>
        {heightM.toFixed(3)} m
      </Text>
      {/* FRONT VIEW label */}
      <Text x={2} y={CALLOUT_T + 7}
        style={{ fontSize: 5, fontFamily: "Helvetica", fill: "#94A3B8" }}>
        FRONT VIEW
      </Text>
      {/* Panels */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: columns }, (_, c) => {
          const idx = r * columns + c;
          const isBlank = blankCells.includes(idx);
          const color = panelChain.get(idx);
          return (
            <G key={idx}>
              <Rect
                x={cellX(c)} y={cellY(r)}
                width={cellSize} height={cellSize}
                fill={isBlank ? "#94a3b8" : color ? color + "44" : "#e2e8f0"}
                stroke={isBlank ? "#64748b" : color ?? "#cbd5e1"}
                strokeWidth={0.5}
              />
            </G>
          );
        })
      )}
      {/* Chain lines */}
      {chains.map((chain) =>
        chain.panels.slice(0, -1).map((from, i) => {
          const to = chain.panels[i + 1];
          const fx = cellX(from % columns) + cellSize / 2;
          const fy = cellY(Math.floor(from / columns)) + cellSize / 2;
          const tx = cellX(to % columns) + cellSize / 2;
          const ty = cellY(Math.floor(to / columns)) + cellSize / 2;
          return (
            <Line key={`${chain.id}-${i}`}
              x1={fx} y1={fy} x2={tx} y2={ty}
              stroke={chain.color} strokeWidth={1.2} strokeOpacity={0.8} />
          );
        })
      )}
    </Svg>
  );
}

// ── Routing diagram grid (for dedicated routing pages) ───────────────────────

const PORT_COLORS = [
  "#2563EB", "#059669", "#7C3AED", "#0891B2",
  "#0D9488", "#4F46E5", "#1D4ED8", "#047857",
];
const CHAIN_COLORS = [
  "#DC2626", "#EA580C", "#D97706", "#CA8A04",
  "#92400E", "#BE185D", "#B45309", "#9F1239",
];

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const DIAG_MAX_W = 460;
const DIAG_CELL_GAP = 0.5;

interface RoutingDiagramProps {
  columns: number;
  rows: number;
  sequences: Record<string, number[]>;
  colors: string[];
  label: string;
  widthM: number;
  heightM: number;
}

function RoutingDiagram({ columns, rows, sequences, colors, label, widthM, heightM }: RoutingDiagramProps) {
  const cellSize = Math.min(
    (DIAG_MAX_W - DIAG_CELL_GAP * (columns - 1)) / columns,
    40
  );
  const gridW = columns * cellSize + DIAG_CELL_GAP * (columns - 1);
  const gridH = rows * cellSize + DIAG_CELL_GAP * (rows - 1);

  const CALLOUT_T = 18;
  const CALLOUT_R = 50;
  const svgW = gridW + CALLOUT_R;
  const svgH = CALLOUT_T + gridH + 12;

  const panelToSeq: Record<number, number> = {};
  Object.entries(sequences).forEach(([k, indices]) => {
    indices.forEach((i) => { panelToSeq[i] = parseInt(k, 10); });
  });

  function cellX(col: number) { return col * (cellSize + DIAG_CELL_GAP); }
  function cellY(row: number) { return CALLOUT_T + row * (cellSize + DIAG_CELL_GAP); }
  function cx(idx: number) { return cellX(idx % columns) + cellSize / 2; }
  function cy(idx: number) { return cellY(Math.floor(idx / columns)) + cellSize / 2; }

  return (
    <View>
      <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        <Line x1={0} y1={8} x2={gridW} y2={8} stroke="#D63025" strokeWidth={1} />
        <Line x1={0} y1={4} x2={0} y2={12} stroke="#D63025" strokeWidth={1} />
        <Line x1={gridW} y1={4} x2={gridW} y2={12} stroke="#D63025" strokeWidth={1} />
        <Text x={gridW / 2} y={5} textAnchor="middle"
          style={{ fontSize: 6, fill: "#D63025", fontFamily: "Helvetica-Bold" }}>
          {widthM.toFixed(3)} m
        </Text>
        <Line x1={gridW + 10} y1={CALLOUT_T} x2={gridW + 10} y2={CALLOUT_T + gridH} stroke="#D63025" strokeWidth={1} />
        <Line x1={gridW + 6} y1={CALLOUT_T} x2={gridW + 14} y2={CALLOUT_T} stroke="#D63025" strokeWidth={1} />
        <Line x1={gridW + 6} y1={CALLOUT_T + gridH} x2={gridW + 14} y2={CALLOUT_T + gridH} stroke="#D63025" strokeWidth={1} />
        <Text x={gridW + 16} y={CALLOUT_T + gridH / 2} dominantBaseline="middle"
          style={{ fontSize: 6, fill: "#D63025", fontFamily: "Helvetica-Bold" }}>
          {heightM.toFixed(3)} m
        </Text>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: columns }, (_, c) => {
            const idx = r * columns + c;
            const seqNum = panelToSeq[idx];
            const fill = seqNum !== undefined
              ? hexToRgba(colors[(seqNum - 1) % colors.length], 0.3)
              : "#E2E8F0";
            const stroke = seqNum !== undefined
              ? colors[(seqNum - 1) % colors.length]
              : "#B8C8DC";
            return (
              <G key={idx}>
                <Rect
                  x={cellX(c)} y={cellY(r)}
                  width={cellSize} height={cellSize}
                  fill={fill} stroke={stroke} strokeWidth={0.5}
                />
              </G>
            );
          })
        )}
        {Object.entries(sequences).flatMap(([k, indices]) => {
          if (indices.length < 2) return [];
          const num = parseInt(k, 10);
          const color = colors[(num - 1) % colors.length];
          return indices.slice(0, -1).map((from, i) => {
            const to = indices[i + 1];
            return (
              <Line key={`${k}-${i}`}
                x1={cx(from)} y1={cy(from)} x2={cx(to)} y2={cy(to)}
                stroke={color} strokeWidth={1.2} strokeOpacity={0.85} />
            );
          });
        })}
        {Object.entries(sequences).map(([k, indices]) => {
          if (indices.length === 0) return null;
          const num = parseInt(k, 10);
          const color = colors[(num - 1) % colors.length];
          const markerR = Math.min(cellSize * 0.22, 6);
          return (
            <G key={`marker-${k}`}>
              <Circle cx={cx(indices[0])} cy={cy(indices[0])} r={markerR} fill={color} />
              <Text x={cx(indices[0])} y={cy(indices[0])} textAnchor="middle" dominantBaseline="middle"
                style={{ fontSize: markerR * 1.1, fontFamily: "Helvetica-Bold", fill: "white" }}>
                {String(num)}
              </Text>
            </G>
          );
        })}
        <Text x={3} y={CALLOUT_T + 7}
          style={{ fontSize: 5, fontFamily: "Helvetica", fill: "#94A3B8" }}>
          {label}
        </Text>
      </Svg>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page:         { fontFamily: "Helvetica", fontSize: 8, color: "#000", padding: 34 },
  header:       { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1.5, borderBottomColor: "#000", paddingBottom: 4, marginBottom: 6 },
  jobTitle:     { fontSize: 13, fontFamily: "Helvetica-Bold" },
  subTitle:     { fontSize: 7, color: "#555", marginTop: 1 },
  metaRight:    { textAlign: "right", fontSize: 7 },
  metaLine:     { marginBottom: 1 },
  specRow:      { flexDirection: "row", gap: 4, marginBottom: 6 },
  specBox:      { flex: 1, borderWidth: 0.5, borderColor: "#999", borderRadius: 2, padding: "3 4" },
  specLabel:    { fontSize: 6, color: "#666", textTransform: "uppercase", marginBottom: 1 },
  specValue:    { fontSize: 8, fontFamily: "Helvetica-Bold" },
  // enhanced power block
  powerBlock:   { borderWidth: 1, borderColor: "#000", borderRadius: 2, padding: "5 6", marginBottom: 8, backgroundColor: "#f5f5f5" },
  powerTitle:   { fontSize: 8, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  powerRow:     { flexDirection: "row", gap: 12, marginBottom: 2 },
  powerRow2:    { flexDirection: "row", gap: 12, marginTop: 2 },
  powerItem:    { fontSize: 7 },
  powerBold:    { fontFamily: "Helvetica-Bold" },
  powerDivider: { borderTopWidth: 0.5, borderTopColor: "#ccc", marginTop: 3, marginBottom: 3 },
  warning:      { fontSize: 7, color: "#cc0000", fontFamily: "Helvetica-Bold", marginTop: 2 },
  // layout section
  layoutSection:{ marginBottom: 8 },
  sectionHead:  { fontSize: 8, fontFamily: "Helvetica-Bold", borderBottomWidth: 0.5, borderBottomColor: "#999", paddingBottom: 1, marginBottom: 4 },
  // material
  matSection:   { marginBottom: 8 },
  matCols:      { flexDirection: "row", gap: 8 },
  matTable:     { flex: 1 },
  matRow:       { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 0.3, borderBottomColor: "#ddd", paddingTop: 1.5, paddingBottom: 1.5 },
  matLabel:     { fontSize: 7, color: "#333" },
  matQty:       { fontSize: 7, fontFamily: "Helvetica-Bold" },
  // chain legend on layout
  chainRow:     { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  chainDot:     { width: 6, height: 6, borderRadius: 3 },
  chainLabel:   { fontSize: 6.5 },
  // content spec
  contentBox:   { marginTop: 4, backgroundColor: "#e8f0fe", borderRadius: 2, padding: "3 6" },
  contentText:  { fontSize: 7 },
  // routing diagram page
  diagPage:     { fontFamily: "Helvetica", fontSize: 8, color: "#000", padding: 34 },
  diagTitle:    { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  diagSub:      { fontSize: 7, color: "#555", marginBottom: 10 },
  legendRow:    { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  legendItem:   { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot:    { width: 8, height: 8, borderRadius: 4 },
  legendText:   { fontSize: 7 },
  summaryTable: { marginTop: 10 },
  summaryHead:  { fontSize: 8, fontFamily: "Helvetica-Bold", borderBottomWidth: 0.5, borderBottomColor: "#999", paddingBottom: 1, marginBottom: 2 },
  summaryRow:   { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 0.3, borderBottomColor: "#ddd", paddingTop: 1.5, paddingBottom: 1.5 },
  summaryLabel: { fontSize: 7, color: "#333" },
  summaryVal:   { fontSize: 7, fontFamily: "Helvetica-Bold" },
});

// ── PDF Document ─────────────────────────────────────────────────────────────

interface DocProps {
  meta: ProjectMeta;
  calc: FullConfig;
  overrides: Overrides;
  blankCells: number[];
  chains: ChainData[];
  dataPortSequences?: Record<string, number[]>;
  powerChainSequences?: Record<string, number[]>;
  numPorts?: number;
  panelsPerPort?: number;
  panelPowerW?: number;
  panelOperatingPowerW?: number;
  panelMaxPowerW?: number;
  powerMaxWatts?: number;
  powerSizingMode?: "operating" | "max";
  cableEntry?: "top" | "bottom" | "left" | "right";
  profileName?: string;
  profileAccentColor?: string;
  terminology?: ProfileTerminology;
  riggingSystem?: "modular" | "scaffolding" | "custom";
  trussEvery?: number;
}

function TechDocument({
  meta, calc, overrides, blankCells, chains,
  dataPortSequences, powerChainSequences,
  numPorts, panelsPerPort, panelPowerW,
  panelOperatingPowerW, panelMaxPowerW,
  powerMaxWatts, powerSizingMode, cableEntry,
  profileAccentColor, terminology,
  riggingSystem, trussEvery = 2,
}: DocProps) {
  const { dimensions, materials, power, processor } = calc;
  const r = <T extends string | number>(key: string, auto: T): T =>
    resolve(key, auto, overrides) as T;

  const columns = dimensions.columns;
  const rows    = dimensions.rows;
  const widthM  = Number(r("widthM", dimensions.widthM));
  const heightM = Number(r("heightM", dimensions.heightM));

  const opPower = panelOperatingPowerW ?? 120;
  const maxPower = panelMaxPowerW ?? 180;
  const activePanels = dimensions.activePanels;
  const opTotal = activePanels * opPower;
  const maxTotal = activePanels * maxPower;
  const mode = powerSizingMode ?? "operating";

  // Data routing stats
  const populatedDataChains = dataPortSequences
    ? Object.values(dataPortSequences).filter((c) => c.length > 0)
    : [];
  const hasDrawnData = populatedDataChains.length > 0;
  const effectivePanelsPerPort = (panelsPerPort != null && panelsPerPort > 0) ? panelsPerPort : 13;
  const dataStarts = hasDrawnData
    ? populatedDataChains.length
    : Math.max(1, Math.ceil(activePanels / effectivePanelsPerPort));
  const dataLinks = hasDrawnData
    ? populatedDataChains.reduce((sum, c) => sum + Math.max(0, c.length - 1), 0)
    : Math.max(0, activePanels - dataStarts);

  // Power chain stats
  const populatedPowerChains = powerChainSequences
    ? Object.values(powerChainSequences).filter((c) => c.length > 0)
    : [];
  const hasDrawnPower = populatedPowerChains.length > 0;
  const effectivePw = panelPowerW ?? opPower;
  const panelsPerPowerChain = Math.max(1, Math.floor((powerMaxWatts ?? 2400) / effectivePw));
  const powerStarts = hasDrawnPower
    ? populatedPowerChains.length
    : Math.ceil(activePanels / panelsPerPowerChain);
  const powerLinks = hasDrawnPower
    ? populatedPowerChains.reduce((sum, c) => sum + Math.max(0, c.length - 1), 0)
    : Math.max(0, activePanels - powerStarts);

  const T = terminology;
  const tl = (key: keyof ProfileTerminology, fallback: string) =>
    T ? term(T, key, fallback) : fallback;

  const matItems: [string, string][] = [
    ["LED Flightcases",                               String(r("mat_ledFlightcases",  materials.ledFlightcases))],
    ["LED Panels",                                    String(r("mat_ledPanels",       materials.ledPanels))],
    [tl("powerlinkLabel",    "Powerlink 1m"),         String(r("mat_powerlink1m",     materials.powerlink1m))],
    [tl("datalinkLabel",     "Datalink 1m"),          String(r("mat_datalink1m",      materials.datalink1m))],
    ["Data starts",                                    String(dataStarts)],
    ["Power starts",                                   String(powerStarts)],
    [tl("etapeLabel",        "E-tape rolls"),         String(r("mat_etapeRolls",      materials.etapeRolls))],
    [tl("fitKitLabel",       "FIT KIT"),              String(r("mat_fitKit",          materials.fitKit))],
    [tl("neutrikCouplersLabel","Neutrik Couplers"),   String(r("mat_neutrikCouplers", materials.neutrikCouplers))],
    ["PROC Flightcase",                               String(r("mat_procFlightcase",  materials.procFlightcase))],
    ["LED Spares",                                    String(r("mat_ledSpares",       materials.ledSpares))],
    ["Processor",                                     String(r("mat_processor",       materials.processor))],
    ["PWR/HDMI/USB-A/UTP",                            String(r("mat_powerHdmiUsbUtp",materials.powerHdmiUsbUtp))],
    ["Mediaplayer",                                   String(r("mat_mediaplayer",     materials.mediaplayer))],
    ["PWR/HDMI/USB stick",                            String(r("mat_powerHdmiUsbStick",materials.powerHdmiUsbStick))],
  ];

  const half = Math.ceil(matItems.length / 2);
  const col1 = matItems.slice(0, half);
  const col2 = matItems.slice(half);

  const hasDataRouting = dataPortSequences && Object.values(dataPortSequences).some((v) => v.length > 0);
  const hasPowerRouting = powerChainSequences && Object.values(powerChainSequences).some((v) => v.length > 0);

  const cableEntryLabel = cableEntry
    ? cableEntry.charAt(0).toUpperCase() + cableEntry.slice(1)
    : "—";

  // ── Ground support (scaffolding / custom rigs) ────────────────────────────
  const isScaffolding = riggingSystem && riggingSystem !== "modular";
  const gsPositions: number[] = [0];
  if (isScaffolding) {
    const spacing = Math.max(1, trussEvery);
    for (let c = spacing; c < columns; c += spacing) gsPositions.push(c);
    if (gsPositions[gsPositions.length - 1] !== columns) gsPositions.push(columns);
  }
  const numRearTrusses = isScaffolding ? gsPositions.length : 0;
  const numBaseTrusses = numRearTrusses;
  const gsBridgeClamps = isScaffolding ? numRearTrusses * (rows + 1) : 0;
  const gsSandbags     = isScaffolding ? numBaseTrusses * 2 : 0;
  const totalWeightKg  = Math.round(activePanels * dimensions.panelWeightKg);
  const structureLabel = tl("structureType", "Structure");
  const supportLabel   = tl("panelSupport",  "Pickup Point");

  return (
    <Document>
      {/* ── Page 1: Summary + Layout ─────────────────────────────────────── */}
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
            ["Size",       `${widthM.toFixed(3)}m × ${heightM.toFixed(3)}m`],
            ["Resolution", `${r("pixelsW", dimensions.pixelsW)}×${r("pixelsH", dimensions.pixelsH)}`],
            ["Weight",     `${Math.round(dimensions.activePanels * dimensions.panelWeightKg)} kg`],
            ["Processor",  processor.modelName],
          ] as [string, string][]).map(([label, val]) => (
            <View key={label} style={s.specBox}>
              <Text style={s.specLabel}>{label}</Text>
              <Text style={s.specValue}>{val}</Text>
            </View>
          ))}
        </View>

        {/* Enhanced power block */}
        <View style={[s.powerBlock, profileAccentColor ? { borderColor: profileAccentColor } : {}]}>
          <Text style={s.powerTitle}>POWER REQUIREMENTS</Text>
          <View style={s.powerRow}>
            <Text style={s.powerItem}>
              Operating: <Text style={s.powerBold}>{opTotal.toLocaleString()} W</Text>
              {" "}({opPower} W/panel)
            </Text>
            <Text style={s.powerItem}>
              Max: <Text style={s.powerBold}>{maxTotal.toLocaleString()} W</Text>
              {" "}({maxPower} W/panel)
            </Text>
            <Text style={s.powerItem}>
              Active sizing: <Text style={s.powerBold}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Text>
            </Text>
          </View>
          <View style={s.powerDivider} />
          <View style={s.powerRow2}>
            <Text style={s.powerItem}>
              <Text style={s.powerBold}>{Number(r("pow_amps", power.amps)).toFixed(2)} A</Text> at 240V
            </Text>
            <Text style={s.powerItem}>
              <Text style={s.powerBold}>{r("pow_shukoCircuits", power.circuits)}×</Text> 13A circuits
            </Text>
            <Text style={s.powerItem}>
              Cable entry: <Text style={s.powerBold}>{cableEntryLabel}</Text>
            </Text>
            <Text style={s.powerItem}>
              Data starts: <Text style={s.powerBold}>{dataStarts}{!hasDrawnData ? "*" : ""}</Text>
            </Text>
            <Text style={s.powerItem}>
              Data links: <Text style={s.powerBold}>{dataLinks}{!hasDrawnData ? "*" : ""}</Text>
            </Text>
            <Text style={s.powerItem}>
              Power starts: <Text style={s.powerBold}>{powerStarts}{!hasDrawnPower ? "*" : ""}</Text>
            </Text>
          </View>
          {(!hasDrawnData || !hasDrawnPower) && (
            <Text style={{ fontSize: 6, color: "#888", marginTop: 3 }}>
              * Estimated — draw routing in technician view to refine
            </Text>
          )}
          {processor.needsUpgrade && (
            <Text style={s.warning}>{processor.warning}</Text>
          )}
        </View>

        {/* Screen layout — main visual focus */}
        <View style={s.layoutSection}>
          <Text style={s.sectionHead}>SCREEN LAYOUT (FRONT VIEW)</Text>
          <PdfLayoutGrid
            columns={columns}
            rows={rows}
            blankCells={blankCells}
            chains={chains}
            widthM={widthM}
            heightM={heightM}
          />
          {chains.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              {chains.map((c, i) => (
                <View key={c.id} style={s.chainRow}>
                  <View style={[s.chainDot, { backgroundColor: c.color }]} />
                  <Text style={s.chainLabel}>Ch{i + 1}: {c.panels.length} panels</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Material list */}
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

        {/* Ground support hardware (scaffolding profiles only) */}
        {isScaffolding && (
          <View style={{ marginBottom: 8, borderWidth: 0.5, borderColor: profileAccentColor ?? "#999", borderRadius: 2, padding: "4 6" }}>
            <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", marginBottom: 3 }}>
              GROUND SUPPORT — {structureLabel.toUpperCase()}
            </Text>
            <View style={{ flexDirection: "row", gap: 14, marginBottom: 2 }}>
              <Text style={s.powerItem}>Rear trusses: <Text style={s.powerBold}>{numRearTrusses}</Text></Text>
              <Text style={s.powerItem}>Base trusses: <Text style={s.powerBold}>{numBaseTrusses}</Text></Text>
              <Text style={s.powerItem}>Bridge clamps: <Text style={s.powerBold}>{gsBridgeClamps}</Text></Text>
              <Text style={s.powerItem}>Sandbags: <Text style={s.powerBold}>{gsSandbags}</Text></Text>
              <Text style={s.powerItem}>Panel weight: <Text style={s.powerBold}>{totalWeightKg} kg</Text></Text>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {gsPositions.map((col, i) => {
                const leftSpan  = i === 0 ? 0 : col - gsPositions[i - 1];
                const rightSpan = i === gsPositions.length - 1 ? 0 : gsPositions[i + 1] - col;
                const load = Math.ceil(((leftSpan + rightSpan) / 2) * rows * dimensions.panelWeightKg);
                return (
                  <Text key={i} style={{ fontSize: 6, color: "#555" }}>
                    {supportLabel} #{i + 1}: {(col * dimensions.panelWidthMm / 1000).toFixed(2)}m — ~{load} kg
                  </Text>
                );
              })}
            </View>
          </View>
        )}

        {/* Content spec */}
        <View style={s.contentBox}>
          <Text style={s.contentText}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>CONTENT: </Text>
            {calc.contentSpec}
          </Text>
        </View>

      </Page>

      {/* ── Page 2: Data routing diagram ─────────────────────────────────── */}
      {hasDataRouting && (
        <Page size="A4" style={s.diagPage}>
          <View style={s.header}>
            <View>
              <Text style={s.jobTitle}>{meta.name || "LED Wall Job"} — Data Routing</Text>
              <Text style={s.subTitle}>Front view · {columns} × {rows} panels · {processor.modelName}</Text>
            </View>
            <View style={s.metaRight}>
              {meta.jobNumber ? <Text style={s.metaLine}>Job: {meta.jobNumber}</Text> : null}
              {meta.date      ? <Text style={s.metaLine}>Date: {meta.date}</Text>      : null}
            </View>
          </View>

          <RoutingDiagram
            columns={columns}
            rows={rows}
            sequences={dataPortSequences!}
            colors={PORT_COLORS}
            label="FRONT VIEW — DATA"
            widthM={widthM}
            heightM={heightM}
          />

          <View style={s.legendRow}>
            {Object.entries(dataPortSequences!).filter(([, v]) => v.length > 0).map(([k]) => {
              const num = parseInt(k, 10);
              const color = PORT_COLORS[(num - 1) % PORT_COLORS.length];
              const count = dataPortSequences![k].length;
              return (
                <View key={k} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: color }]} />
                  <Text style={s.legendText}>Port {num}: {count} panels</Text>
                </View>
              );
            })}
          </View>

          <View style={s.summaryTable}>
            <Text style={s.summaryHead}>PORT SUMMARY</Text>
            {Object.entries(dataPortSequences!).filter(([, v]) => v.length > 0).map(([k]) => {
              const num = parseInt(k, 10);
              const count = dataPortSequences![k].length;
              const overLimit = panelsPerPort !== undefined && count > panelsPerPort;
              return (
                <View key={k} style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Port {num}</Text>
                  <Text style={[s.summaryVal, overLimit ? { color: "#cc0000" } : {}]}>
                    {count} panels{overLimit ? " ⚠ over limit" : ""}
                    {panelsPerPort !== undefined ? ` (max ${panelsPerPort})` : ""}
                  </Text>
                </View>
              );
            })}
            {numPorts !== undefined && panelsPerPort !== undefined && (
              <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={s.summaryLabel}>Processor capacity</Text>
                <Text style={s.summaryVal}>{numPorts} ports × {panelsPerPort} panels = {numPorts * panelsPerPort} total</Text>
              </View>
            )}
            <View style={[s.summaryRow, { borderBottomWidth: 0, marginTop: 2 }]}>
              <Text style={s.summaryLabel}>Data links total</Text>
              <Text style={s.summaryVal}>{dataLinks} panel-to-panel connections</Text>
            </View>
          </View>
        </Page>
      )}

      {/* ── Page 3: Power routing diagram ────────────────────────────────── */}
      {hasPowerRouting && (
        <Page size="A4" style={s.diagPage}>
          <View style={s.header}>
            <View>
              <Text style={s.jobTitle}>{meta.name || "LED Wall Job"} — Power Routing</Text>
              <Text style={s.subTitle}>
                Front view · {columns} × {rows} panels · {effectivePw} W/panel ({mode})
              </Text>
            </View>
            <View style={s.metaRight}>
              {meta.jobNumber ? <Text style={s.metaLine}>Job: {meta.jobNumber}</Text> : null}
              {meta.date      ? <Text style={s.metaLine}>Date: {meta.date}</Text>      : null}
            </View>
          </View>

          <RoutingDiagram
            columns={columns}
            rows={rows}
            sequences={powerChainSequences!}
            colors={CHAIN_COLORS}
            label="FRONT VIEW — POWER"
            widthM={widthM}
            heightM={heightM}
          />

          <View style={s.legendRow}>
            {Object.entries(powerChainSequences!).filter(([, v]) => v.length > 0).map(([k]) => {
              const num = parseInt(k, 10);
              const color = CHAIN_COLORS[(num - 1) % CHAIN_COLORS.length];
              const count = powerChainSequences![k].length;
              return (
                <View key={k} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: color }]} />
                  <Text style={s.legendText}>Chain {num}: {count} panels · {count * effectivePw} W</Text>
                </View>
              );
            })}
          </View>

          <View style={s.summaryTable}>
            <Text style={s.summaryHead}>CHAIN SUMMARY</Text>
            {Object.entries(powerChainSequences!).filter(([, v]) => v.length > 0).map(([k]) => {
              const num = parseInt(k, 10);
              const maxW = powerMaxWatts ?? 2400;
              const count = powerChainSequences![k].length;
              const watts = count * effectivePw;
              const overLimit = watts > maxW;
              return (
                <View key={k} style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Chain {num}</Text>
                  <Text style={[s.summaryVal, overLimit ? { color: "#cc0000" } : {}]}>
                    {count} panels · {watts} W{overLimit ? " ⚠ over budget" : ""}
                    {` (budget ${maxW} W)`}
                  </Text>
                </View>
              );
            })}
            <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={s.summaryLabel}>Total power ({mode})</Text>
              <Text style={s.summaryVal}>
                {Object.values(powerChainSequences!).flat().length * effectivePw} W across{" "}
                {Object.values(powerChainSequences!).filter((v) => v.length > 0).length} chains
              </Text>
            </View>
            <View style={[s.summaryRow, { borderBottomWidth: 0, marginTop: 2 }]}>
              <Text style={s.summaryLabel}>Power links total</Text>
              <Text style={s.summaryVal}>{powerLinks} panel-to-panel connections</Text>
            </View>
          </View>
        </Page>
      )}
    </Document>
  );
}

// ── Download button ───────────────────────────────────────────────────────────

interface ButtonProps extends DocProps {
  processorId?: string;
}

export function TechPdfDownloadButton({
  meta, calc, overrides, blankCells, chains,
  dataPortSequences, powerChainSequences,
  numPorts, panelsPerPort, panelPowerW,
  panelOperatingPowerW, panelMaxPowerW,
  powerMaxWatts, powerSizingMode, cableEntry,
  profileName, profileAccentColor, terminology,
  riggingSystem, trussEvery,
}: ButtonProps) {
  const slug = [meta.jobNumber, meta.name].filter(Boolean).join("-").replace(/\s+/g, "-") || "tech-sheet";
  const fileName = `tech-sheet-${slug}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <TechDocument
          meta={meta}
          calc={calc}
          overrides={overrides}
          blankCells={blankCells}
          chains={chains}
          dataPortSequences={dataPortSequences}
          powerChainSequences={powerChainSequences}
          numPorts={numPorts}
          panelsPerPort={panelsPerPort}
          panelPowerW={panelPowerW}
          panelOperatingPowerW={panelOperatingPowerW}
          panelMaxPowerW={panelMaxPowerW}
          powerMaxWatts={powerMaxWatts}
          powerSizingMode={powerSizingMode}
          cableEntry={cableEntry}
          profileName={profileName}
          profileAccentColor={profileAccentColor}
          terminology={terminology}
          riggingSystem={riggingSystem}
          trussEvery={trussEvery}
        />
      }
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
