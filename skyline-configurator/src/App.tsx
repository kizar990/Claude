import { useState, useEffect, useMemo, useRef } from "react";
import { InputSection } from "./components/InputSection";
import { DesignerTab } from "./components/DesignerTab";
import { TechnicianTab } from "./components/TechnicianTab";
import { LayoutTab } from "./components/LayoutTab";
import { ProjectDropdown } from "./components/ProjectDropdown";
import { ProfileSwitcher } from "./components/ProfileSwitcher";
import { lazy, Suspense } from "react";
const ClientPdfModal = lazy(() =>
  import("./components/ClientPdfExport").then((m) => ({ default: m.ClientPdfModal }))
);
const TechPdfDownloadButton = lazy(() =>
  import("./components/TechPdfExport").then((m) => ({ default: m.TechPdfDownloadButton }))
);
import { calcAll } from "./calculations";
import { useOverrides } from "./useOverrides";
import {
  listProjects,
  saveProject,
  deleteProject,
  duplicateProject,
  touchProjectLastOpened,
  defaultMeta,
  configFromPanel,
  type ProjectMeta,
  type ScreenInputState,
  type SavedProject,
  type ChainData,
} from "./store";
import { CONFIG, PROCESSORS, computePanelsPerPort } from "./config";
import { PRESET_PANELS, loadCustomPanels, type PanelSpec } from "./panels";
import {
  loadProfiles,
  getActiveProfileId,
  setActiveProfileId,
  profileAvailableProcessors,
  type Profile,
} from "./profiles";

type Tab = "designer" | "technician" | "render";

const DEFAULT_INPUT: ScreenInputState = { columns: 4, rows: 3, blankPanels: 0 };

