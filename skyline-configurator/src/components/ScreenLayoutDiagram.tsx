import { useRef, useState, useEffect } from "react";

interface Props {
  columns: number;
  rows: number;
  widthM: number;
  heightM: number;
  panelWidthMm: number;
  panelHeightMm: number;
  pixelPitch: string;
  activePanels: number;
  // Optional: set of flat panel indices (row*cols+col) that are blank
  blankIndices?: Set<number>;
  // Optional: port assignments — flat index → port number (1-based, 0 = unassigned)
  // Reserved for Phase 2; ignored here
  portMap?: number[];
  // Blank cell editing
  blankCells?: number[];
  isEditing?: boolean;
  onToggleBlank?: (idx: number) => void;
}

const CALLOUT_COLOR = "#D63025";
const PANEL_FILL   = "#EBF0F8";
const PANEL_STROKE = "#B8C8DC";
const GRID_BORDER  = "#8BA3C0";
const CAPTION_COLOR = "#718096";

// Layout geometry (all in SVG user units)
const GRID_W      = 540;   // fixed width; viewBox scales responsively
const CALLOUT_TOP = 46;    // vertical room above grid for width callout
const CALLOUT_R   = 80;    // horizontal room right of grid for height callout
const CAPTION_H   = 26;    // room below grid for caption text
const TICK_HALF   = 7;     // half-length of dimension end-ticks
const LABEL_GAP   = 11;    // pixels between callout line and label text

