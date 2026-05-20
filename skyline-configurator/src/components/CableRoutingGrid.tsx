import { useState, useRef, useEffect, useCallback } from "react";

// ── Colors ────────────────────────────────────────────────────────────────────
const PORT_COLORS = [
  "#2563EB", "#059669", "#7C3AED", "#0891B2",
  "#0D9488", "#4F46E5", "#1D4ED8", "#047857",
];

const CHAIN_COLORS = [
  "#DC2626", "#EA580C", "#D97706", "#CA8A04",
  "#92400E", "#BE185D", "#B45309", "#9F1239",
];

// ── Layout constants (SVG user units) ────────────────────────────────────────
const GRID_W = 540;
const CALLOUT_TOP = 46;
const CALLOUT_R = 80;
const CAPTION_H = 40; // extra room for cable entry indicator line
const CALLOUT_COLOR = "#D63025";
const TICK_HALF = 7;
const LABEL_GAP = 11;
const PANEL_STROKE = "#B8C8DC";
const GRID_BORDER = "#8BA3C0";
const CAPTION_COLOR = "#718096";

// ── Props ─────────────────────────────────────────────────────────────────────
type EntryEdge = "top" | "bottom" | "left" | "right";

interface Props {
  columns: number;
  rows: number;
  widthM: number;
  heightM: number;
  panelWidthMm: number;
  panelHeightMm: number;
  pixelPitch: string;
  activePanels: number;
  numPorts: number;
  panelsPerPort: number;
  panelPowerW: number;
  routingMode: "layout" | "data" | "power";
  cableEntry: EntryEdge;
  dataPortSequences: Record<string, number[]>;
  powerChainSequences: Record<string, number[]>;
  powerMaxWatts: number;
  onModeChange: (m: "layout" | "data" | "power") => void;
  onCableEntryChange: (e: EntryEdge) => void;
  onDataPortSequencesChange: (s: Record<string, number[]>) => void;
  onPowerChainSequencesChange: (s: Record<string, number[]>) => void;
  onPowerMaxWattsChange: (w: number) => void;
}

