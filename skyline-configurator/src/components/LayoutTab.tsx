import { useState } from "react";
import { ScreenRender } from "./ScreenRender";
import { makeChainClickHandler } from "./DaisyChainEditor";
import type { ChainData } from "../store";
import { CONFIG } from "../config";

interface Props {
  columns: number;
  rows: number;
  blankCells: number[];
  chains: ChainData[];
  onBlankCellsChange: (cells: number[]) => void;
  onChainsChange: (chains: ChainData[]) => void;
}

type EditorMode = "blank" | "chain";

export function LayoutTab({
  columns,
  rows,
  blankCells,
  chains,
  onBlankCellsChange,
  onChainsChange,
}: Props) {
  const [mode, setMode] = useState<EditorMode>("blank");
  const [activeChainId, setActiveChainId] = useState<string | null>(null);
  const [showChains, setShowChains] = useState(true);

  function toggleBlank(idx: number) {
    if (blankCells.includes(idx)) {
      onBlankCellsChange(blankCells.filter((i) => i !== idx));
    } else {
      onBlankCellsChange([...blankCells, idx]);
    }
  }

  const handlePanelClick = makeChainClickHandler(
    mode,
    activeChainId,
    chains,
    blankCells,
    CONFIG.PANELS_PER_DATA_LINE,
    onChainsChange,
    toggleBlank
  );

  function handleAddChain() {
    const usedColors = chains.map((c) => c.color);
    const CHAIN_COLORS = ["#ef4444","#3b82f6","#22c55e","#f59e0b","#a855f7","#ec4899","#14b8a6","#f97316"];
    const color = CHAIN_COLORS.find((c) => !usedColors.includes(c)) ?? CHAIN_COLORS[chains.length % CHAIN_COLORS.length];
    const newChain: ChainData = { id: crypto.randomUUID(), color, panels: [] };
    onChainsChange([...chains, newChain]);
    setActiveChainId(newChain.id);
    setMode("chain");
  }

  function handleSuggestChains() {
    const CHAIN_COLORS = ["#ef4444","#3b82f6","#22c55e","#f59e0b","#a855f7","#ec4899","#14b8a6","#f97316"];
    const limit = CONFIG.PANELS_PER_DATA_LINE;
    const activePanels: number[] = [];
    for (let r = 0; r < rows; r++) {
      const rowPanels: number[] = [];
      for (let c = 0; c < columns; c++) {
        const idx = r * columns + c;
        if (!blankCells.includes(idx)) rowPanels.push(idx);
      }
      if (r % 2 === 1) rowPanels.reverse();
      activePanels.push(...rowPanels);
    }
    const newChains: ChainData[] = [];
    for (let i = 0; i < activePanels.length; i += limit) {
      newChains.push({
        id: crypto.randomUUID(),
        color: CHAIN_COLORS[newChains.length % CHAIN_COLORS.length],
        panels: activePanels.slice(i, i + limit),
      });
    }
    onChainsChange(newChains);
    setActiveChainId(newChains[0]?.id ?? null);
    setMode("chain");
  }

  const blankCount = blankCells.length;
  const activeCount = columns * rows - blankCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Grid */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  Screen Layout — {columns}×{rows}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {activeCount} active{blankCount > 0 ? `, ${blankCount} blank` : ""}
                  {" · "}{chains.length} chain{chains.length !== 1 ? "s" : ""}
                </p>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showChains}
                  onChange={(e) => setShowChains(e.target.checked)}
                  className="rounded"
                />
                Show chains
              </label>
            </div>
            <div className="p-4">
              <ScreenRender
                columns={columns}
                rows={rows}
                blankCells={blankCells}
                chains={chains}
                onToggleBlank={toggleBlank}
                onChainClick={handlePanelClick}
                activeChainId={activeChainId}
                showChains={showChains}
              />
            </div>
          </div>

          {/* Legend */}
          {blankCells.length > 0 && (
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-400" /> Blank
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300" /> Active
              </span>
              <button
                onClick={() => onBlankCellsChange([])}
                className="text-red-400 hover:text-red-600 underline"
              >
                Clear all blanks
              </button>
            </div>
          )}
        </div>

        {/* Daisy chain panel */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-3">
              Daisy Chain Planner
            </h3>

            {/* Mode selector */}
            <div className="flex gap-1 mb-3">
              <button
                onClick={() => setMode("blank")}
                className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${
                  mode === "blank"
                    ? "bg-gray-700 dark:bg-gray-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                Blank
              </button>
              <button
                onClick={() => { setMode("chain"); if (!activeChainId && chains.length > 0) setActiveChainId(chains[0].id); }}
                className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${
                  mode === "chain"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                Chain
              </button>
            </div>

            {mode === "chain" && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                {activeChainId
                  ? `Building chain ${(chains.findIndex(c => c.id === activeChainId) ?? -1) + 1}. Click panels in order.`
                  : "Select or create a chain, then click panels."}
              </p>
            )}

            {mode === "blank" && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Click any panel to toggle it as blank (cut-out).
              </p>
            )}

            {/* Chain list */}
            <div className="space-y-1 mb-3">
              {chains.map((chain, i) => {
                const over = chain.panels.length > CONFIG.PANELS_PER_DATA_LINE;
                return (
                  <div
                    key={chain.id}
                    onClick={() => { setActiveChainId(chain.id); setMode("chain"); }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                      activeChainId === chain.id
                        ? "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-700"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chain.color }} />
                    <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">
                      Chain {i + 1}
                      <span className={`ml-1 ${over ? "text-red-500 font-medium" : "text-gray-400"}`}>
                        ({chain.panels.length}/{CONFIG.PANELS_PER_DATA_LINE})
                      </span>
                    </span>
                    {over && <span className="text-xs text-red-500">⚠</span>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onChainsChange(chains.filter((c) => c.id !== chain.id));
                        if (activeChainId === chain.id) setActiveChainId(null);
                      }}
                      className="text-gray-300 hover:text-red-400 p-0.5"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="space-y-1.5">
              <button
                onClick={handleAddChain}
                className="w-full text-xs py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium"
              >
                + New chain
              </button>
              <button
                onClick={handleSuggestChains}
                className="w-full text-xs py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                ✦ Suggest (serpentine)
              </button>
              {chains.length > 0 && (
                <button
                  onClick={() => { onChainsChange([]); setActiveChainId(null); }}
                  className="w-full text-xs py-1.5 rounded border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Clear all chains
                </button>
              )}
            </div>

            {/* Chain sequence readout */}
            {chains.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
                {chains.map((c, i) => (
                  <div key={c.id} className="flex gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-gray-500 dark:text-gray-400 break-all leading-tight">
                      Ch{i + 1}: {c.panels.map((p) => p + 1).join("→")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
