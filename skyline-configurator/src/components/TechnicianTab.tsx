import { useState } from "react";
import { RotateCcw, Plus, Trash2, Info, Settings2 } from "lucide-react";
import { H2ConfigModal } from "./H2ConfigModal";
import type { H2Config } from "../profiles";
import { EditableField } from "./EditableField";
import { ProcessorBadge } from "./ProcessorBadge";
import { ProcessorInfoModal } from "./ProcessorInfoModal";
import { CableRoutingGrid } from "./CableRoutingGrid";
import { GroundSupportDiagram } from "./GroundSupportDiagram";
import type { FullConfig } from "../calculations";
import type { OverrideState } from "../useOverrides";
import { resolve } from "../useOverrides";
import { PROCESSORS, computePanelsPerPort } from "../config";
import type { PanelSpec } from "../panels";
import { useProfile } from "../ProfileContext";
import { term } from "../profiles";

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
  routingMode: "layout" | "data" | "power";
  cableEntry: "top" | "bottom" | "left" | "right";
  dataPortSequences: Record<string, number[]>;
  powerChainSequences: Record<string, number[]>;
  powerMaxWatts: number;
  onRoutingModeChange: (m: "layout" | "data" | "power") => void;
  onCableEntryChange: (e: "top" | "bottom" | "left" | "right") => void;
  onDataPortSequencesChange: (s: Record<string, number[]>) => void;
  onPowerChainSequencesChange: (s: Record<string, number[]>) => void;
  onPowerMaxWattsChange: (w: number) => void;
  powerSizingMode: "operating" | "max";
  onPowerSizingModeChange: (m: "operating" | "max") => void;
  activePanel: PanelSpec;
  blankCells?: number[];
  onBlankCellsChange?: (c: number[]) => void;
  /** Filtered processor list from the active profile (defaults to all if not provided) */
  availableProcessors?: import("../config").ProcessorModel[];
  h2Config?: H2Config | null;
  onH2ConfigSave?: (config: H2Config) => void;
}