// ── Helper: hex color → rgba with alpha ──────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function CableRoutingGrid({
  columns,
  rows,
  widthM,
  heightM,
  panelWidthMm,
  panelHeightMm,
  pixelPitch,
  activePanels,
  numPorts,
  panelsPerPort,
  panelPowerW,
  routingMode,
  cableEntry,
  dataPortSequences,
  powerChainSequences,
  powerMaxWatts,
  onModeChange,
  onCableEntryChange,
  onDataPortSequencesChange,
  onPowerChainSequencesChange,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Local UI state ────────────────────────────────────────────────────────
  const [activePort, setActivePort] = useState(1);
  const [activeChain, setActiveChain] = useState(1);
  const [numChains, setNumChains] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouchedPanel, setLastTouchedPanel] = useState<number | null>(null);
  const [flashPanel, setFlashPanel] = useState<number | null>(null);
  const [portFullWarning, setPortFullWarning] = useState<number | null>(null);
  const [portFullPos, setPortFullPos] = useState<{ x: number; y: number } | null>(null);

  // Keep dragging ref in sync for event handlers on window
  const isDraggingRef = useRef(false);
  useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);

  // ── SVG geometry ─────────────────────────────────────────────────────────
  if (columns <= 0 || rows <= 0) return null;

  const cellW = GRID_W / columns;
  const cellH = cellW;
  const gridH = cellH * rows;
  const totalW = GRID_W + CALLOUT_R;
  const totalH = CALLOUT_TOP + gridH + CAPTION_H;

  const gx = 0;
  const gy = CALLOUT_TOP;
  const widthLineY = gy - CALLOUT_TOP / 2;
  const heightLineX = gx + GRID_W + 22;

  // ── Build reverse map: panel index → port number ─────────────────────────
  const panelToPort: Record<number, number> = {};
  Object.entries(dataPortSequences).forEach(([portKey, indices]) => {
    const portNum = parseInt(portKey, 10);
    indices.forEach((idx) => { panelToPort[idx] = portNum; });
  });

  const panelToChain: Record<number, number> = {};
  Object.entries(powerChainSequences).forEach(([chainKey, indices]) => {
    const chainNum = parseInt(chainKey, 10);
    indices.forEach((idx) => { panelToChain[idx] = chainNum; });
  });

  // ── Panel → SVG center coords ─────────────────────────────────────────────
  function panelCenter(idx: number): { cx: number; cy: number } {
    const col = idx % columns;
    const row = Math.floor(idx / columns);
    return {
      cx: gx + col * cellW + cellW / 2,
      cy: gy + row * cellH + cellH / 2,
    };
  }

  // ── Client coords → panel index ──────────────────────────────────────────
  const clientToPanel = useCallback((e: { clientX: number; clientY: number }): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    const vbW = GRID_W + CALLOUT_R;
    const vbH = CALLOUT_TOP + gridH + CAPTION_H;
    const vx = (e.clientX - r.left) / r.width * vbW;
    const vy = (e.clientY - r.top) / r.height * vbH;
    if (vx < 0 || vx >= GRID_W || vy < CALLOUT_TOP || vy >= CALLOUT_TOP + gridH) return null;
    const col = Math.floor(vx / cellW);
    const row = Math.floor((vy - CALLOUT_TOP) / cellH);
    if (col < 0 || col >= columns || row < 0 || row >= rows) return null;
    return row * columns + col;
  }, [columns, rows, cellW, cellH, gridH]);

  // ── Add panel to current port ─────────────────────────────────────────────
  function addPanelToPort(panelIdx: number, e?: { clientX: number; clientY: number }) {
    if (routingMode !== "data") return;
    const portKey = String(activePort);

    // Already assigned to this port?
    const existingPort = panelToPort[panelIdx];
    if (existingPort === activePort) return;

    // Check capacity
    const currentSeq = dataPortSequences[portKey] ?? [];
    if (currentSeq.length >= panelsPerPort) {
      setPortFullWarning(activePort);
      if (e) setPortFullPos({ x: e.clientX, y: e.clientY });
      setTimeout(() => setPortFullWarning(null), 1200);
      return;
    }

    // Build new sequences
    const newSeqs = { ...dataPortSequences };

    // Remove from old port if different
    if (existingPort !== undefined) {
      const oldKey = String(existingPort);
      newSeqs[oldKey] = (newSeqs[oldKey] ?? []).filter((i) => i !== panelIdx);
      setFlashPanel(panelIdx);
      setTimeout(() => setFlashPanel(null), 300);
    }

    // Add to new port
    if (!newSeqs[portKey]) newSeqs[portKey] = [];
    if (!newSeqs[portKey].includes(panelIdx)) {
      newSeqs[portKey] = [...newSeqs[portKey], panelIdx];
    }

    onDataPortSequencesChange(newSeqs);
  }

  // ── Add panel to current power chain ─────────────────────────────────────
  function addPanelToChain(panelIdx: number, e?: { clientX: number; clientY: number }) {
    if (routingMode !== "power") return;
    const chainKey = String(activeChain);
    const panelsPerChain = Math.floor(powerMaxWatts / panelPowerW);

    const existingChain = panelToChain[panelIdx];
    if (existingChain === activeChain) return;

    const currentSeq = powerChainSequences[chainKey] ?? [];
    if (currentSeq.length >= panelsPerChain) {
      setPortFullWarning(activeChain);
      if (e) setPortFullPos({ x: e.clientX, y: e.clientY });
      setTimeout(() => setPortFullWarning(null), 1200);
      return;
    }

    const newSeqs = { ...powerChainSequences };

    if (existingChain !== undefined) {
      const oldKey = String(existingChain);
      newSeqs[oldKey] = (newSeqs[oldKey] ?? []).filter((i) => i !== panelIdx);
      setFlashPanel(panelIdx);
      setTimeout(() => setFlashPanel(null), 300);
    }

    if (!newSeqs[chainKey]) newSeqs[chainKey] = [];
    if (!newSeqs[chainKey].includes(panelIdx)) {
      newSeqs[chainKey] = [...newSeqs[chainKey], panelIdx];
    }

    onPowerChainSequencesChange(newSeqs);
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (routingMode !== "data" && routingMode !== "power") return;
    const idx = clientToPanel(e);
    if (idx === null) return;
    setIsDragging(true);
    setLastTouchedPanel(idx);
    if (routingMode === "data") addPanelToPort(idx, e);
    else addPanelToChain(idx, e);
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!isDragging || (routingMode !== "data" && routingMode !== "power")) return;
    const idx = clientToPanel(e);
    if (idx === null || idx === lastTouchedPanel) return;
    setLastTouchedPanel(idx);
    if (routingMode === "data") addPanelToPort(idx, e);
    else addPanelToChain(idx, e);
  }

  function handleMouseUp() {
    setIsDragging(false);
    setLastTouchedPanel(null);
  }

  // Touch handlers
  function handleTouchStart(e: React.TouchEvent<SVGSVGElement>) {
    if (routingMode !== "data" && routingMode !== "power") return;
    e.preventDefault();
    const t = e.touches[0];
    const idx = clientToPanel(t);
    if (idx === null) return;
    setIsDragging(true);
    setLastTouchedPanel(idx);
    if (routingMode === "data") addPanelToPort(idx, t);
    else addPanelToChain(idx, t);
  }

  function handleTouchMove(e: React.TouchEvent<SVGSVGElement>) {
    if (!isDragging || (routingMode !== "data" && routingMode !== "power")) return;
    e.preventDefault();
    const t = e.touches[0];
    const idx = clientToPanel(t);
    if (idx === null || idx === lastTouchedPanel) return;
    setLastTouchedPanel(idx);
    if (routingMode === "data") addPanelToPort(idx, t);
    else addPanelToChain(idx, t);
  }

  function handleTouchEnd() {
    setIsDragging(false);
    setLastTouchedPanel(null);
  }

  // Global mouseup (in case user releases outside SVG)
  useEffect(() => {
    function onWindowMouseUp() {
      if (isDraggingRef.current) {
        setIsDragging(false);
        setLastTouchedPanel(null);
      }
    }
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => window.removeEventListener("mouseup", onWindowMouseUp);
  }, []);

  // ── Auto-assignment algorithms ────────────────────────────────────────────

  // Full-wall reading order based on cable entry side.
  // Bottom/Top: row-major serpentine. Left/Right: column-major serpentine.
  // Starting corner is always the entry side, so every port's first panel
  // appears at that edge.
  function serpentineForEntry(entry: EntryEdge): number[] {
    const order: number[] = [];
    if (entry === "top") {
      for (let r = 0; r < rows; r++) {
        if (r % 2 === 0) for (let c = 0; c < columns; c++) order.push(r * columns + c);
        else for (let c = columns - 1; c >= 0; c--) order.push(r * columns + c);
      }
    } else if (entry === "bottom") {
      for (let r = rows - 1; r >= 0; r--) {
        const ri = rows - 1 - r;
        if (ri % 2 === 0) for (let c = 0; c < columns; c++) order.push(r * columns + c);
        else for (let c = columns - 1; c >= 0; c--) order.push(r * columns + c);
      }
    } else if (entry === "left") {
      for (let c = 0; c < columns; c++) {
        if (c % 2 === 0) for (let r = 0; r < rows; r++) order.push(r * columns + c);
        else for (let r = rows - 1; r >= 0; r--) order.push(r * columns + c);
      }
    } else {
      for (let c = columns - 1; c >= 0; c--) {
        const ci = columns - 1 - c;
        if (ci % 2 === 0) for (let r = 0; r < rows; r++) order.push(r * columns + c);
        else for (let r = rows - 1; r >= 0; r--) order.push(r * columns + c);
      }
    }
    return order;
  }

  // Balanced serpentine chunks — all ports start from the entry side
  function autoEvenSplit(): Record<string, number[]> {
    const total = columns * rows;
    const use = Math.min(numPorts, Math.max(Math.ceil(total / panelsPerPort), numPorts));
    const base = Math.floor(total / use);
    const extra = total % use;
    const order = serpentineForEntry(cableEntry);
    const seqs: Record<string, number[]> = {};
    let idx = 0;
    for (let p = 1; p <= use; p++) {
      seqs[String(p)] = order.slice(idx, idx + base + (p <= extra ? 1 : 0));
      idx += seqs[String(p)].length;
    }
    return seqs;
  }

  // Whole rows per port — each port starts from the entry-side row of its strip
  function autoRowAligned(): Record<string, number[]> {
    const seqs: Record<string, number[]> = {};
    // Row reading order: bottom-up for bottom entry, top-down otherwise
    const orderedRows = cableEntry === "bottom"
      ? Array.from({ length: rows }, (_, i) => rows - 1 - i)
      : Array.from({ length: rows }, (_, i) => i);

    // Within each port, serpentine across the port's rows (resets direction per port)
    function portPanels(portRows: number[]): number[] {
      const panels: number[] = [];
      portRows.forEach((r, idx) => {
        const ltr = cableEntry === "right" ? idx % 2 !== 0 : idx % 2 === 0;
        if (ltr) for (let c = 0; c < columns; c++) panels.push(r * columns + c);
        else for (let c = columns - 1; c >= 0; c--) panels.push(r * columns + c);
      });
      return panels;
    }

    if (orderedRows.length <= numPorts) {
      orderedRows.forEach((r, i) => { seqs[String(i + 1)] = portPanels([r]); });
    } else {
      const base = Math.floor(rows / numPorts);
      const extra = rows % numPorts;
      let ri = 0;
      for (let p = 1; p <= numPorts; p++) {
        const nr = base + (p <= extra ? 1 : 0);
        seqs[String(p)] = portPanels(orderedRows.slice(ri, ri + nr));
        ri += nr;
      }
    }
    return seqs;
  }

  // Whole columns per port — each port starts from the entry-side row of its column group
  function autoColumnAligned(): Record<string, number[]> {
    const seqs: Record<string, number[]> = {};
    const use = Math.min(numPorts, columns);
    const base = Math.floor(columns / use);
    const extra = columns % use;
    // Column reading order: right-to-left for right entry, left-to-right otherwise
    const orderedCols = cableEntry === "right"
      ? Array.from({ length: columns }, (_, i) => columns - 1 - i)
      : Array.from({ length: columns }, (_, i) => i);

    // Within each port, serpentine through columns starting from the entry row
    function portPanels(portCols: number[]): number[] {
      const panels: number[] = [];
      portCols.forEach((col, idx) => {
        // bottom → first col goes up (rows-1 → 0), alternates
        // top    → first col goes down (0 → rows-1), alternates
        // left/right → first col goes down, alternates
        const goUp = cableEntry === "bottom" ? idx % 2 === 0 : idx % 2 !== 0;
        if (goUp) for (let r = rows - 1; r >= 0; r--) panels.push(r * columns + col);
        else for (let r = 0; r < rows; r++) panels.push(r * columns + col);
      });
      return panels;
    }

    let ci = 0;
    for (let p = 1; p <= use; p++) {
      const nc = base + (p <= extra ? 1 : 0);
      seqs[String(p)] = portPanels(orderedCols.slice(ci, ci + nc));
      ci += nc;
    }
    return seqs;
  }

  // Fills each port to max capacity — uses fewest ports, all starting from entry side
  function autoMinimumPorts(): Record<string, number[]> {
    const order = serpentineForEntry(cableEntry);
    const seqs: Record<string, number[]> = {};
    let port = 1;
    for (const idx of order) {
      if (port > numPorts) break;
      while (port <= numPorts) {
        const k = String(port);
        if (!seqs[k]) seqs[k] = [];
        if (seqs[k].length < panelsPerPort) { seqs[k].push(idx); break; }
        port++;
      }
    }
    return seqs;
  }

  // Auto-assign power chains using entry-aware serpentine
  function autoPowerSerpentine(): Record<string, number[]> {
    const panelsPerChain = Math.max(1, Math.floor(powerMaxWatts / panelPowerW));
    const total = columns * rows;
    const chainsNeeded = Math.ceil(total / panelsPerChain);
    const base = Math.floor(total / chainsNeeded);
    const extra = total % chainsNeeded;
    const order = serpentineForEntry(cableEntry);
    const seqs: Record<string, number[]> = {};
    let idx = 0;
    for (let ch = 1; ch <= chainsNeeded; ch++) {
      seqs[String(ch)] = order.slice(idx, idx + base + (ch <= extra ? 1 : 0));
      idx += seqs[String(ch)].length;
    }
    if (chainsNeeded > numChains) setNumChains(chainsNeeded);
    return seqs;
  }

  // ── Render cable lines for a set of sequences ────────────────────────────
  function renderCableLines(
    sequences: Record<string, number[]>,
    colors: string[],
    markerId: string
  ) {
    return Object.entries(sequences).flatMap(([key, indices]) => {
      const num = parseInt(key, 10);
      const color = colors[(num - 1) % colors.length];
      if (indices.length < 2) return [];

      const points = indices.map((idx) => panelCenter(idx));
      const d = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.cx} ${p.cy}`)
        .join(" ");

      return [
        <path
          key={`line-${key}`}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeOpacity={0.8}
          markerEnd={`url(#${markerId}-${num})`}
        />,
      ];
    });
  }

  // ── Render numbered circle at first panel of each sequence ───────────────
  function renderFirstPanelMarkers(
    sequences: Record<string, number[]>,
    colors: string[]
  ) {
    return Object.entries(sequences).flatMap(([key, indices]) => {
      if (indices.length === 0) return [];
      const num = parseInt(key, 10);
      const color = colors[(num - 1) % colors.length];
      const { cx, cy } = panelCenter(indices[0]);
      const r = Math.min(cellW, cellH) * 0.22;
      return [
        <circle key={`marker-${key}`} cx={cx} cy={cy} r={r} fill={color} />,
        <text
          key={`marker-text-${key}`}
          x={cx} y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={r * 1.1}
          fontFamily="system-ui,sans-serif"
          fontWeight="700"
          fill="white"
        >
          {num}
        </text>,
      ];
    });
  }

  // ── SVG arrow markers ─────────────────────────────────────────────────────
  function renderMarkers(sequences: Record<string, number[]>, colors: string[], markerId: string) {
    return Object.entries(sequences).map(([key]) => {
      const num = parseInt(key, 10);
      const color = colors[(num - 1) % colors.length];
      return (
        <marker
          key={`marker-def-${markerId}-${num}`}
          id={`${markerId}-${num}`}
          markerWidth={6}
          markerHeight={6}
          refX={5}
          refY={3}
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 z" fill={color} fillOpacity={0.8} />
        </marker>
      );
    });
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  const assignedDataPanels = Object.values(dataPortSequences).flat().length;
  const unassignedDataPanels = activePanels - assignedDataPanels;
  const totalDataCapacity = numPorts * panelsPerPort;

  const assignedChainPanels = Object.values(powerChainSequences).flat().length;
  const totalChainWatts = assignedChainPanels * panelPowerW;

  return (
    <div className="space-y-3">
      {/* ── Mode toggle ──────────────────────────────────────────────────── */}
      <div className="flex gap-1">
        {(["layout", "data", "power"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
              routingMode === m
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {m === "layout" ? "Layout" : m === "data" ? "Data routing" : "Power routing"}
          </button>
        ))}
      </div>

      {/* ── Cable entry side selector (data + power modes) ───────────────── */}
      {(routingMode === "data" || routingMode === "power") && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400">Cable entry:</span>
          {([
            { edge: "bottom" as EntryEdge, label: "↑ Bottom", title: "Processor at floor — cables enter from below (default for most installs)" },
            { edge: "top"    as EntryEdge, label: "↓ Top",    title: "Processor above wall — cables enter from above (ceiling-flown installs)" },
            { edge: "left"   as EntryEdge, label: "→ Left",   title: "Processor to the left — cables enter from the left side" },
            { edge: "right"  as EntryEdge, label: "← Right",  title: "Processor to the right — cables enter from the right side" },
          ]).map(({ edge, label, title }) => (
            <button
              key={edge}
              title={title}
              onClick={() => onCableEntryChange(edge)}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                cableEntry === edge
                  ? "bg-red-600 text-white font-medium"
                  : "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Port selector (data mode) ─────────────────────────────────────── */}
      {routingMode === "data" && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400">Port:</span>
          {Array.from({ length: numPorts }, (_, i) => i + 1).map((p) => {
            const color = PORT_COLORS[(p - 1) % PORT_COLORS.length];
            return (
              <button
                key={p}
                onClick={() => setActivePort(p)}
                style={{
                  backgroundColor: color,
                  outline: activePort === p ? `2px solid white` : undefined,
                  outlineOffset: activePort === p ? "2px" : undefined,
                  boxShadow: activePort === p ? `0 0 0 3px ${color}` : undefined,
                }}
                className="w-7 h-7 rounded text-white text-xs font-bold transition-all"
              >
                {p}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Chain selector (power mode) ──────────────────────────────────── */}
      {routingMode === "power" && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400">Chain:</span>
          {Array.from({ length: numChains }, (_, i) => i + 1).map((ch) => {
            const color = CHAIN_COLORS[(ch - 1) % CHAIN_COLORS.length];
            return (
              <button
                key={ch}
                onClick={() => setActiveChain(ch)}
                style={{
                  backgroundColor: color,
                  outline: activeChain === ch ? `2px solid white` : undefined,
                  outlineOffset: activeChain === ch ? "2px" : undefined,
                  boxShadow: activeChain === ch ? `0 0 0 3px ${color}` : undefined,
                }}
                className="w-7 h-7 rounded text-white text-xs font-bold transition-all"
              >
                {ch}
              </button>
            );
          })}
          <button
            onClick={() => setNumChains((n) => n + 1)}
            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            +Add chain
          </button>
        </div>
      )}

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      {routingMode === "data" && (
        <div className="flex gap-1.5 flex-wrap items-center">
          <button
            onClick={() => onDataPortSequencesChange({})}
            className="text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Clear
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500">Auto:</span>
          <button
            title="Row strips — one port per row (or grouped rows). Clean horizontal cable runs. Best for most installs. May leave ports unused if there are fewer rows than ports."
            onClick={() => onDataPortSequencesChange(autoRowAligned())}
            className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium"
          >
            Row strips
          </button>
          <button
            title="Even split — balanced panel count across all ports, may cross row boundaries. Use when you need all ports loaded equally."
            onClick={() => onDataPortSequencesChange(autoEvenSplit())}
            className="text-xs px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
          >
            Even split
          </button>
          <button
            title="Column strips — one port per column (or grouped columns). Useful for tall narrow walls or when the processor is positioned to one side."
            onClick={() => onDataPortSequencesChange(autoColumnAligned())}
            className="text-xs px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
          >
            Col strips
          </button>
          <button
            title="Min ports — fills each port to maximum capacity before starting the next. Leaves ports free for future expansion or redundancy."
            onClick={() => onDataPortSequencesChange(autoMinimumPorts())}
            className="text-xs px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
          >
            Min ports
          </button>
        </div>
      )}

      {routingMode === "power" && (
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => onPowerChainSequencesChange({})}
            className="text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Clear
          </button>
          <button
            title="Auto-assign power chains using entry-aware serpentine. Distributes panels evenly across chains within the wattage budget."
            onClick={() => onPowerChainSequencesChange(autoPowerSerpentine())}
            className="text-xs px-3 py-1.5 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            Auto chains
          </button>
        </div>
      )}

      {/* ── SVG grid ──────────────────────────────────────────────────────── */}
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${totalW} ${totalH}`}
          className="w-full h-auto select-none"
          aria-label="Cable routing grid"
          style={{
            maxHeight: 520,
            cursor: (routingMode === "data" || routingMode === "power") ? (isDragging ? "crosshair" : "pointer") : "default",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <defs>
            {renderMarkers(dataPortSequences, PORT_COLORS, "port-arrow")}
            {renderMarkers(powerChainSequences, CHAIN_COLORS, "chain-arrow")}
            <style>{`
              @keyframes panel-flash {
                0%   { opacity: 0.8; }
                100% { opacity: 0; }
              }
              .panel-flash-rect {
                animation: panel-flash 0.3s ease-out forwards;
              }
            `}</style>
          </defs>

          {/* ── Panel cells ───────────────────────────────────────────── */}
          {Array.from({ length: rows }, (_, r) =>
            Array.from({ length: columns }, (_, c) => {
              const idx = r * columns + c;
              let fill = "#EBF0F8";

              if (routingMode === "data") {
                const assignedPort = panelToPort[idx];
                if (assignedPort !== undefined) {
                  const color = PORT_COLORS[(assignedPort - 1) % PORT_COLORS.length];
                  fill = hexToRgba(color, 0.25);
                } else {
                  fill = "#E2E8F0";
                }
              } else if (routingMode === "power") {
                const assignedChain = panelToChain[idx];
                if (assignedChain !== undefined) {
                  const color = CHAIN_COLORS[(assignedChain - 1) % CHAIN_COLORS.length];
                  fill = hexToRgba(color, 0.25);
                } else {
                  fill = "#E2E8F0";
                }
              }

              return (
                <rect
                  key={idx}
                  x={gx + c * cellW}
                  y={gy + r * cellH}
                  width={cellW}
                  height={cellH}
                  fill={fill}
                  stroke={PANEL_STROKE}
                  strokeWidth={0.75}
                />
              );
            })
          )}

          {/* ── Grid outer border ─────────────────────────────────────── */}
          <rect
            x={gx} y={gy}
            width={GRID_W} height={gridH}
            fill="none"
            stroke={GRID_BORDER}
            strokeWidth={1}
          />

          {/* ── FRONT VIEW label ──────────────────────────────────────── */}
          <text x={gx + 6} y={gy + 14} fontSize={8} fontFamily="system-ui,sans-serif"
            fill="#94A3B8" letterSpacing={0.5}>FRONT VIEW</text>

          {/* ── Cable lines ───────────────────────────────────────────── */}
          {routingMode === "data" && renderCableLines(dataPortSequences, PORT_COLORS, "port-arrow")}
          {routingMode === "power" && renderCableLines(powerChainSequences, CHAIN_COLORS, "chain-arrow")}

          {/* ── First-panel numbered circles ──────────────────────────── */}
          {routingMode === "data" && renderFirstPanelMarkers(dataPortSequences, PORT_COLORS)}
          {routingMode === "power" && renderFirstPanelMarkers(powerChainSequences, CHAIN_COLORS)}

          {/* ── Flash overlay ─────────────────────────────────────────── */}
          {flashPanel !== null && (() => {
            const col = flashPanel % columns;
            const row = Math.floor(flashPanel / columns);
            return (
              <rect
                className="panel-flash-rect"
                x={gx + col * cellW}
                y={gy + row * cellH}
                width={cellW}
                height={cellH}
                fill="white"
                style={{ pointerEvents: "none" }}
              />
            );
          })()}

          {/* ── Width callout ─────────────────────────────────────────── */}
          <line x1={gx} y1={widthLineY - TICK_HALF} x2={gx} y2={widthLineY + TICK_HALF}
            stroke={CALLOUT_COLOR} strokeWidth={1.5} />
          <line x1={gx + GRID_W} y1={widthLineY - TICK_HALF} x2={gx + GRID_W} y2={widthLineY + TICK_HALF}
            stroke={CALLOUT_COLOR} strokeWidth={1.5} />
          <line x1={gx} y1={widthLineY} x2={gx + GRID_W} y2={widthLineY}
            stroke={CALLOUT_COLOR} strokeWidth={1.5} />
          <text
            x={gx + GRID_W / 2} y={widthLineY - LABEL_GAP}
            textAnchor="middle"
            fontSize={11} fontFamily="system-ui,sans-serif" fontWeight="600"
            fill={CALLOUT_COLOR}
          >
            {`${widthM.toFixed(3)} m`}
          </text>

          {/* ── Height callout ────────────────────────────────────────── */}
          <line x1={heightLineX - 8} y1={gy} x2={heightLineX + 8} y2={gy}
            stroke={CALLOUT_COLOR} strokeWidth={1.5} />
          <line x1={heightLineX - 8} y1={gy + gridH} x2={heightLineX + 8} y2={gy + gridH}
            stroke={CALLOUT_COLOR} strokeWidth={1.5} />
          <line x1={heightLineX} y1={gy} x2={heightLineX} y2={gy + gridH}
            stroke={CALLOUT_COLOR} strokeWidth={1.5} />
          <text
            x={heightLineX + LABEL_GAP} y={gy + gridH / 2}
            textAnchor="start" dominantBaseline="middle"
            fontSize={11} fontFamily="system-ui,sans-serif" fontWeight="600"
            fill={CALLOUT_COLOR}
          >
            {`${heightM.toFixed(3)} m`}
          </text>

          {/* ── Cable entry indicator ─────────────────────────────── */}
          {(routingMode === "data" || routingMode === "power") && (() => {
            const EC = CALLOUT_COLOR;
            const entryLabels: Record<EntryEdge, string> = {
              bottom: "↑ CABLE ENTRY — BOTTOM",
              top:    "↓ CABLE ENTRY — TOP",
              left:   "→ CABLE ENTRY — LEFT",
              right:  "← CABLE ENTRY — RIGHT",
            };
            // Colored stripe at the entry edge of the grid
            const stripe = {
              bottom: <rect key="es" x={gx} y={gy + gridH - 3} width={GRID_W} height={3} fill={EC} opacity={0.45} />,
              top:    <rect key="es" x={gx} y={gy} width={GRID_W} height={3} fill={EC} opacity={0.45} />,
              left:   <rect key="es" x={gx} y={gy} width={3} height={gridH} fill={EC} opacity={0.45} />,
              right:  <rect key="es" x={gx + GRID_W - 3} y={gy} width={3} height={gridH} fill={EC} opacity={0.45} />,
            }[cableEntry];
            return (
              <>
                {stripe}
                <text
                  x={gx + GRID_W / 2} y={gy + gridH + 13}
                  textAnchor="middle" fontSize={8} fontFamily="system-ui,sans-serif"
                  fontWeight="600" fill={EC}
                >
                  {entryLabels[cableEntry]}
                </text>
              </>
            );
          })()}

          {/* ── Caption ───────────────────────────────────────────────── */}
          <text
            x={gx} y={gy + gridH + 30}
            fontSize={10} fontFamily="system-ui,sans-serif"
            fill={CAPTION_COLOR}
          >
            {`${columns} × ${rows} panels  ·  ${panelWidthMm} × ${panelHeightMm} mm per panel  ·  ${pixelPitch}  ·  ${activePanels} panels total`}
          </text>
        </svg>

        {/* ── Port/chain-full warning tooltip ─────────────────────── */}
        {portFullWarning !== null && portFullPos !== null && (
          <div
            className="fixed z-50 pointer-events-none bg-amber-100 dark:bg-amber-900 border border-amber-400 text-amber-800 dark:text-amber-200 text-xs px-2 py-1 rounded shadow"
            style={{ left: portFullPos.x + 12, top: portFullPos.y - 24 }}
          >
            {routingMode === "power"
              ? `Chain ${portFullWarning} full (${Math.floor(powerMaxWatts / panelPowerW)} panels max)`
              : `Port ${portFullWarning} full (${panelsPerPort} panels max)`}
          </div>
        )}
      </div>

      {/* ── Port summary (data mode) ──────────────────────────────────────── */}
      {routingMode === "data" && (
        <div className="text-xs space-y-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          {Array.from({ length: numPorts }, (_, i) => i + 1).map((p) => {
            const color = PORT_COLORS[(p - 1) % PORT_COLORS.length];
            const count = (dataPortSequences[String(p)] ?? []).length;
            const overLimit = count > panelsPerPort;
            return (
              <div key={p} className="flex items-center gap-2">
                <span style={{ color }} className="font-bold text-base leading-none">●</span>
                <span className={overLimit ? "text-amber-600 dark:text-amber-400 font-medium" : "text-gray-700 dark:text-gray-300"}>
                  Port {p}: {count} panels
                  {overLimit && " ⚠ over limit"}
                </span>
              </div>
            );
          })}
          <div className="pt-1 border-t border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
            Total: {assignedDataPanels} / {totalDataCapacity} assigned · {unassignedDataPanels} unassigned
          </div>
        </div>
      )}

      {/* ── Chain summary (power mode) ────────────────────────────────────── */}
      {routingMode === "power" && (
        <div className="text-xs space-y-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
          {Array.from({ length: numChains }, (_, i) => i + 1).map((ch) => {
            const color = CHAIN_COLORS[(ch - 1) % CHAIN_COLORS.length];
            const count = (powerChainSequences[String(ch)] ?? []).length;
            const watts = count * panelPowerW;
            return (
              <div key={ch} className="flex items-center gap-2">
                <span style={{ color }} className="font-bold text-base leading-none">●</span>
                <span className="text-gray-700 dark:text-gray-300">
                  Chain {ch}: {count} panels · {watts} W
                </span>
              </div>
            );
          })}
          <div className="pt-1 border-t border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
            Total: {assignedChainPanels} panels · {totalChainWatts} W
          </div>
        </div>
      )}
    </div>
  );
}