export function ScreenLayoutDiagram({
  columns,
  rows,
  widthM,
  heightM,
  panelWidthMm,
  panelHeightMm,
  pixelPitch,
  activePanels,
  blankIndices,
  blankCells,
  isEditing,
  onToggleBlank,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragMode, setDragMode] = useState<"blank" | "activate" | null>(null);
  const lastDragIdx = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    function endDrag() {
      isDragging.current = false;
      setDragMode(null);
      lastDragIdx.current = null;
    }
    window.addEventListener("mouseup", endDrag);
    return () => window.removeEventListener("mouseup", endDrag);
  }, []);

  if (columns <= 0 || rows <= 0) return null;

  // Panels are physically square — cell width = cell height in SVG units
  const cellW = GRID_W / columns;
  const cellH = cellW; // preserves square panels regardless of grid shape
  const gridH = cellH * rows;

  const totalW = GRID_W + CALLOUT_R;
  const totalH = CALLOUT_TOP + gridH + CAPTION_H;

  // Grid top-left
  const gx = 0;
  const gy = CALLOUT_TOP;

  // Callout positions
  const widthLineY  = gy - CALLOUT_TOP / 2;
  const heightLineX = gx + GRID_W + 22;

  const wLabel = `${widthM.toFixed(3)} m`;
  const hLabel = `${heightM.toFixed(3)} m`;

  function clientToPanel(e: { clientX: number; clientY: number }): number | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const { x: vx, y: vy } = pt.matrixTransform(ctm.inverse());
    if (vx < 0 || vx >= GRID_W || vy < gy || vy >= gy + cellH * rows) return null;
    const col = Math.floor(vx / cellW);
    const row = Math.floor((vy - gy) / cellH);
    if (col < 0 || col >= columns || row < 0 || row >= rows) return null;
    return row * columns + col;
  }

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (!isEditing || !onToggleBlank) return;
    const idx = clientToPanel(e);
    if (idx === null) return;
    const isBlank = (blankCells ?? []).includes(idx);
    const mode: "blank" | "activate" = isBlank ? "activate" : "blank";
    setDragMode(mode);
    isDragging.current = true;
    lastDragIdx.current = idx;
    onToggleBlank(idx);
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!isDragging.current || !dragMode || !onToggleBlank) return;
    const idx = clientToPanel(e);
    if (idx === null || idx === lastDragIdx.current) return;
    lastDragIdx.current = idx;
    const isBlank = (blankCells ?? []).includes(idx);
    if (dragMode === "blank" && !isBlank) onToggleBlank(idx);
    if (dragMode === "activate" && isBlank) onToggleBlank(idx);
  }

  function handleMouseLeave() {
    isDragging.current = false;
    setDragMode(null);
    lastDragIdx.current = null;
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="w-full h-auto"
      aria-label="Screen layout diagram"
      style={{
        maxHeight: 480,
        cursor: isEditing ? "crosshair" : undefined,
        userSelect: isEditing ? "none" : undefined,
      }}
      onMouseDown={isEditing ? handleMouseDown : undefined}
      onMouseMove={isEditing ? handleMouseMove : undefined}
      onMouseLeave={isEditing ? handleMouseLeave : undefined}
    >
      <defs>
        <pattern id="sld-blank-hatch" patternUnits="userSpaceOnUse" width={6} height={6} patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={6} stroke="#94a3b8" strokeWidth={2} />
        </pattern>
      </defs>

      {/* ── Panel cells ───────────────────────────────── */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: columns }, (_, c) => {
          const idx = r * columns + c;
          const isBlankByIndices = blankIndices?.has(idx);
          const isBlankByArray = (blankCells ?? []).includes(idx);
          const isBlank = isBlankByIndices || isBlankByArray;
          if (isBlank) {
            return (
              <g key={idx}>
                <rect
                  x={gx + c * cellW}
                  y={gy + r * cellH}
                  width={cellW}
                  height={cellH}
                  fill="#CBD5E1"
                  stroke={PANEL_STROKE}
                  strokeWidth={0.75}
                />
                <rect
                  x={gx + c * cellW}
                  y={gy + r * cellH}
                  width={cellW}
                  height={cellH}
                  fill="url(#sld-blank-hatch)"
                  opacity={0.5}
                />
              </g>
            );
          }
          return (
            <rect
              key={idx}
              x={gx + c * cellW}
              y={gy + r * cellH}
              width={cellW}
              height={cellH}
              fill={PANEL_FILL}
              stroke={PANEL_STROKE}
              strokeWidth={0.75}
            />
          );
        })
      )}

      {/* ── Grid outer border ─────────────────────────── */}
      <rect
        x={gx} y={gy}
        width={GRID_W} height={gridH}
        fill="none"
        stroke={GRID_BORDER}
        strokeWidth={1}
      />

      {/* ── Front view label ──────────────────────────── */}
      <text x={gx+6} y={gy+14} fontSize={8} fontFamily="system-ui,sans-serif"
            fill="#94A3B8" letterSpacing={0.5}>FRONT VIEW</text>

      {/* ── Width callout ─────────────────────────────── */}
      {/* Left tick */}
      <line x1={gx} y1={widthLineY - TICK_HALF} x2={gx} y2={widthLineY + TICK_HALF}
        stroke={CALLOUT_COLOR} strokeWidth={1.5} />
      {/* Right tick */}
      <line x1={gx + GRID_W} y1={widthLineY - TICK_HALF} x2={gx + GRID_W} y2={widthLineY + TICK_HALF}
        stroke={CALLOUT_COLOR} strokeWidth={1.5} />
      {/* Horizontal span */}
      <line x1={gx} y1={widthLineY} x2={gx + GRID_W} y2={widthLineY}
        stroke={CALLOUT_COLOR} strokeWidth={1.5} />
      {/* Label */}
      <text
        x={gx + GRID_W / 2} y={widthLineY - LABEL_GAP}
        textAnchor="middle"
        fontSize={11} fontFamily="system-ui,sans-serif" fontWeight="600"
        fill={CALLOUT_COLOR}
      >
        {wLabel}
      </text>

      {/* ── Height callout ────────────────────────────── */}
      {/* Top tick */}
      <line x1={heightLineX - 8} y1={gy} x2={heightLineX + 8} y2={gy}
        stroke={CALLOUT_COLOR} strokeWidth={1.5} />
      {/* Bottom tick */}
      <line x1={heightLineX - 8} y1={gy + gridH} x2={heightLineX + 8} y2={gy + gridH}
        stroke={CALLOUT_COLOR} strokeWidth={1.5} />
      {/* Vertical span */}
      <line x1={heightLineX} y1={gy} x2={heightLineX} y2={gy + gridH}
        stroke={CALLOUT_COLOR} strokeWidth={1.5} />
      {/* Label */}
      <text
        x={heightLineX + LABEL_GAP} y={gy + gridH / 2}
        textAnchor="start" dominantBaseline="middle"
        fontSize={11} fontFamily="system-ui,sans-serif" fontWeight="600"
        fill={CALLOUT_COLOR}
      >
        {hLabel}
      </text>

      {/* ── Caption ───────────────────────────────────── */}
      <text
        x={gx} y={gy + gridH + 18}
        fontSize={10} fontFamily="system-ui,sans-serif"
        fill={CAPTION_COLOR}
      >
        {`${columns} × ${rows} panels  ·  ${panelWidthMm} × ${panelHeightMm} mm per panel  ·  ${pixelPitch}  ·  ${activePanels} panels total`}
      </text>
    </svg>
  );
}