export function TechnicianTab({
  calc,
  overrideState,
  processorId,
  onProcessorChange,
  routingMode,
  cableEntry,
  dataPortSequences,
  powerChainSequences,
  powerMaxWatts,
  onRoutingModeChange,
  onCableEntryChange,
  onDataPortSequencesChange,
  onPowerChainSequencesChange,
  onPowerMaxWattsChange,
  powerSizingMode,
  onPowerSizingModeChange,
  activePanel,
  blankCells = [],
  onBlankCellsChange = () => {},
  availableProcessors,
  h2Config,
  onH2ConfigSave,
}: Props) {
  const { dimensions, materials, power, processor } = calc;
  const { overrides, resetAll } = overrideState;
  const anyOverride = Object.keys(overrides).length > 0;

  const effectiveLedSpares = Math.round(Number(resolve("mat_ledSpares", materials.ledSpares, overrides)));

  const profile = useProfile();
  const T = profile.terminology;

  const processorList = availableProcessors ?? PROCESSORS;
  const selectedProcessor = processorList.find((p) => p.id === processorId) ?? processorList[0];
  const panelsPerPort = computePanelsPerPort(
    selectedProcessor.recommendedPerPortPixels ?? 0,
    dimensions.panelPixelsW,
    dimensions.panelPixelsH
  );

  const [customLines, setCustomLines] = useState<CustomLine[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showH2Modal, setShowH2Modal] = useState(false);
  const isH2 = processorId === "h2";

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
                ? `${Math.round(resolve("pixelsW", dimensions.pixelsW, overrides) as number / dimensions.panelPixelsW)} × ${Math.round(resolve("pixelsH", dimensions.pixelsH, overrides) as number / dimensions.panelPixelsH)}`
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
            <EditableField fieldKey="totalWeight" auto={dimensions.activePanels * dimensions.panelWeightKg} overrideState={overrideState} format={(v) => `${Math.round(Number(v))} kg`} />
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
              {processorList.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button onClick={() => setShowModal(true)} title="View full processor specifications"
              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
              <Info size={15} />
            </button>
          </div>
          {isH2 && processor.status === "modular" ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded px-2 py-1">
                ⚙ H2 not configured
              </span>
              <button
                onClick={() => setShowH2Modal(true)}
                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
              >
                <Settings2 size={12} /> Configure H2 cards
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ProcessorBadge processor={processor} />
              {isH2 && (
                <button
                  onClick={() => setShowH2Modal(true)}
                  className="flex items-center gap-1 text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Edit H2 card configuration"
                >
                  <Settings2 size={12} /> Edit H2
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Screen layout / cable routing */}
      {dimensions.activePanels > 0 && (
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <SectionHeader title="Screen Layout" />
          <div className="px-6 py-5">
            <CableRoutingGrid
              columns={dimensions.columns}
              rows={dimensions.rows}
              widthM={dimensions.widthM}
              heightM={dimensions.heightM}
              panelWidthMm={dimensions.panelWidthMm}
              panelHeightMm={dimensions.panelHeightMm}
              pixelPitch={dimensions.pixelPitch}
              activePanels={dimensions.activePanels}
              numPorts={selectedProcessor.ethernetPorts ?? 0}
              panelsPerPort={panelsPerPort}
              panelPowerW={powerSizingMode === "max" ? activePanel.maxPowerW : activePanel.operatingPowerW}
              powerSizingMode={powerSizingMode}
              onPowerSizingModeChange={onPowerSizingModeChange}
              routingMode={routingMode}
              cableEntry={cableEntry}
              dataPortSequences={dataPortSequences}
              powerChainSequences={powerChainSequences}
              powerMaxWatts={powerMaxWatts}
              onModeChange={onRoutingModeChange}
              onCableEntryChange={onCableEntryChange}
              onDataPortSequencesChange={onDataPortSequencesChange}
              onPowerChainSequencesChange={onPowerChainSequencesChange}
              onPowerMaxWattsChange={onPowerMaxWattsChange}
              blankCells={blankCells}
              onBlankCellsChange={onBlankCellsChange}
            />
          </div>
        </section>
      )}

      {/* Material list */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <SectionHeader title="Material List" />
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <MatRow label="LED Flightcases" fieldKey="mat_ledFlightcases" auto={materials.ledFlightcases} overrideState={overrideState} note={`ceil(${dimensions.activePanels} ÷ 10)`} />
          <MatRow label="LED Panels" fieldKey="mat_ledPanels" auto={materials.ledPanels} overrideState={overrideState} />
          <MatRow label={term(T, "powerlinkLabel", "Powerlink 1m")} fieldKey="mat_powerlink1m" auto={materials.powerlink1m} overrideState={overrideState} note="1 per panel" indent />
          <MatRow label={term(T, "datalinkLabel", "Datalink 1m")} fieldKey="mat_datalink1m" auto={materials.datalink1m} overrideState={overrideState} note="1 per panel" indent />
          <MatRow label={term(T, "powerstart10mLabel", "Powerstart 10m")} fieldKey="mat_powerstart10m" auto={materials.powerstart10m} overrideState={overrideState} note="cases × 1" indent />
          <MatRow label={term(T, "powerstart1mLabel", "Powerstart 1m")} fieldKey="mat_powerstart1m" auto={materials.powerstart1m} overrideState={overrideState} note="cases × 1" indent />
          <MatRow label={term(T, "datastartKitLabel", "Datastart KIT (20/10/5/3)")} fieldKey="mat_datastartKit" auto={materials.datastartKit} overrideState={overrideState} note="cases × 2" indent />
          {profile.riggingSystem !== "modular" && (
            <MatRow label={term(T, "etapeLabel", "E-tape rolls")} fieldKey="mat_etapeRolls" auto={materials.etapeRolls} overrideState={overrideState} note="cases × 1" indent />
          )}
          {profile.riggingSystem !== "modular" && (
            <MatRow label={term(T, "fitKitLabel", "FIT KIT (Quickfix + T-Bone)")} fieldKey="mat_fitKit" auto={materials.fitKit} overrideState={overrideState} note="cases × 10" indent />
          )}
          {profile.riggingSystem !== "modular" && (
            <MatRow label={term(T, "neutrikCouplersLabel", "Neutrik Couplers")} fieldKey="mat_neutrikCouplers" auto={materials.neutrikCouplers} overrideState={overrideState} note="fixed" />
          )}
          {profile.riggingSystem !== "modular" && (
            <MatRow label="PROC Flightcase" fieldKey="mat_procFlightcase" auto={materials.procFlightcase} overrideState={overrideState} note="1 per screen" />
          )}
          <MatRow label="LED Spares" fieldKey="mat_ledSpares" auto={materials.ledSpares} overrideState={overrideState} note={`ceil(${dimensions.activePanels} × 10%)`} />
          {profile.riggingSystem === "modular" && (
            <MatRow label="Power link spares" fieldKey="mat_powerlinkSpares" auto={effectiveLedSpares} overrideState={overrideState} note="= LED spares" indent />
          )}
          {profile.riggingSystem === "modular" && (
            <MatRow label="Data link spares" fieldKey="mat_datalinkSpares" auto={effectiveLedSpares} overrideState={overrideState} note="= LED spares" indent />
          )}
          <MatRow
            label={`Processor (${processor.status === "insufficient" ? "upgrade needed" : processor.status === "tight" ? "tight fit" : "OK"})`}
            fieldKey="mat_processor"
            auto={materials.processor}
            overrideState={overrideState}
            accent={processor.status === "insufficient" ? "red" : processor.status === "tight" ? "amber" : undefined}
          />
          <MatRow label="POWER/HDMI/USB-A/UTP kit" fieldKey="mat_powerHdmiUsbUtp" auto={materials.powerHdmiUsbUtp} overrideState={overrideState} indent />
          {profile.riggingSystem === "modular" && (
            <MatRow label="Laptop" fieldKey="mat_laptop" auto={1} overrideState={overrideState} note="fixed" />
          )}
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
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Power &amp; Cabling</span>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-500 dark:text-gray-400 mr-1">Sizing:</span>
            {(["operating", "max"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onPowerSizingModeChange(m)}
                title={m === "operating" ? `${activePanel.operatingPowerW} W/panel — typical mixed content` : `${activePanel.maxPowerW} W/panel — full white, worst case`}
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
        {(() => {
          const panelPowerW = powerSizingMode === "max" ? activePanel.maxPowerW : activePanel.operatingPowerW;

          // Data routing stats from drawn sequences
          const populatedDataChains = Object.values(dataPortSequences).filter((c) => c.length > 0);
          const hasDrawnData = populatedDataChains.length > 0;
          const dataStarts = hasDrawnData
            ? populatedDataChains.length
            : Math.ceil(dimensions.activePanels / Math.max(1, panelsPerPort));
          const dataLinks = hasDrawnData
            ? populatedDataChains.reduce((sum, c) => sum + Math.max(0, c.length - 1), 0)
            : Math.max(0, dimensions.activePanels - dataStarts);

          // Power chain stats from drawn sequences
          const populatedPowerChains = Object.values(powerChainSequences).filter((c) => c.length > 0);
          const hasDrawnPower = populatedPowerChains.length > 0;
          const panelsPerPowerChain = Math.max(1, Math.floor(powerMaxWatts / panelPowerW));
          const powerStarts = hasDrawnPower
            ? populatedPowerChains.length
            : Math.ceil(dimensions.activePanels / panelsPerPowerChain);
          const powerLinks = hasDrawnPower
            ? populatedPowerChains.reduce((sum, c) => sum + Math.max(0, c.length - 1), 0)
            : Math.max(0, dimensions.activePanels - powerStarts);

          const estimated = !hasDrawnData || !hasDrawnPower;

          return (
            <>
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <TechStat label={`Total power (${powerSizingMode})`}>
                  <EditableField fieldKey="pow_totalWatts" auto={power.totalWatts} overrideState={overrideState} format={(v) => `${Math.round(Number(v))} W`} />
                </TechStat>
                <TechStat label="Amps at 240V">
                  <EditableField fieldKey="pow_amps" auto={power.amps} overrideState={overrideState} format={fmtF3} unit="A" />
                </TechStat>
                <TechStat label="13A circuits">
                  <EditableField fieldKey="pow_shukoCircuits" auto={power.circuits} overrideState={overrideState} format={fmtInt} />
                </TechStat>
                <TechStat label={hasDrawnData ? "Data starts" : "Data starts (est.)"}>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{dataStarts}</span>
                </TechStat>
                <TechStat label={hasDrawnData ? "Data links" : "Data links (est.)"}>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{dataLinks}</span>
                </TechStat>
                <TechStat label={hasDrawnPower ? "Power starts" : "Power starts (est.)"}>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{powerStarts}</span>
                </TechStat>
                <TechStat label={hasDrawnPower ? "Power links" : "Power links (est.)"}>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{powerLinks}</span>
                </TechStat>
              </div>
              <div className="mx-4 mb-4 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-500 dark:text-gray-400 font-mono">
                {dimensions.activePanels} panels × {panelPowerW} W ({powerSizingMode}) = {power.totalWatts} W ÷ 240 V = {power.amps.toFixed(3)} A
              </div>
              {estimated && (
                <div className="mx-4 mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
                  Estimated — draw data routing in the Screen Layout section to refine these values
                </div>
              )}
            </>
          );
        })()}
      </section>

      {/* Rigging */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <SectionHeader title={`Rigging — ${T.structureType}`} />
        <div className="p-4">
          {profile.riggingSystem !== "modular" ? (
            <GroundSupportDiagram
              columns={dimensions.columns}
              rows={dimensions.rows}
              panelWidthMm={dimensions.panelWidthMm}
              panelHeightMm={dimensions.panelHeightMm}
              panelWeightKg={dimensions.panelWeightKg}
              profile={profile}
              blankCells={blankCells}
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TechStat label="Panel weight">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {Math.round(dimensions.activePanels * dimensions.panelWeightKg)} kg
                </span>
              </TechStat>
              <TechStat label={`${T.frameConnector}s`}>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{dimensions.columns}</span>
              </TechStat>
              <TechStat label={`${T.panelSupport}s per col.`}>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{dimensions.rows}</span>
              </TechStat>
              <TechStat label="kg per column">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {dimensions.columns > 0
                    ? Math.ceil((dimensions.activePanels * dimensions.panelWeightKg) / dimensions.columns)
                    : 0} kg
                </span>
              </TechStat>
            </div>
          )}
        </div>
      </section>

      {/* Content spec */}
      <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-2">Content Specification</h3>
        <p className="text-sm text-blue-800 dark:text-blue-300 font-mono">
          {calc.contentSpec}
        </p>
      </section>

      {showModal && (
        <ProcessorInfoModal
          processor={selectedProcessor}
          h2Config={isH2 ? h2Config : undefined}
          onClose={() => setShowModal(false)}
        />
      )}
      {showH2Modal && (
        <H2ConfigModal
          initial={h2Config ?? null}
          panelPixels={activePanel.pixelsW * activePanel.pixelsH}
          panelLabel={`${activePanel.pixelPitch} mm`}
          onSave={(cfg) => {
            onH2ConfigSave?.(cfg);
            setShowH2Modal(false);
          }}
          onClose={() => setShowH2Modal(false)}
        />
      )}
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
  accent?: "red" | "amber";
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
              : accent === "amber"
              ? "text-amber-700 dark:text-amber-400 font-medium"
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