export default function App() {
  const [darkMode, setDarkMode] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [tab, setTab] = useState<Tab>("designer");
  const [techMode, setTechMode] = useState(false);
  const [input, setInput] = useState<ScreenInputState>(DEFAULT_INPUT);
  const [meta, setMeta] = useState<ProjectMeta>(defaultMeta);
  const [activePanel, setActivePanel] = useState<PanelSpec>(PRESET_PANELS[0]);
  const [projects, setProjects] = useState<SavedProject[]>(() => listProjects());
  const [currentId, setCurrentId] = useState<string>(() => crypto.randomUUID());
  const [blankCells, setBlankCells] = useState<number[]>([]);
  const [chains, setChains] = useState<ChainData[]>([]);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [processorId, setProcessorId] = useState<string>(PROCESSORS[0].id);
  const [routingMode, setRoutingMode] = useState<"layout" | "data" | "power">("layout");
  const [cableEntry, setCableEntry] = useState<"top" | "bottom" | "left" | "right">("bottom");
  const [dataPortSequences, setDataPortSequences] = useState<Record<string, number[]>>({});
  const [powerChainSequences, setPowerChainSequences] = useState<Record<string, number[]>>({});
  const [powerMaxWatts, setPowerMaxWatts] = useState(2400);
  const [powerSizingMode, setPowerSizingMode] = useState<"operating" | "max">("operating");

  // Profile system
  const [profiles, setProfiles] = useState<Profile[]>(() => loadProfiles());
  const [activeProfileId, setActiveProfileIdState] = useState<string>(() => getActiveProfileId());
  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? profiles[0],
    [profiles, activeProfileId]
  );
  const availableProcessors = useMemo(
    () => profileAvailableProcessors(activeProfile),
    [activeProfile]
  );

  function handleSwitchProfile(id: string) {
    setActiveProfileId(id);
    setActiveProfileIdState(id);
    const newProfile = profiles.find((p) => p.id === id);
    if (!newProfile) return;
    // Switch processor if the current one isn't in the new profile's stock
    if (!newProfile.processorStockIds.includes(processorId)) {
      setProcessorId(newProfile.defaultProcessorId);
    }
    // Switch panel if the current one isn't in the new profile's library
    if (!newProfile.panels.find((p) => p.id === activePanel.id)) {
      const defaultPanel =
        newProfile.panels.find((p) => p.id === newProfile.defaultPanelId) ??
        newProfile.panels[0];
      if (defaultPanel) setActivePanel(defaultPanel);
    }
  }

  function handleProfilesChange(updated: Profile[]) {
    setProfiles(updated);
  }

  // Dirty tracking
  const initialized = useRef(false);
  const [isDirty, setIsDirty] = useState(false);
  const markDirty = () => setIsDirty(true);

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return; }
    setIsDirty(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, meta, activePanel, blankCells, chains, processorId, routingMode,
      cableEntry, powerSizingMode, powerMaxWatts]);

  // Project name modals
  const [pendingNameAction, setPendingNameAction] = useState<"save" | "saveas" | null>(null);
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  const overrideState = useOverrides();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const cfg = useMemo(() => configFromPanel(activePanel), [activePanel]);

  const effectivePanelPowerW = powerSizingMode === "max"
    ? cfg.PANEL_MAX_POWER_W
    : cfg.PANEL_OPERATING_POWER_W;

  const calc = useMemo(
    () => calcAll({ ...input, blankPanels: input.blankPanels + blankCells.length }, cfg, processorId, effectivePanelPowerW),
    [input, blankCells, cfg, processorId, effectivePanelPowerW]
  );

  const selectedProcessor = useMemo(
    () => PROCESSORS.find((p) => p.id === processorId) ?? PROCESSORS[0],
    [processorId]
  );
  const panelsPerPort = useMemo(
    () => computePanelsPerPort(
      selectedProcessor.recommendedPerPortPixels ?? 0,
      cfg.PANEL_PIXELS_W,
      cfg.PANEL_PIXELS_H
    ),
    [selectedProcessor, cfg]
  );

  // ── Save helpers ─────────────────────────────────────────────────────────

  function buildProject(id: string, m: ProjectMeta): SavedProject {
    return {
      id,
      savedAt: new Date().toISOString(),
      lastOpenedAt: new Date().toISOString(),
      meta: m,
      input,
      overrides: overrideState.overrides,
      panelWidthMm: activePanel.widthMm,
      panelHeightMm: activePanel.heightMm,
      panelSpec: activePanel,
      blankCells,
      chains,
      processorId,
      routingMode,
      cableEntry,
      dataPortSequences,
      powerChainSequences,
      powerMaxWatts,
      powerSizingMode,
    };
  }

  function commitSave(id: string, m: ProjectMeta) {
    saveProject(buildProject(id, m));
    setProjects(listProjects());
    setIsDirty(false);
  }

  function handleSave() {
    if (!meta.name) {
      setPendingNameAction("save");
      return;
    }
    commitSave(currentId, meta);
  }

  function handleSaveAs() {
    setPendingNameAction("saveas");
  }

  function handleNameConfirm(name: string) {
    const trimmed = name.trim();
    if (pendingNameAction === "saveas") {
      const newId = crypto.randomUUID();
      const newMeta = { ...meta, name: trimmed };
      setCurrentId(newId);
      setMeta(newMeta);
      commitSave(newId, newMeta);
    } else {
      const newMeta = { ...meta, name: trimmed };
      setMeta(newMeta);
      commitSave(currentId, newMeta);
    }
    setPendingNameAction(null);
  }

  function handleNameSkip() {
    // Save without name (only valid for "save" action, not "saveas")
    commitSave(currentId, meta);
    setPendingNameAction(null);
  }

  // ── New project ──────────────────────────────────────────────────────────

  function handleNew() {
    if (isDirty) {
      setShowNewConfirm(true);
    } else {
      doNew();
    }
  }

  function doNew() {
    initialized.current = false;
    setCurrentId(crypto.randomUUID());
    setMeta(defaultMeta());
    setInput(DEFAULT_INPUT);
    setActivePanel(PRESET_PANELS[0]);
    setBlankCells([]);
    setChains([]);
    setProcessorId(PROCESSORS[0].id);
    setRoutingMode("layout");
    setCableEntry("bottom");
    setDataPortSequences({});
    setPowerChainSequences({});
    setPowerMaxWatts(2400);
    setPowerSizingMode("operating");
    overrideState.resetAll();
    setIsDirty(false);
    setShowNewConfirm(false);
  }

  function handleNewSaveFirst() {
    setShowNewConfirm(false);
    if (!meta.name) {
      setPendingNameAction("save");
    } else {
      commitSave(currentId, meta);
      doNew();
    }
  }

  // ── Load ─────────────────────────────────────────────────────────────────

  function handleLoad(p: SavedProject) {
    initialized.current = false;
    setCurrentId(p.id);
    setMeta(p.meta);
    setInput(p.input);
    if (p.panelSpec) {
      if (!p.panelSpec.isPreset) {
        const libPanels = loadCustomPanels();
        const libVersion = libPanels.find((lp) => lp.id === p.panelSpec!.id);
        setActivePanel(libVersion ?? p.panelSpec);
      } else {
        setActivePanel(p.panelSpec);
      }
    } else {
      const found = PRESET_PANELS.find(
        (panel) => panel.widthMm === p.panelWidthMm && panel.heightMm === p.panelHeightMm
      );
      setActivePanel(found ?? PRESET_PANELS[0]);
    }
    setBlankCells(p.blankCells ?? []);
    setChains(p.chains ?? []);
    setProcessorId(p.processorId ?? PROCESSORS[0].id);
    setRoutingMode(p.routingMode ?? "layout");
    setCableEntry(p.cableEntry ?? "bottom");
    setDataPortSequences(p.dataPortSequences ?? {});
    setPowerChainSequences(p.powerChainSequences ?? {});
    setPowerMaxWatts(p.powerMaxWatts ?? 2400);
    setPowerSizingMode(p.powerSizingMode ?? "operating");
    overrideState.resetAll();
    setTimeout(() => {
      Object.entries(p.overrides).forEach(([k, v]) => overrideState.set(k, v));
    }, 0);
    touchProjectLastOpened(p.id);
    setProjects(listProjects());
    setIsDirty(false);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 no-print">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-gray-100">
              SKYLINE{" "}
              <span className="text-blue-600 font-normal text-sm">LED Wall Configurator</span>
            </span>
            <ProfileSwitcher
              profiles={profiles}
              activeProfile={activeProfile}
              onSwitch={handleSwitchProfile}
              onProfilesChange={handleProfilesChange}
            />
          </div>
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
          <Suspense fallback={null}>
            <TechPdfDownloadButton
              meta={meta}
              calc={calc}
              overrides={overrideState.overrides}
              blankCells={blankCells}
              chains={chains}
              dataPortSequences={dataPortSequences}
              powerChainSequences={powerChainSequences}
              numPorts={selectedProcessor.ethernetPorts ?? 0}
              panelsPerPort={panelsPerPort}
              panelPowerW={effectivePanelPowerW}
              panelOperatingPowerW={cfg.PANEL_OPERATING_POWER_W}
              panelMaxPowerW={cfg.PANEL_MAX_POWER_W}
              powerSizingMode={powerSizingMode}
              powerMaxWatts={powerMaxWatts}
              cableEntry={cableEntry}
            />
          </Suspense>
          <button
            onClick={() => setShowPdfModal(true)}
            className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            PDF
          </button>

          <ProjectDropdown
            projectName={meta.name}
            isDirty={isDirty}
            projects={projects}
            onSave={handleSave}
            onSaveAs={handleSaveAs}
            onNew={handleNew}
            onLoad={handleLoad}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
          />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4">
        <main className="space-y-4">
          <InputSection
            input={input}
            meta={meta}
            activePanel={activePanel}
            onPanelChange={(p) => { setActivePanel(p); markDirty(); }}
            onInputChange={(i) => { setInput(i); markDirty(); }}
            onMetaChange={(m) => { setMeta(m); markDirty(); }}
            darkMode={darkMode}
            onDarkToggle={() => setDarkMode((d) => !d)}
            libraryPanels={activeProfile.panels}
          />

          {tab === "designer" && (
            <DesignerTab
              calc={calc}
              overrideState={overrideState}
              processorId={processorId}
              powerSizingMode={powerSizingMode}
              onPowerSizingModeChange={(m) => { setPowerSizingMode(m); markDirty(); }}
            />
          )}

          {tab === "technician" && techMode && (
            <TechnicianTab
              calc={calc}
              overrideState={overrideState}
              processorId={processorId}
              onProcessorChange={(id) => { setProcessorId(id); markDirty(); }}
              routingMode={routingMode}
              cableEntry={cableEntry}
              dataPortSequences={dataPortSequences}
              powerChainSequences={powerChainSequences}
              powerMaxWatts={powerMaxWatts}
              onRoutingModeChange={(m) => { setRoutingMode(m); markDirty(); }}
              onCableEntryChange={(e) => { setCableEntry(e); markDirty(); }}
              onDataPortSequencesChange={(s) => { setDataPortSequences(s); markDirty(); }}
              onPowerChainSequencesChange={(s) => { setPowerChainSequences(s); markDirty(); }}
              onPowerMaxWattsChange={(w) => { setPowerMaxWatts(w); markDirty(); }}
              powerSizingMode={powerSizingMode}
              onPowerSizingModeChange={(m) => { setPowerSizingMode(m); markDirty(); }}
              activePanel={activePanel}
              availableProcessors={availableProcessors}
            />
          )}

          {tab === "render" && (
            <LayoutTab
              columns={input.columns}
              rows={input.rows}
              blankCells={blankCells}
              chains={chains}
              onBlankCellsChange={(c) => { setBlankCells(c); markDirty(); }}
              onChainsChange={(c) => { setChains(c); markDirty(); }}
            />
          )}
        </main>
      </div>

      {/* Name prompt modal */}
      {pendingNameAction && (
        <NamePromptModal
          initial={pendingNameAction === "saveas" ? meta.name : ""}
          required={pendingNameAction === "saveas"}
          onConfirm={handleNameConfirm}
          onSkip={pendingNameAction === "save" ? handleNameSkip : undefined}
          onCancel={() => setPendingNameAction(null)}
        />
      )}

      {/* New project confirmation modal */}
      {showNewConfirm && (
        <NewProjectConfirmModal
          onSave={handleNewSaveFirst}
          onDiscard={doNew}
          onCancel={() => setShowNewConfirm(false)}
        />
      )}

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

// ── Inline modals ─────────────────────────────────────────────────────────────

function NamePromptModal({
  initial,
  required,
  onConfirm,
  onSkip,
  onCancel,
}: {
  initial: string;
  required: boolean;
  onConfirm: (name: string) => void;
  onSkip?: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-96 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">
          {required ? "Name this copy" : "Name this project"}
        </h3>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onConfirm(name.trim()); }}
          placeholder="e.g. Clivet Group Installer Show 26"
          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            Cancel
          </button>
          {!required && onSkip && (
            <button
              onClick={onSkip}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              Save unnamed
            </button>
          )}
          <button
            onClick={() => { if (name.trim()) onConfirm(name.trim()); }}
            disabled={!name.trim()}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function NewProjectConfirmModal({
  onSave,
  onDiscard,
  onCancel,
}: {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-96 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Save before starting new?</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You have unsaved changes. Save them before creating a new project?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            Discard
          </button>
          <button
            onClick={onSave}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
