import { useState, useEffect, useMemo } from "react";
import { Save, FilePlus } from "lucide-react";
import { InputSection } from "./components/InputSection";
import { DesignerTab } from "./components/DesignerTab";
import { TechnicianTab } from "./components/TechnicianTab";
import { LayoutTab } from "./components/LayoutTab";
import { SaveSidebar } from "./components/SaveSidebar";
import { lazy, Suspense } from "react";
const ClientPdfModal = lazy(() =>
  import("./components/ClientPdfExport").then((m) => ({ default: m.ClientPdfModal }))
);
const TechPdfDownloadButton = lazy(() =>
  import("./components/TechPdfExport").then((m) => ({ default: m.TechPdfDownloadButton }))
);
import { TechPrintButton } from "./components/TechPrintout";
import { calcAll } from "./calculations";
import { useOverrides } from "./useOverrides";
import {
  listProjects,
  saveProject,
  deleteProject,
  duplicateProject,
  defaultMeta,
  configFromPanelSize,
  type ProjectMeta,
  type ScreenInputState,
  type SavedProject,
  type ChainData,
} from "./store";
import { CONFIG, PROCESSORS, computePanelsPerPort } from "./config";

type Tab = "designer" | "technician" | "render";

const DEFAULT_INPUT: ScreenInputState = { columns: 7, rows: 3, blankPanels: 0 };

