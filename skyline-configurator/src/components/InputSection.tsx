import { useState } from "react";
import { Settings } from "lucide-react";
import { CONFIG } from "../config";
import { metresToInput, pixelsToInput } from "../calculations";
import type { ScreenInputState, ProjectMeta } from "../store";

type InputMode = "panels" | "metres" | "pixels";

interface Props {
  input: ScreenInputState;
  meta: ProjectMeta;
  panelWidthMm: number;
  panelHeightMm: number;
  onInputChange: (i: ScreenInputState) => void;
  onMetaChange: (m: ProjectMeta) => void;
  onPanelSizeChange: (w: number, h: number) => void;
  darkMode: boolean;
  onDarkToggle: () => void;
}

export function InputSection({
  input,
  meta,
  panelWidthMm,
  panelHeightMm,
  onInputChange,
  onMetaChange,
  onPanelSizeChange,
  darkMode,
  onDarkToggle,
}: Props) {
  const [mode, setMode] = useState<InputMode>("panels");
  const [showSettings, setShowSettings] = useState(false);

  // Metres mode state
  const [mW, setMW] = useState(String((input.columns * panelWidthMm) / 1000));
  const [mH, setMH] = useState(String((input.rows * panelHeightMm) / 1000));

  // Pixels mode state
  const [pxW, setPxW] = useState(String(input.columns * CONFIG.PANEL_PIXELS_W));
  const [pxH, setPxH] = useState(String(input.rows * CONFIG.PANEL_PIXELS_H));

  // Settings state
  const [settingsW, setSettingsW] = useState(String(panelWidthMm));
  const [settingsH, setSettingsH] = useState(String(panelHeightMm));

  function applyMetres() {
    const w = parseFloat(mW) || 0;
    const h = parseFloat(mH) || 0;
    if (w <= 0 || h <= 0) return;
    const cfg = { ...CONFIG, PANEL_WIDTH_MM: panelWidthMm, PANEL_HEIGHT_MM: panelHeightMm };
    const { input: snapped } = metresToInput(w, h, cfg);
    onInputChange({ ...snapped, blankPanels: input.blankPanels });
  }

  function applyPixels() {
    const w = parseInt(pxW) || 0;
    const h = parseInt(pxH) || 0;
    if (w <= 0 || h <= 0) return;
    const { input: snapped } = pixelsToInput(w, h);
    onInputChange({ ...snapped, blankPanels: input.blankPanels });
  }

  function applySettings() {
    const w = parseFloat(settingsW) || panelWidthMm;
    const h = parseFloat(settingsH) || panelHeightMm;
    onPanelSizeChange(w, h);
    setShowSettings(false);
  }

  const snapDeltaW = input.columns * panelWidthMm - parseFloat(mW) * 1000;
  const snapDeltaH = input.rows * panelHeightMm - parseFloat(mH) * 1000;

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
            onClick={() => setShowSettings((s) => !s)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Settings size={13} /> Panel size
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-2">
            Override panel physical size (mm) — all calculations recalculate
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs text-gray-600 dark:text-gray-400">Width mm</label>
            <input
              type="number"
              value={settingsW}
              onChange={(e) => setSettingsW(e.target.value)}
              className="w-20 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:text-gray-100"
            />
            <label className="text-xs text-gray-600 dark:text-gray-400">Height mm</label>
            <input
              type="number"
              value={settingsH}
              onChange={(e) => setSettingsH(e.target.value)}
              className="w-20 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:text-gray-100"
            />
            <button
              onClick={applySettings}
              className="text-xs px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600"
            >
              Apply
            </button>
            <button
              onClick={() => { setSettingsW(String(CONFIG.PANEL_WIDTH_MM)); setSettingsH(String(CONFIG.PANEL_HEIGHT_MM)); }}
              className="text-xs text-gray-500 underline"
            >
              Reset to {CONFIG.PANEL_WIDTH_MM}×{CONFIG.PANEL_HEIGHT_MM}
            </button>
          </div>
        </div>
      )}

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

      {/* Panel input */}
      {mode === "panels" && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Columns</label>
            <input
              type="number"
              min={1}
              value={input.columns}
              onChange={(e) => onInputChange({ ...input, columns: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-16 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 text-center bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <span className="text-gray-400 text-lg">×</span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Rows</label>
            <input
              type="number"
              min={1}
              value={input.rows}
              onChange={(e) => onInputChange({ ...input, rows: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-16 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 text-center bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-2 ml-4">
            <label className="text-sm text-gray-600 dark:text-gray-400">Blank panels</label>
            <input
              type="number"
              min={0}
              max={input.columns * input.rows}
              value={input.blankPanels}
              onChange={(e) => onInputChange({ ...input, blankPanels: Math.max(0, parseInt(e.target.value) || 0) })}
              className="w-16 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 text-center bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      )}

      {mode === "metres" && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Width m</label>
            <input
              type="number"
              step="0.1"
              min={0.1}
              value={mW}
              onChange={(e) => setMW(e.target.value)}
              onBlur={applyMetres}
              onKeyDown={(e) => e.key === "Enter" && applyMetres()}
              className="w-20 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <span className="text-gray-400 text-lg">×</span>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Height m</label>
            <input
              type="number"
              step="0.1"
              min={0.1}
              value={mH}
              onChange={(e) => setMH(e.target.value)}
              onBlur={applyMetres}
              onKeyDown={(e) => e.key === "Enter" && applyMetres()}
              className="w-20 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <button
            onClick={applyMetres}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply
          </button>
          {(Math.abs(snapDeltaW) > 1 || Math.abs(snapDeltaH) > 1) && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Snapped to {(input.columns * panelWidthMm / 1000).toFixed(2)}m ×{" "}
              {(input.rows * panelHeightMm / 1000).toFixed(2)}m
              {snapDeltaW !== 0 && ` (ΔW ${snapDeltaW > 0 ? "+" : ""}${snapDeltaW.toFixed(0)}mm)`}
              {snapDeltaH !== 0 && ` (ΔH ${snapDeltaH > 0 ? "+" : ""}${snapDeltaH.toFixed(0)}mm)`}
            </span>
          )}
        </div>
      )}

      {mode === "pixels" && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Width px</label>
            <input
              type="number"
              min={1}
              value={pxW}
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
              type="number"
              min={1}
              value={pxH}
              onChange={(e) => setPxH(e.target.value)}
              onBlur={applyPixels}
              onKeyDown={(e) => e.key === "Enter" && applyPixels()}
              className="w-24 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <button
            onClick={applyPixels}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply
          </button>
          {(() => {
            const snappedW = input.columns * CONFIG.PANEL_PIXELS_W;
            const snappedH = input.rows * CONFIG.PANEL_PIXELS_H;
            const dW = snappedW - parseInt(pxW);
            const dH = snappedH - parseInt(pxH);
            return (Math.abs(dW) > 0 || Math.abs(dH) > 0) ? (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Snapped to {snappedW}×{snappedH} px
                {dW !== 0 && ` (ΔW ${dW > 0 ? "+" : ""}${dW}px)`}
                {dH !== 0 && ` (ΔH ${dH > 0 ? "+" : ""}${dH}px)`}
              </span>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
