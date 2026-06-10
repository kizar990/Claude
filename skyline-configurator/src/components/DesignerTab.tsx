import { useState } from "react";
import { RotateCcw, Info } from "lucide-react";
import { EditableField } from "./EditableField";
import { ProcessorBadge } from "./ProcessorBadge";
import { ProcessorInfoModal } from "./ProcessorInfoModal";
import { ScreenLayoutDiagram } from "./ScreenLayoutDiagram";
import type { FullConfig } from "../calculations";
import type { OverrideState } from "../useOverrides";
import { resolve } from "../useOverrides";
import { PROCESSORS } from "../config";
import type { H2Config } from "../profiles";
interface Props {
  calc: FullConfig;
  overrideState: OverrideState;
  processorId: string;
  powerSizingMode: "operating" | "max";
  onPowerSizingModeChange: (m: "operating" | "max") => void;
  blankCells: number[];
  onBlankCellsChange: (c: number[]) => void;
  h2Config?: H2Config | null;
}

export function DesignerTab({ calc, overrideState, processorId, powerSizingMode, onPowerSizingModeChange, blankCells, onBlankCellsChange, h2Config }: Props) {
  const { dimensions, power, processor, contentSpec } = calc;
  const { resetAll, overrides } = overrideState;
  const anyOverride = Object.keys(overrides).length > 0;
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const selectedProcessor = PROCESSORS.find((p) => p.id === processorId) ?? PROCESSORS[0];

  const fmt1 = (v: number | string) => Number(v).toFixed(3);
  const fmtInt = (v: number | string) => Math.round(Number(v)).toString();
  const fmtKg = (v: number | string) => `${Math.round(Number(v))} kg`;

  return (
    <div className="space-y-4">
      {anyOverride && (
        <div className="flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm">
          <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <span className="font-medium">{Object.keys(overrides).length}</span> manual override{Object.keys(overrides).length !== 1 ? "s" : ""} active
          </span>
          <button
            onClick={resetAll}
            className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 text-xs font-medium"
          >
            <RotateCcw size={12} /> Reset all
          </button>
        </div>
      )}

      {/* Screen specs */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Screen Specifications</h3>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          <Stat label="Width">
            <EditableField
              fieldKey="widthM"
              auto={dimensions.widthM}
              overrideState={overrideState}
              format={fmt1}
              unit="m"
            />
          </Stat>
          <Stat label="Height">
            <EditableField
              fieldKey="heightM"
              auto={dimensions.heightM}
              overrideState={overrideState}
              format={fmt1}
              unit="m"
            />
          </Stat>
          <Stat label="Aspect ratio">
            <EditableField
              fieldKey="aspectRatio"
              auto={dimensions.aspectRatio}
              overrideState={overrideState}
            />
          </Stat>
          <Stat label="Resolution">
            <span className="text-sm font-mono text-gray-800 dark:text-gray-200">
              <EditableField
                fieldKey="pixelsW"
                auto={dimensions.pixelsW}
                overrideState={overrideState}
                format={fmtInt}
                inline
              />
              <span className="text-gray-400 mx-1">×</span>
              <EditableField
                fieldKey="pixelsH"
                auto={dimensions.pixelsH}
                overrideState={overrideState}
                format={fmtInt}
                inline
              />
              <span className="text-gray-500 ml-1 text-xs">px</span>
            </span>
          </Stat>
          <Stat label="Total panels">
            <EditableField
              fieldKey="totalPanels"
              auto={dimensions.activePanels}
              overrideState={overrideState}
              format={fmtInt}
            />
          </Stat>
          <Stat label="Total weight">
            <EditableField
              fieldKey="totalWeight"
              auto={dimensions.activePanels * dimensions.panelWeightKg}
              overrideState={overrideState}
              format={fmtKg}
            />
          </Stat>
          <Stat label="Processor">
            <div className="flex items-center gap-1.5">
              <ProcessorBadge processor={processor} compact />
              <button onClick={() => setShowModal(true)} title="View full processor specifications"
                className="p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                <Info size={13} />
              </button>
            </div>
          </Stat>
        </div>
      </section>

      {/* Screen layout diagram */}
      {dimensions.activePanels > 0 && (
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Screen Layout</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(e => !e)}
                className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                  isEditing
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {isEditing ? "✓ Done editing" : "✎ Edit panels"}
              </button>
              {isEditing && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Click or drag panels to toggle blank/active
                </span>
              )}
            </div>
          </div>
          <div className="px-6 py-5">
            <ScreenLayoutDiagram
              columns={dimensions.columns}
              rows={dimensions.rows}
              widthM={dimensions.widthM}
              heightM={dimensions.heightM}
              panelWidthMm={dimensions.panelWidthMm}
              panelHeightMm={dimensions.panelHeightMm}
              pixelPitch={dimensions.pixelPitch}
              activePanels={dimensions.activePanels}
              blankCells={blankCells}
              isEditing={isEditing}
              onToggleBlank={(idx) => {
                if (blankCells.includes(idx)) {
                  onBlankCellsChange(blankCells.filter(i => i !== idx));
                } else {
                  onBlankCellsChange([...blankCells, idx]);
                }
              }}
            />
          </div>
        </section>
      )}

      {/* Power summary */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Power Requirements</h3>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500 dark:text-gray-400 mr-1">Power sizing:</span>
            {(["operating", "max"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onPowerSizingModeChange(m)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  powerSizingMode === m
                    ? m === "max"
                      ? "bg-amber-500 text-white font-medium"
                      : "bg-green-600 text-white font-medium"
                    : "border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {m === "operating" ? "Operating" : "Max"}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 grid grid-cols-4 gap-4">
          <Stat label={`Total draw (${powerSizingMode})`}>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {Math.round(resolve("pow_totalWatts", power.totalWatts, overrides) as number)} W
            </span>
          </Stat>
          <Stat label="Amps at 240V">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {Number(resolve("pow_amps", power.amps, overrides)).toFixed(2)} A
            </span>
          </Stat>
          <Stat label="13A circuits">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {resolve("pow_shukoCircuits", power.circuits, overrides)}×
            </span>
          </Stat>
          <Stat label="Total weight">
            <EditableField
              fieldKey="totalWeight"
              auto={dimensions.activePanels * dimensions.panelWeightKg}
              overrideState={overrideState}
              format={fmtKg}
            />
          </Stat>
        </div>
      </section>

      {/* Content spec */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-2">Content Specification</h3>
        <p className="text-sm text-blue-800 dark:text-blue-300 font-mono leading-relaxed">
          {resolve("contentSpec", contentSpec, overrides)}
        </p>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-700 dark:text-blue-300">
          <span>📐 {resolve("pixelsW", dimensions.pixelsW, overrides)}×{resolve("pixelsH", dimensions.pixelsH, overrides)} px</span>
          <span>🎬 MP4 / H.264</span>
          <span>⏱ 50 Hz</span>
          <span>📍 Start 0,0 top-left</span>
        </div>
      </section>

      {/* Processor warning / tight notice */}
      {processor.warning && (
        <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${
          processor.status === "insufficient"
            ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300"
            : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300"
        }`}>
          <span className="text-lg leading-none mt-0.5">{processor.status === "insufficient" ? "⚠" : "⚡"}</span>
          <span>{processor.warning}</span>
        </div>
      )}

      {/* Processor info note (e.g. rotation advice) */}
      {processor.note && (
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
          <span className="text-lg leading-none mt-0.5">ℹ</span>
          <span>{processor.note}</span>
        </div>
      )}

      {showModal && (
        <ProcessorInfoModal
          processor={selectedProcessor}
          h2Config={processorId === "h2" ? h2Config : undefined}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      {children}
    </div>
  );
}