export default function App() {
  const [darkMode, setDarkMode] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [tab, setTab] = useState<Tab>("designer");
  const [techMode, setTechMode] = useState(false);
  const [input, setInput] = useState<ScreenInputState>(DEFAULT_INPUT);
  const [meta, setMeta] = useState<ProjectMeta>(defaultMeta);
  const [panelW, setPanelW] = useState<number>(CONFIG.PANEL_WIDTH_MM);
  const [panelH, setPanelH] = useState<number>(CONFIG.PANEL_HEIGHT_MM);
  const [projects, setProjects] = useState<SavedProject[]>(() => listProjects());
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentId, setCurrentId] = useState<string>(() => crypto.randomUUID());
  const [blankCells, setBlankCells] = useState<number[]>([]);
  const [chains, setChains] = useState<ChainData[]>([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [processorId, setProcessorId] = useState<string>(PROCESSORS[0].id);
  const [routingMode, setRoutingMode] = useState<"layout" | "data" | "power">("layout");
  const [dataPortSequences, setDataPortSequences] = useState<Record<string, number[]>>({});
  const [powerChainSequences, setPowerChainSequences] = useState<Record<string, number[]>>({});
  const [powerMaxWatts, setPowerMaxWatts] = useState(2400);

  const overrideState = useOverrides();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const cfg = useMemo(() => configFromPanelSize(panelW, panelH), [panelW, panelH]);

  const calc = useMemo(
    () => calcAll({ ...input, blankPanels: input.blankPanels + blankCells.length }, cfg, processorId),
    [input, blankCells, cfg, processorId]
  );

  const selectedProcessor = useMemo(
    () => PROCESSORS.find((p) => p.id === processorId) ?? PROCESSORS[0],
    [processorId]
  );
  const panelsPerPort = useMemo(
    () => computePanelsPerPort(selectedProcessor.pixelsPerPort, CONFIG.PANEL_PIXELS_W, CONFIG.PANEL_PIXELS_H),
    [selectedProcessor]
  );

  function handleSave() {
    const project: SavedProject = {
      id: currentId,
      savedAt: new Date().toISOString(),
      meta,
      input,
      overrides: overrideState.overrides,
      panelWidthMm: panelW,
      panelHeightMm: panelH,
      blankCells,
      chains,
      processorId,
      routingMode,
      dataPortSequences,
      powerChainSequences,
      powerMaxWatts,
    };
    saveProject(project);
    setProjects(listProjects());
  }

  function handleLoad(p: SavedProject) {
    setCurrentId(p.id);
    setMeta(p.meta);
    setInput(p.input);
    setPanelW(p.panelWidthMm);
    setPanelH(p.panelHeightMm);
    setBlankCells(p.blankCells ?? []);
    setChains(p.chains ?? []);
    setProcessorId(p.processorId ?? PROCESSORS[0].id);
    setRoutingMode(p.routingMode ?? "layout");
    setDataPortSequences(p.dataPortSequences ?? {});
    setPowerChainSequences(p.powerChainSequences ?? {});
    setPowerMaxWatts(p.powerMaxWatts ?? 2400);
    overrideState.resetAll();
    setTimeout(() => {
      Object.entries(p.overrides).forEach(([k, v]) => overrideState.set(k, v));
    }, 0);
    setShowSidebar(false);
  }

  function handleDelete(id: string) {
    deleteProject(id);
    setProjects(listProjects());
  }

  function handleDuplicate(id: string) {
    const dup = duplicateProject(id);
    if (dup) {
      saveProject(dup);
      setProjects(listProjects());
    }
  }

  function handleNew() {
    if (!confirm("Start a new project? Unsaved changes will be lost.")) return;
    setCurrentId(crypto.randomUUID());
    setMeta(defaultMeta());
    setInput(DEFAULT_INPUT);
    setPanelW(CONFIG.PANEL_WIDTH_MM);
    setPanelH(CONFIG.PANEL_HEIGHT_MM);
    setBlankCells([]);
    setChains([]);
    setProcessorId(PROCESSORS[0].id);
    overrideState.resetAll();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 no-print">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
          <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-gray-100">
            SKYLINE{" "}
            <span className="text-blue-600 font-normal text-sm">LED Wall Configurator</span>
          </span>
          <div className="flex-1" />

          {/* Tabs */}
          <nav className="flex gap-1">
            {(["designer", ...(techMode ? ["technician" as Tab] : []), "render"] as Tab[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                    tab === t
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {t === "designer" ? "Designer / PM" : t === "technician" ? "Technician" : "Layout"}
                </button>
              )
            )}
          </nav>

          {/* Technician mode toggle */}
          <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
            <span className="relative inline-block w-8 h-4">
              <input
                type="checkbox"
                checked={techMode}
                onChange={(e) => {
                  setTechMode(e.target.checked);
                  if (e.target.checked) setTab("technician");
                  else if (tab === "technician") setTab("designer");
                }}
                className="sr-only peer"
              />
              <span className="absolute inset-0 rounded-full bg-gray-200 dark:bg-gray-700 peer-checked:bg-blue-600 transition-colors" />
              <span className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
            </span>
            Technician mode
          </label>

          {/* Actions */}
          <TechPrintButton
            meta={meta}
            calc={calc}
            overrides={overrideState.overrides}
            blankCells={blankCells}
            chains={chains}
          />
          <Suspense fallback={null}>
            <TechPdfDownloadButton
              meta={meta}
              calc={calc}
              overrides={overrideState.overrides}
              blankCells={blankCells}
              chains={chains}
              dataPortSequences={dataPortSequences}
              powerChainSequences={powerChainSequences}
              numPorts={selectedProcessor.ports}
              panelsPerPort={panelsPerPort}
              panelPowerW={CONFIG.PANEL_POWER_W}
              powerMaxWatts={powerMaxWatts}
            />
          </Suspense>
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            PDF
          </button>
          <button
            onClick={handleNew}
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <FilePlus size={13} /> New
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium"
          >
            <Save size={13} /> Save
          </button>
          <button
            onClick={() => setShowSidebar((s) => !s)}
            className="text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Projects{projects.length > 0 ? ` (${projects.length})` : ""}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 flex gap-4">
        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-4">
          <InputSection
            input={input}
            meta={meta}
            panelWidthMm={panelW}
            panelHeightMm={panelH}
            onInputChange={setInput}
            onMetaChange={setMeta}
            onPanelSizeChange={(w, h) => {
              setPanelW(w);
              setPanelH(h);
            }}
            darkMode={darkMode}
            onDarkToggle={() => setDarkMode((d) => !d)}
          />

          {tab === "designer" && (
            <DesignerTab calc={calc} overrideState={overrideState} />
          )}

          {tab === "technician" && techMode && (
            <TechnicianTab
              calc={calc}
              overrideState={overrideState}
              processorId={processorId}
              onProcessorChange={setProcessorId}
              routingMode={routingMode}
              dataPortSequences={dataPortSequences}
              powerChainSequences={powerChainSequences}
              powerMaxWatts={powerMaxWatts}
              onRoutingModeChange={setRoutingMode}
              onDataPortSequencesChange={setDataPortSequences}
              onPowerChainSequencesChange={setPowerChainSequences}
              onPowerMaxWattsChange={setPowerMaxWatts}
            />
          )}

          {tab === "render" && (
            <LayoutTab
              columns={input.columns}
              rows={input.rows}
              blankCells={blankCells}
              chains={chains}
              onBlankCellsChange={setBlankCells}
              onChainsChange={setChains}
            />
          )}
        </main>

        {/* Saved projects sidebar */}
        {showSidebar && (
          <aside className="w-56 shrink-0">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sticky top-16">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Saved Projects
              </h3>
              <SaveSidebar
                projects={projects}
                onLoad={handleLoad}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            </div>
          </aside>
        )}
      </div>

      {showPdfModal && (
        <Suspense fallback={null}>
        <ClientPdfModal
          meta={meta}
          calc={calc}
          overrides={overrideState.overrides}
          blankCells={blankCells}
          chains={chains}
          companyName={CONFIG.COMPANY_NAME}
          onClose={() => setShowPdfModal(false)}
        />
        </Suspense>
      )}
    </div>
  );
}
