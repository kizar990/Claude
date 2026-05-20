import { useState } from "react";
import { Settings, Info } from "lucide-react";
import { metresToInput } from "../calculations";
import { CONFIG } from "../config";
import type { ScreenInputState, ProjectMeta } from "../store";
import { PanelInfoModal } from "./PanelInfoModal";
import { PanelPicker } from "./PanelPicker";
import type { PanelSpec } from "../panels";

type InputMode = "panels" | "metres" | "pixels";

interface Props {
  input: ScreenInputState;
  meta: ProjectMeta;
  activePanel: PanelSpec;
  onPanelChange: (p: PanelSpec) => void;
  onInputChange: (i: ScreenInputState) => void;
  onMetaChange: (m: ProjectMeta) => void;
  darkMode: boolean;
  onDarkToggle: () => void;
}

export function InputSection({
  input,
  meta,
  activePanel,
  onPanelChange,
  onInputChange,
  onMetaChange,
  darkMode,
  onDarkToggle,
}: Props) {
  const [mode, setMode] = useState<InputMode>("panels");
  const [showPanelPicker, setShowPanelPicker] = useState(false);
  const [showPanelInfo, setShowPanelInfo] = useState(false);

  // Metres mode — initialise from current panel count × physical size
  const [mW, setMW] = useState(((input.columns * activePanel.widthMm) / 1000).toFixed(3));
  const [mH, setMH] = useState(((input.rows * activePanel.heightMm) / 1000).toFixed(3));

  // Pixels mode
  // Note: pixelsToInput uses default CONFIG.PANEL_PIXELS_W/H for snapping.
  // The snap display uses activePanel.pixelsW/H for display accuracy.
  const [pxW, setPxW] = useState(String(input.columns * activePanel.pixelsW));
  const [pxH, setPxH] = useState(String(input.rows * activePanel.pixelsH));

  function applyMetres() {
    const w = parseFloat(mW) || 0;
    const h = parseFloat(mH) || 0;
    if (w <= 0 || h <= 0) return;
    const cfg = { ...CONFIG, PANEL_WIDTH_MM: activePanel.widthMm, PANEL_HEIGHT_MM: activePanel.heightMm };
    const { input: snapped } = metresToInput(w, h, cfg as Parameters<typeof metresToInput>[2]);
    onInputChange({ ...snapped, blankPanels: input.blankPanels });
  }

  function applyPixels() {
    const w = parseInt(pxW) || 0;
    const h = parseInt(pxH) || 0;
    if (w <= 0 || h <= 0) return;
    // Snap using active panel pixel dimensions
    const columns = Math.round(w / activePanel.pixelsW);
    const rows = Math.round(h / activePanel.pixelsH);
    onInputChange({ columns: Math.max(1, columns), rows: Math.max(1, rows), blankPanels: input.blankPanels });
  }

  // Metres snap delta: compare typed value against applied panel-snapped value
  const snapDeltaW = input.columns * activePanel.widthMm - parseFloat(mW) * 1000;
  const snapDeltaH = input.rows * activePanel.heightMm - parseFloat(mH) * 1000;

  // Pixel snap delta using active panel pixel dimensions
  const parsedPxCols = Math.round((parseInt(pxW) || 0) / activePanel.pixelsW);
  const parsedPxRows = Math.round((parseInt(pxH) || 0) / activePanel.pixelsH);
  const pxSnappedW = parsedPxCols * activePanel.pixelsW;
  const pxSnappedH = parsedPxRows * activePanel.pixelsH;
  const pxDeltaW = pxSnappedW - (parseInt(pxW) || 0);
  const pxDeltaH = pxSnappedH - (parseInt(pxH) || 0);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Project Setup
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onDarkToggle}
            className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {darkMode ? "☀ Light" : "☾ Dark"}
          </button>
          <button
            onClick={() => setShowPanelPicker(true)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Settings size={13} />
            <span className="max-w-32 truncate">{activePanel.name}</span>
          </button>
          <button
            onClick={() => setShowPanelInfo(true)}
            title="View panel specifications"
            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
          >
            <Info size={14} />
          </button>
        </div>
      </div>

      {/* Project metadata */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        {(
          [
            ["name", "Project name", "text"],
            ["jobNumber", "Job number", "text"],
            ["client", "Client", "text"],
            ["date", "Date", "date"],
            ["venue", "Venue", "text"],
            ["contact", "On-site contact", "text"],
          ] as [keyof ProjectMeta, string, string][]
        ).map(([key, label, type]) => (
          <div key={key} className="flex flex-col gap-0.5">
            <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
            <input
              type={type}
              value={meta[key]}
              onChange={(e) => onMetaChange({ ...meta, [key]: e.target.value })}
              placeholder={label}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>
        ))}
      </div>

      {/* Input mode toggle */}
      <div className="flex gap-1 mb-3">
        {(["panels", "metres", "pixels"] as InputMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
              mode === m
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {m === "panels" ? "By panels" : m === "metres" ? "By metres" : "By pixels"}
          </button>
        ))}
      </div>

      {/* By panels */}
      {mode === "panels" && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Columns</label>
            <input
              type="number" min={1} value={input.columns}
              onChange={(e) => onInputChange({ ...input, columns: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-16 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 text-center bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <span className="text-gray-400 text-lg">×</span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Rows</label>
            <input
              type="number" min={1} value={input.rows}
              onChange={(e) => onInputChange({ ...input, rows: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-16 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 text-center bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-2 ml-4">
            <label className="text-sm text-gray-600 dark:text-gray-400">Blank panels</label>
            <input
              type="number" min={0} max={input.columns * input.rows} value={input.blankPanels}
              onChange={(e) => onInputChange({ ...input, blankPanels: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-16 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 text-center bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      )}

      {/* By metres */}
      {mode === "metres" && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Width m</label>
            <input
              type="number" step="0.001" min={0.001} value={mW}
              onChange={(e) => setMW(e.target.value)}
              onBlur={applyMetres}
              onKeyDown={(e) => e.key === "Enter" && applyMetres()}
              className="w-24 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <span className="text-gray-400 text-lg">×</span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Height m</label>
            <input
              type="number" step="0.001" min={0.001} value={mH}
              onChange={(e) => setMH(e.target.value)}
              onBlur={applyMetres}
              onKeyDown={(e) => e.key === "Enter" && applyMetres()}
              className="w-24 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <button onClick={applyMetres} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
            Apply
          </button>
          {(Math.abs(snapDeltaW) > 0.5 || Math.abs(snapDeltaH) > 0.5) && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Snapped to {(input.columns * activePanel.widthMm / 1000).toFixed(3)}m ×{" "}
              {(input.rows * activePanel.heightMm / 1000).toFixed(3)}m
              {Math.abs(snapDeltaW) > 0.5 && ` (ΔW ${snapDeltaW > 0 ? "+" : ""}${snapDeltaW.toFixed(0)}mm)`}
              {Math.abs(snapDeltaH) > 0.5 && ` (ΔH ${snapDeltaH > 0 ? "+" : ""}${snapDeltaH.toFixed(0)}mm)`}
            </span>
          )}
        </div>
      )}

      {/* By pixels */}
      {mode === "pixels" && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Width px</label>
            <input
              type="number" min={1} value={pxW}
              onChange={(e) => setPxW(e.target.value)}
              onBlur={applyPixels}
              onKeyDown={(e) => e.key === "Enter" && applyPixels()}
              className="w-24 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <span className="text-gray-400 text-lg">×</span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Height px</label>
            <input
              type="number" min={1} value={pxH}
              onChange={(e) => setPxH(e.target.value)}
              onBlur={applyPixels}
              onKeyDown={(e) => e.key === "Enter" && applyPixels()}
              className="w-24 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <button onClick={applyPixels} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
            Apply
          </button>
          {/* Only show snap warning if the typed value is NOT already on a panel boundary */}
          {(Math.abs(pxDeltaW) > 0 || Math.abs(pxDeltaH) > 0) && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Snapped to {pxSnappedW}×{pxSnappedH} px
              {pxDeltaW !== 0 && ` (ΔW ${pxDeltaW > 0 ? "+" : ""}${pxDeltaW}px)`}
              {pxDeltaH !== 0 && ` (ΔH ${pxDeltaH > 0 ? "+" : ""}${pxDeltaH}px)`}
            </span>
          )}
        </div>
      )}

      {showPanelPicker && (
        <PanelPicker
          activePanel={activePanel}
          onSelect={(p) => { onPanelChange(p); setShowPanelPicker(false); }}
          onClose={() => setShowPanelPicker(false)}
        />
      )}
      {showPanelInfo && (
        <PanelInfoModal panel={activePanel} onClose={() => setShowPanelInfo(false)} />
      )}
    </div>
  );
}
