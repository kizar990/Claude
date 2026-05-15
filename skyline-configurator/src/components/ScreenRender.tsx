import { useRef, useCallback } from "react";
import { Download } from "lucide-react";
import type { ChainData } from "../store";

interface Props {
  columns: number;
  rows: number;
  blankCells: number[];
  chains: ChainData[];
  onToggleBlank: (idx: number) => void;
  onChainClick?: (idx: number) => void;
  activeChainId?: string | null;
  showChains?: boolean;
}

const CELL_SIZE = 56; // px per panel cell in SVG
const GAP = 2;

function panelIdx(col: number, row: number, columns: number) {
  return row * columns + col;
}

export function ScreenRender({
  columns,
  rows,
  blankCells,
  chains,
  onToggleBlank,
  onChainClick,
  activeChainId,
  showChains = true,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const svgW = columns * (CELL_SIZE + GAP) - GAP + 2;
  const svgH = rows * (CELL_SIZE + GAP) - GAP + 2;

  // Build a map: panelIdx → chain color + sequence number within that chain
  const panelChainInfo = new Map<number, { color: string; seq: number }>();
  if (showChains) {
    for (const chain of chains) {
      chain.panels.forEach((pidx, seq) => {
        panelChainInfo.set(pidx, { color: chain.color, seq: seq + 1 });
      });
    }
  }

  // Build arrow paths for chains
  function chainArrows(chain: ChainData) {
    if (chain.panels.length < 2) return null;
    const paths: React.ReactNode[] = [];
    for (let i = 0; i < chain.panels.length - 1; i++) {
      const from = chain.panels[i];
      const to = chain.panels[i + 1];
      const fc = from % columns;
      const fr = Math.floor(from / columns);
      const tc = to % columns;
      const tr = Math.floor(to / columns);
      const x1 = 1 + fc * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      const y1 = 1 + fr * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      const x2 = 1 + tc * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      const y2 = 1 + tr * (CELL_SIZE + GAP) + CELL_SIZE / 2;
      paths.push(
        <line
          key={`${chain.id}-${i}`}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={chain.color}
          strokeWidth={2.5}
          strokeOpacity={0.85}
          markerEnd={`url(#arrow-${chain.id})`}
        />
      );
    }
    return paths;
  }

  const handleExportPng = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const scale = 3;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svgW * scale;
      canvas.height = svgH * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const link = document.createElement("a");
      link.download = "led-wall-layout.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = url;
  }, [svgW, svgH]);

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="overflow-auto max-w-full border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-800 p-2">
        <svg
          ref={svgRef}
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ display: "block" }}
        >
          {/* Arrow marker defs */}
          <defs>
            {chains.map((chain) => (
              <marker
                key={chain.id}
                id={`arrow-${chain.id}`}
                markerWidth={6}
                markerHeight={6}
                refX={5}
                refY={3}
                orient="auto"
              >
                <path d="M0,0 L0,6 L6,3 z" fill={chain.color} />
              </marker>
            ))}
          </defs>

          {/* Panel cells */}
          {Array.from({ length: rows }, (_, r) =>
            Array.from({ length: columns }, (_, c) => {
              const idx = panelIdx(c, r, columns);
              const isBlank = blankCells.includes(idx);
              const chainInfo = panelChainInfo.get(idx);
              const isInActiveChain =
                activeChainId != null &&
                chains.find((ch) => ch.id === activeChainId)?.panels.includes(idx);

              const x = 1 + c * (CELL_SIZE + GAP);
              const y = 1 + r * (CELL_SIZE + GAP);
              const labelNum = idx + 1;

              let fill = "#e2e8f0"; // gray-200
              let stroke = "#cbd5e1"; // gray-300
              let textColor = "#475569"; // slate-600

              if (isBlank) {
                fill = "#94a3b8";
                stroke = "#64748b";
                textColor = "#f8fafc";
              } else if (chainInfo) {
                fill = chainInfo.color + "33"; // 20% opacity
                stroke = chainInfo.color;
                textColor = chainInfo.color;
              } else if (isInActiveChain) {
                fill = "#bfdbfe"; // blue-200
                stroke = "#3b82f6";
              }

              return (
                <g
                  key={idx}
                  onClick={() => {
                    if (onChainClick) {
                      onChainClick(idx);
                    } else {
                      onToggleBlank(idx);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    x={x} y={y}
                    width={CELL_SIZE} height={CELL_SIZE}
                    rx={3}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isInActiveChain ? 2 : 1}
                  />
                  <text
                    x={x + CELL_SIZE / 2}
                    y={y + CELL_SIZE / 2 - (chainInfo ? 5 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fontFamily="ui-monospace, monospace"
                    fill={textColor}
                    fontWeight="600"
                  >
                    {labelNum}
                  </text>
                  {isBlank && (
                    <text
                      x={x + CELL_SIZE / 2}
                      y={y + CELL_SIZE / 2 + 10}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={9}
                      fontFamily="system-ui, sans-serif"
                      fill="#f8fafc"
                    >
                      BLANK
                    </text>
                  )}
                  {chainInfo && (
                    <text
                      x={x + CELL_SIZE / 2}
                      y={y + CELL_SIZE / 2 + 9}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={9}
                      fontFamily="system-ui, sans-serif"
                      fill={chainInfo.color}
                      fontWeight="500"
                    >
                      #{chainInfo.seq}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* Chain arrows */}
          {showChains && chains.map((chain) => chainArrows(chain))}
        </svg>
      </div>

      <button
        onClick={handleExportPng}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <Download size={13} /> Export PNG
      </button>
    </div>
  );
}
