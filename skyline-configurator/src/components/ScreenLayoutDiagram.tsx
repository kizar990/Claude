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
}

const CALLOUT_COLOR = "#D63025";
const PANEL_FILL   = "#EBF0F8";
const BLANK_FILL   = "#E2E8F0";
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
}: Props) {
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

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="w-full h-auto"
      aria-label="Screen layout diagram"
      style={{ maxHeight: 480 }}
    >
      {/* ── Panel cells ───────────────────────────────── */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: columns }, (_, c) => {
          const idx = r * columns + c;
          const isBlank = blankIndices?.has(idx);
          return (
            <rect
              key={idx}
              x={gx + c * cellW}
              y={gy + r * cellH}
              width={cellW}
              height={cellH}
              fill={isBlank ? BLANK_FILL : PANEL_FILL}
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
