import { useState } from "react";
import { RotateCcw, Plus, Trash2 } from "lucide-react";
import { EditableField } from "./EditableField";
import type { FullConfig } from "../calculations";
import type { OverrideState } from "../useOverrides";
import { resolve } from "../useOverrides";
import { PROCESSORS } from "../config";

interface CustomLine {
  id: string;
  item: string;
  qty: number;
}

interface Props {
  calc: FullConfig;
  overrideState: OverrideState;
  processorId: string;
  onProcessorChange: (id: string) => void;
}

export function TechnicianTab({ calc, overrideState, processorId, onProcessorChange }: Props) {
  const { dimensions, materials, power, processor } = calc;
  const { overrides, resetAll } = overrideState;
  const anyOverride = Object.keys(overrides).length > 0;

  const [customLines, setCustomLines] = useState<CustomLine[]>([]);

  function addCustomLine() {
    setCustomLines((prev) => [
      ...prev,
      { id: crypto.randomUUID(), item: "", qty: 1 },
    ]);
  }

  function updateCustomLine(id: string, field: "item" | "qty", value: string | number) {
    setCustomLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  }

  function removeCustomLine(id: string) {
    setCustomLines((prev) => prev.filter((l) => l.id !== id));
  }

  const fmtInt = (v: number | string) => Math.round(Number(v)).toString();
  const fmtF1 = (v: number | string) => Number(v).toFixed(1);
  const fmtF3 = (v: number | string) => Number(v).toFixed(3);

  return (
    <div className="space-y-4">
      {anyOverride && (
        <div className="flex items-center justify-between px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm">
          <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <span className="font-medium">{Object.keys(overrides).length}</span> manual override{Object.keys(overrides).length !== 1 ? "s" : ""} active
          </span>
          <button
            onClick={resetAll}
            className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 text-xs font-medium"
          >
            <RotateCcw size={12} /> Reset all
          </button>
        </div>
      )}

      {/* Screen specs (duplicate from designer for quick ref) */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <SectionHeader title="Screen Specifications" />
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <TechStat label="Columns × Rows">
            <span className="font-mono text-sm">
              {dimensions.activePanels > 0
                ? `${Math.round(resolve("pixelsW", dimensions.pixelsW, overrides) as number / 192)} × ${Math.round(resolve("pixelsH", dimensions.pixelsH, overrides) as number / 192)}`
                : "—"}
            </span>
          </TechStat>
          <TechStat label="Size (m)">
            <span className="font-mono text-sm">
              <EditableField fieldKey="widthM" auto={dimensions.widthM} overrideState={overrideState} format={fmtF1} unit="m" inline />
              {" × "}
              <EditableField fieldKey="heightM" auto={dimensions.heightM} overrideState={overrideState} format={fmtF1} unit="m" inline />
            </span>
          </TechStat>
          <TechStat label="Resolution">
            <span className="font-mono text-sm">
              <EditableField fieldKey="pixelsW" auto={dimensions.pixelsW} overrideState={overrideState} format={fmtInt} inline />
              {" × "}
              <EditableField fieldKey="pixelsH" auto={dimensions.pixelsH} overrideState={overrideState} format={fmtInt} inline />
            </span>
          </TechStat>
          <TechStat label="Weight">
            <EditableField fieldKey="totalWeight" auto={dimensions.activePanels * 10} overrideState={overrideState} format={(v) => `${Math.round(Number(v))} kg`} />
          </TechStat>
        </div>
        {/* Processor selector */}
        <div className="mx-4 mb-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Processor</span>
            <select
              value={processorId}
              onChange={(e) => onProcessorChange(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:text-gray-100"
            >
              {PROCESSORS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {!processor.specsConfirmed ? (
            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded px-2 py-1">
              {processor.warning}
            </span>
          ) : processor.needsUpgrade ? (
            <span className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded px-2 py-1">
              {processor.warning}
            </span>
          ) : (
            <span className="text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded px-2 py-1">
              ✓ {processor.modelName} — sufficient for {dimensions.pixelsW}×{dimensions.pixelsH} px
            </span>
          )}
        </div>
      </section>

      {/* Material list */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <SectionHeader title="Material List" />
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <MatRow label="LED Flightcases" fieldKey="mat_ledFlightcases" auto={materials.ledFlightcases} overrideState={overrideState} note={`ceil(${dimensions.activePanels} ÷ 10)`} />
          <MatRow label="LED Panels" fieldKey="mat_ledPanels" auto={materials.ledPanels} overrideState={overrideState} />
          <MatRow label="Powerlink 1m" fieldKey="mat_powerlink1m" auto={materials.powerlink1m} overrideState={overrideState} note="cases × 10" indent />
          <MatRow label="Datalink 1m" fieldKey="mat_datalink1m" auto={materials.datalink1m} overrideState={overrideState} note="cases × 10" indent />
          <MatRow label="Powerstart 10m" fieldKey="mat_powerstart10m" auto={materials.powerstart10m} overrideState={overrideState} note="cases × 1" indent />
          <MatRow label="Powerstart 1m" fieldKey="mat_powerstart1m" auto={materials.powerstart1m} overrideState={overrideState} note="cases × 1" indent />
          <MatRow label="Datastart KIT (20/10/5/3)" fieldKey="mat_datastartKit" auto={materials.datastartKit} overrideState={overrideState} note="cases × 2" indent />
          <MatRow label="E-tape rolls" fieldKey="mat_etapeRolls" auto={materials.etapeRolls} overrideState={overrideState} note="cases × 1" indent />
          <MatRow label="FIT KIT (Quicfix + T-Bone)" fieldKey="mat_fitKit" auto={materials.fitKit} overrideState={overrideState} note="cases × 10" indent />
          <MatRow label="Neutrik Couplers" fieldKey="mat_neutrikCouplers" auto={materials.neutrikCouplers} overrideState={overrideState} note="fixed" />
          <MatRow label="PROC Flightcase" fieldKey="mat_procFlightcase" auto={materials.procFlightcase} overrideState={overrideState} note="1 per screen" />
          <MatRow label="LED Spares" fieldKey="mat_ledSpares" auto={materials.ledSpares} overrideState={overrideState} note={`ceil(${dimensions.activePanels} × 10%)`} />
          <MatRow label={`Processor (${processor.needsUpgrade ? "upgrade needed" : "HD"})`} fieldKey="mat_processor" auto={materials.processor} overrideState={overrideState} accent={processor.needsUpgrade ? "red" : undefined} />
          <MatRow label="POWER/HDMI/USB-A/UTP kit" fieldKey="mat_powerHdmiUsbUtp" auto={materials.powerHdmiUsbUtp} overrideState={overrideState} indent />
          <MatRow label="Mediaplayer (HD)" fieldKey="mat_mediaplayer" auto={materials.mediaplayer} overrideState={overrideState} />
          <MatRow label="POWER/HDMI/USB stick kit" fieldKey="mat_powerHdmiUsbStick" auto={materials.powerHdmiUsbStick} overrideState={overrideState} indent />
        </div>

        {/* Custom line items */}
        {customLines.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Custom items
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {customLines.map((line) => (
                <div key={line.id} className="flex items-center gap-2 px-4 py-2">
                  <input
                    value={line.item}
                    onChange={(e) => updateCustomLine(line.id, "item", e.target.value)}
                    placeholder="Item description"
                    className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                  <input
                    type="number"
                    min={0}
                    value={line.qty}
                    onChange={(e) => updateCustomLine(line.id, "qty", parseInt(e.target.value) || 0)}
                    className="w-16 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-center bg-white dark:bg-gray-800 dark:text-gray-100"
                  />
                  <button
                    onClick={() => removeCustomLine(line.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={addCustomLine}
            className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            <Plus size={13} /> Add custom line item
          </button>
        </div>
      </section>

      {/* Power & cabling */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <SectionHeader title="Power & Cabling" />
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          <TechStat label="Total power">
            <EditableField fieldKey="pow_totalWatts" auto={power.totalWatts} overrideState={overrideState} format={(v) => `${Math.round(Number(v))} W`} />
          </TechStat>
          <TechStat label="Amps at 240V">
            <EditableField fieldKey="pow_amps" auto={power.amps} overrideState={overrideState} format={fmtF3} unit="A" />
          </TechStat>
          <TechStat label="13A circuits">
            <EditableField fieldKey="pow_shukoCircuits" auto={power.circuits} overrideState={overrideState} format={fmtInt} />
            <span className="text-xs text-gray-400 ml-1">
              (ceil({Math.round(resolve("pow_totalWatts", power.totalWatts, overrides) as number)} ÷ 2496)
            </span>
          </TechStat>
          <TechStat label="Data lines">
            <EditableField fieldKey="pow_dataLines" auto={power.dataLines} overrideState={overrideState} format={fmtInt} />
            <span className="text-xs text-gray-400 ml-1">
              (ceil({dimensions.activePanels} ÷ 13))
            </span>
          </TechStat>
          <TechStat label="Data links (UTP)">
            <EditableField fieldKey="pow_utpData" auto={power.utpDataCables} overrideState={overrideState} format={fmtInt} />
          </TechStat>
        </div>
        <div className="mx-4 mb-4 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-500 dark:text-gray-400 font-mono">
          {dimensions.activePanels} panels × 150 W = {power.totalWatts} W ÷ 240 V = {power.amps.toFixed(3)} A
        </div>
      </section>

      {/* Content spec */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-2">Content Specification</h3>
        <p className="text-sm text-blue-800 dark:text-blue-300 font-mono">
          {calc.contentSpec}
        </p>
      </section>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{title}</h3>
    </div>
  );
}

function TechStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

function MatRow({
  label,
  fieldKey,
  auto,
  overrideState,
  note,
  indent = false,
  accent,
}: {
  label: string;
  fieldKey: string;
  auto: number;
  overrideState: OverrideState;
  note?: string;
  indent?: boolean;
  accent?: "red";
}) {
  const { isOverridden } = overrideState;
  const overridden = isOverridden(fieldKey);

  return (
    <div
      className={`flex items-center justify-between px-4 py-2 ${
        overridden ? "bg-amber-50 dark:bg-amber-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {indent && <span className="w-3 shrink-0 text-gray-300 dark:text-gray-600 text-xs">└</span>}
        <span
          className={`text-sm truncate ${
            accent === "red"
              ? "text-red-700 dark:text-red-400 font-medium"
              : "text-gray-700 dark:text-gray-300"
          }`}
        >
          {label}
        </span>
        {note && (
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 hidden sm:inline">
            ({note})
          </span>
        )}
      </div>
      <div className="shrink-0">
        <EditableField
          fieldKey={fieldKey}
          auto={auto}
          overrideState={overrideState}
          format={(v) => Math.round(Number(v)).toString()}
          className="min-w-[3rem] justify-end"
        />
      </div>
    </div>
  );
}
