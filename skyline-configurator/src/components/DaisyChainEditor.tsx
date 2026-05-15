import { useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import type { ChainData } from "../store";
import { CHAIN_COLORS } from "../store";

interface Props {
  columns: number;
  rows: number;
  blankCells: number[];
  chains: ChainData[];
  onChainsChange: (chains: ChainData[]) => void;
  panelsPerLine: number;
}

export function DaisyChainEditor({
  columns,
  rows,
  blankCells,
  chains,
  onChainsChange,
  panelsPerLine,
}: Props) {
  const [activeChainId, setActiveChainId] = useState<string | null>(null);
  const [mode, setMode] = useState<"blank" | "chain">("blank");

  function addChain() {
    const usedColors = chains.map((c) => c.color);
    const color =
      CHAIN_COLORS.find((c) => !usedColors.includes(c)) ?? CHAIN_COLORS[chains.length % CHAIN_COLORS.length];
    const newChain: ChainData = {
      id: crypto.randomUUID(),
      color,
      panels: [],
    };
    const updated = [...chains, newChain];
    onChainsChange(updated);
    setActiveChainId(newChain.id);
    setMode("chain");
  }

  function removeChain(id: string) {
    onChainsChange(chains.filter((c) => c.id !== id));
    if (activeChainId === id) setActiveChainId(null);
  }

  function clearAllChains() {
    onChainsChange([]);
    setActiveChainId(null);
  }

  function suggestChains() {
    // Serpentine path: left-to-right on even rows, right-to-left on odd rows
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
    for (let i = 0; i < activePanels.length; i += panelsPerLine) {
      const slice = activePanels.slice(i, i + panelsPerLine);
      newChains.push({
        id: crypto.randomUUID(),
        color: CHAIN_COLORS[newChains.length % CHAIN_COLORS.length],
        panels: slice,
      });
    }
    onChainsChange(newChains);
    setActiveChainId(newChains[0]?.id ?? null);
    setMode("chain");
  }

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">Click panels to:</span>
        <button
          onClick={() => setMode("blank")}
          className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
            mode === "blank"
              ? "bg-gray-700 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
          }`}
        >
          Toggle blank
        </button>
        <button
          onClick={() => { setMode("chain"); if (!activeChainId && chains.length > 0) setActiveChainId(chains[0].id); }}
          className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
            mode === "chain"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
          }`}
        >
          Add to chain
        </button>
      </div>

      {/* Chain list */}
      <div className="space-y-1">
        {chains.map((chain) => {
          const over = chain.panels.length > panelsPerLine;
          return (
            <div
              key={chain.id}
              onClick={() => { setActiveChainId(chain.id); setMode("chain"); }}
              className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors ${
                activeChainId === chain.id
                  ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
                  : "border border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: chain.color }}
              />
              <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">
                Chain {chains.indexOf(chain) + 1} — {chain.panels.length} panel{chain.panels.length !== 1 ? "s" : ""}
              </span>
              {over && (
                <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                  <AlertTriangle size={11} /> &gt;{panelsPerLine}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removeChain(chain.id); }}
                className="p-0.5 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={addChain}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus size={12} /> New chain
        </button>
        <button
          onClick={suggestChains}
          className="text-xs px-2.5 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          ✦ Suggest chains
        </button>
        {chains.length > 0 && (
          <button
            onClick={clearAllChains}
            className="text-xs px-2.5 py-1.5 rounded border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Clear all
          </button>
        )}
      </div>

      {mode === "chain" && activeChainId && (
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Click panels in order to build chain {chains.findIndex(c => c.id === activeChainId) + 1}.
          Click a panel already in this chain to trim from that point.
          Max {panelsPerLine} panels per chain.
        </p>
      )}

      {/* Chain summary */}
      {chains.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
          {chains.map((c, i) => (
            <div key={c.id} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span>Chain {i + 1}: {c.panels.map(p => p + 1).join(" → ")}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expose handlePanelClick for parent */}
      <div data-chain-click-handler={JSON.stringify({ activeChainId, mode })} style={{ display: "none" }} />
    </div>
  );
}

// Export the handler so LayoutTab can pass it to ScreenRender
export function makeChainClickHandler(
  mode: "blank" | "chain",
  activeChainId: string | null,
  chains: ChainData[],
  _blankCells: number[],
  panelsPerLine: number,
  onChainsChange: (c: ChainData[]) => void,
  onToggleBlank: (idx: number) => void
) {
  return (idx: number) => {
    if (mode === "blank") {
      onToggleBlank(idx);
      return;
    }
    if (!activeChainId) return;
    const chain = chains.find((c) => c.id === activeChainId);
    if (!chain) return;

    const pos = chain.panels.indexOf(idx);
    if (pos !== -1) {
      onChainsChange(chains.map((c) => c.id === activeChainId ? { ...c, panels: c.panels.slice(0, pos) } : c));
      return;
    }
    for (const c of chains) { if (c.panels.includes(idx)) return; }
    if (chain.panels.length >= panelsPerLine) return;
    onChainsChange(chains.map((c) => c.id === activeChainId ? { ...c, panels: [...c.panels, idx] } : c));
  };
}
