interface Props {
  columns: number;
  rows: number;
  widthM: number;
  heightM: number;
  panelWidthMm: number;
  panelHeightMm: number;
  pixelPitch: string;
  activePanels: number;
}

const ORANGE = "#C0392B";
const PANEL_FILL = "#EBF0F8";
const PANEL_STROKE = "#B8C8DC";
const LABEL_COLOR = "#1A202C";
const CAPTION_COLOR = "#718096";

export function ScreenLayoutDiagram({
  columns,
  rows,
  widthM,
  heightM,
  panelWidthMm,
  panelHeightMm,
  pixelPitch,
  activePanels,
}: Props) {
  if (columns <= 0 || rows <= 0) return null;

  // Layout constants (in SVG user units)
  const CALLOUT_TOP = 44;    // space above grid for width callout
  const CALLOUT_RIGHT = 72;  // space right of grid for height callout
  const TICK = 7;            // half-length of end ticks
  const LABEL_GAP = 12;      // label offset from callout line
  const CAPTION_H = 28;      // space below grid for caption

  // Grid dimensions — maintain physical aspect ratio, cap height
  const MAX_GRID_W = 520;
  const aspectRatio = (columns * panelWidthMm) / (rows * panelHeightMm);
  const gridW = MAX_GRID_W;
  const gridH = Math.round(gridW / aspectRatio);

  const cellW = gridW / columns;
  const cellH = gridH / rows;

  const totalW = gridW + CALLOUT_RIGHT;
  const totalH = CALLOUT_TOP + gridH + CAPTION_H;

  // Grid origin
  const gx = 0;
  const gy = CALLOUT_TOP;

  const wLabel = `${widthM.toFixed(3)} m`;
  const hLabel = `${heightM.toFixed(3)} m`;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="w-full h-auto"
      aria-label="Screen layout diagram"
    >
      {/* ── Panel grid ──────────────────────────────────── */}
      <rect x={gx} y={gy} width={gridW} height={gridH} fill={PANEL_FILL} stroke={PANEL_STROKE} strokeWidth={0.5} />
      {/* Vertical dividers */}
      {Array.from({ length: columns - 1 }, (_, i) => (
        <line
          key={`v${i}`}
          x1={gx + cellW * (i + 1)} y1={gy}
          x2={gx + cellW * (i + 1)} y2={gy + gridH}
          stroke={PANEL_STROKE} strokeWidth={0.75}
        />
      ))}
      {/* Horizontal dividers */}
      {Array.from({ length: rows - 1 }, (_, i) => (
        <line
          key={`h${i}`}
          x1={gx} y1={gy + cellH * (i + 1)}
          x2={gx + gridW} y2={gy + cellH * (i + 1)}
          stroke={PANEL_STROKE} strokeWidth={0.75}
        />
      ))}

      {/* ── Width callout ────────────────────────────────── */}
      {/* Left tick */}
      <line x1={gx} y1={gy - CALLOUT_TOP / 2 - TICK} x2={gx} y2={gy - CALLOUT_TOP / 2 + TICK} stroke={ORANGE} strokeWidth={1.5} />
      {/* Right tick */}
      <line x1={gx + gridW} y1={gy - CALLOUT_TOP / 2 - TICK} x2={gx + gridW} y2={gy - CALLOUT_TOP / 2 + TICK} stroke={ORANGE} strokeWidth={1.5} />
      {/* Horizontal line */}
      <line x1={gx} y1={gy - CALLOUT_TOP / 2} x2={gx + gridW} y2={gy - CALLOUT_TOP / 2} stroke={ORANGE} strokeWidth={1.5} />
      {/* Width label */}
      <text
        x={gx + gridW / 2}
        y={gy - CALLOUT_TOP / 2 - LABEL_GAP}
        textAnchor="middle"
        fontSize={11}
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        fill={ORANGE}
      >
        {wLabel}
      </text>

      {/* ── Height callout ───────────────────────────────── */}
      {/* Top tick */}
      <line x1={gx + gridW + 16} y1={gy} x2={gx + gridW + 32} y2={gy} stroke={ORANGE} strokeWidth={1.5} />
      {/* Bottom tick */}
      <line x1={gx + gridW + 16} y1={gy + gridH} x2={gx + gridW + 32} y2={gy + gridH} stroke={ORANGE} strokeWidth={1.5} />
      {/* Vertical line */}
      <line x1={gx + gridW + 24} y1={gy} x2={gx + gridW + 24} y2={gy + gridH} stroke={ORANGE} strokeWidth={1.5} />
      {/* Height label */}
      <text
        x={gx + gridW + 24 + LABEL_GAP}
        y={gy + gridH / 2}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={11}
        fontFamily="system-ui, sans-serif"
        fontWeight="600"
        fill={ORANGE}
      >
        {hLabel}
      </text>

      {/* ── Caption ─────────────────────────────────────── */}
      <text
        x={gx}
        y={gy + gridH + 18}
        fontSize={10}
        fontFamily="system-ui, sans-serif"
        fill={CAPTION_COLOR}
      >
        {`${columns} × ${rows} panels  ·  ${panelWidthMm} × ${panelHeightMm} mm per panel  ·  ${pixelPitch}  ·  ${activePanels} panels total`}
      </text>

      {/* ── Outer border ────────────────────────────────── */}
      <rect x={gx} y={gy} width={gridW} height={gridH} fill="none" stroke={LABEL_COLOR} strokeWidth={0.75} opacity={0.2} />
    </svg>
  );
}
