import { useState, useRef, useEffect } from "react";
import { X, MoreVertical } from "lucide-react";
import {
  PRESET_PANELS,
  loadCustomPanels,
  addCustomPanel,
  deleteCustomPanel,
  defaultOperatingPower,
  type PanelSpec,
} from "../panels";

interface Props {
  activePanel: PanelSpec;
  onSelect: (p: PanelSpec) => void;
  onClose: () => void;
}

interface FormState {
  name: string;
  pixelPitch: string;
  widthMm: string;
  heightMm: string;
  pixelsW: string;
  pixelsH: string;
  maxPowerW: string;
  operatingPowerW: string;
  weightKg: string;
}

const EMPTY_FORM: FormState = {
  name: "", pixelPitch: "", widthMm: "", heightMm: "",
  pixelsW: "", pixelsH: "", maxPowerW: "", operatingPowerW: "", weightKg: "",
};

function panelToForm(panel: PanelSpec): FormState {
  return {
    name: panel.name,
    pixelPitch: String(panel.pixelPitch),
    widthMm: String(panel.widthMm),
    heightMm: String(panel.heightMm),
    pixelsW: String(panel.pixelsW),
    pixelsH: String(panel.pixelsH),
    maxPowerW: String(panel.maxPowerW),
    operatingPowerW: String(panel.operatingPowerW),
    weightKg: String(panel.weightKg),
  };
}

export function PanelPicker({ activePanel, onSelect, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [customPanels, setCustomPanels] = useState<PanelSpec[]>(() => loadCustomPanels());
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pitchWarning, setPitchWarning] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (mode !== "list") { setMode("list"); }
        else { onClose(); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, mode]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-panel-menu]")) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = "Required";
    const pitch = parseFloat(form.pixelPitch);
    if (!pitch || pitch <= 0) errors.pixelPitch = "Must be > 0";
    const w = parseFloat(form.widthMm);
    if (!w || w <= 0) errors.widthMm = "Must be > 0";
    const h = parseFloat(form.heightMm);
    if (!h || h <= 0) errors.heightMm = "Must be > 0";
    const pw = parseInt(form.pixelsW);
    if (!pw || pw <= 0) errors.pixelsW = "Must be > 0";
    const ph = parseInt(form.pixelsH);
    if (!ph || ph <= 0) errors.pixelsH = "Must be > 0";
    const maxP = parseFloat(form.maxPowerW);
    if (!maxP || maxP <= 0) errors.maxPowerW = "Must be > 0";
    const wkg = parseFloat(form.weightKg);
    if (!wkg || wkg <= 0) errors.weightKg = "Must be > 0";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function checkPitchWarning(f: FormState) {
    const pitch = parseFloat(f.pixelPitch);
    const pw = parseInt(f.pixelsW);
    const wMm = parseFloat(f.widthMm);
    const ph = parseInt(f.pixelsH);
    const hMm = parseFloat(f.heightMm);
    if (pitch > 0 && pw > 0 && wMm > 0 && ph > 0 && hMm > 0) {
      const expectedW = pw * pitch;
      const expectedH = ph * pitch;
      const warnW = expectedW > wMm * 1.15 || expectedW < wMm * 0.7;
      const warnH = expectedH > hMm * 1.15 || expectedH < hMm * 0.7;
      setPitchWarning(warnW || warnH);
    } else {
      setPitchWarning(false);
    }
  }

  function updateForm(field: keyof FormState, value: string) {
    const next = { ...form, [field]: value };
    setForm(next);
    checkPitchWarning(next);
    if (formErrors[field]) {
      setFormErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    }
  }

  function buildPanel(id: string, isPreset: boolean): PanelSpec {
    const maxP = parseFloat(form.maxPowerW);
    const opP = form.operatingPowerW.trim()
      ? parseFloat(form.operatingPowerW)
      : defaultOperatingPower(maxP);
    return {
      id,
      name: form.name.trim(),
      pixelPitch: parseFloat(form.pixelPitch),
      widthMm: parseFloat(form.widthMm),
      heightMm: parseFloat(form.heightMm),
      pixelsW: parseInt(form.pixelsW),
      pixelsH: parseInt(form.pixelsH),
      maxPowerW: maxP,
      operatingPowerW: opP,
      weightKg: parseFloat(form.weightKg),
      isPreset,
    };
  }

  function handleUseForProject() {
    if (!validateForm()) return;
    const panel = buildPanel(editId ?? crypto.randomUUID(), false);
    onSelect(panel);
  }

  function handleSaveToLibrary() {
    if (!validateForm()) return;
    const id = editId ?? crypto.randomUUID();
    const panel = buildPanel(id, false);
    addCustomPanel(panel);
    const updated = loadCustomPanels();
    setCustomPanels(updated);
    onSelect(panel);
  }

  function handleStartEdit(panel: PanelSpec) {
    setEditId(panel.id);
    setForm(panelToForm(panel));
    setPitchWarning(false);
    setFormErrors({});
    setMode("edit");
    setMenuOpenId(null);
  }

  function handleDuplicate(panel: PanelSpec) {
    const newPanel: PanelSpec = {
      ...panel,
      id: crypto.randomUUID(),
      name: `${panel.name} (copy)`,
      isPreset: false,
    };
    addCustomPanel(newPanel);
    setCustomPanels(loadCustomPanels());
    setMenuOpenId(null);
  }

  function handleDelete(id: string) {
    deleteCustomPanel(id);
    setCustomPanels(loadCustomPanels());
    setDeleteConfirmId(null);
    setMenuOpenId(null);
  }

  function handleAddNew() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setPitchWarning(false);
    setFormErrors({});
    setMode("add");
  }

  const isFormMode = mode === "add" || mode === "edit";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Select panel"
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-full max-w-md outline-none flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {mode === "add" ? "Add custom panel" : mode === "edit" ? "Edit panel" : "Select Panel"}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {!isFormMode ? (
            /* ── Panel list ── */
            <div className="space-y-4">
              {/* Presets */}
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Presets</p>
                <div className="space-y-1.5">
                  {PRESET_PANELS.map((panel) => (
                    <PanelCard
                      key={panel.id}
                      panel={panel}
                      isActive={panel.id === activePanel.id}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </div>

              {/* Custom panels */}
              {customPanels.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Your Panels</p>
                  <div className="space-y-1.5">
                    {customPanels.map((panel) => (
                      <div key={panel.id} className="relative">
                        {deleteConfirmId === panel.id ? (
                          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
                            <span className="text-xs text-red-700 dark:text-red-400">Delete "{panel.name}"?</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-xs px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDelete(panel.id)}
                                className="text-xs px-2 py-0.5 rounded bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <PanelCard
                            panel={panel}
                            isActive={panel.id === activePanel.id}
                            onSelect={onSelect}
                            menuContent={
                              <div className="relative" data-panel-menu>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenId(menuOpenId === panel.id ? null : panel.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {menuOpenId === panel.id && (
                                  <div className="absolute right-0 top-6 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-28">
                                    <button
                                      onClick={() => handleStartEdit(panel)}
                                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDuplicate(panel)}
                                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                      Duplicate
                                    </button>
                                    <button
                                      onClick={() => { setDeleteConfirmId(panel.id); setMenuOpenId(null); }}
                                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add custom button */}
              <button
                onClick={handleAddNew}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                + Add custom panel
              </button>
            </div>
          ) : (
            /* ── Panel form ── */
            <div className="space-y-3">
              <FormField label="Panel name" error={formErrors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder="e.g. Absen A156 P2.6"
                  className={fieldCls(!!formErrors.name)}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Pixel pitch (mm)" error={formErrors.pixelPitch}>
                  <input
                    type="number" step="0.1" min="0.1"
                    value={form.pixelPitch}
                    onChange={(e) => updateForm("pixelPitch", e.target.value)}
                    placeholder="e.g. 2.6"
                    className={fieldCls(!!formErrors.pixelPitch)}
                  />
                </FormField>
                <FormField label="Weight (kg)" error={formErrors.weightKg}>
                  <input
                    type="number" step="0.1" min="0.1"
                    value={form.weightKg}
                    onChange={(e) => updateForm("weightKg", e.target.value)}
                    placeholder="e.g. 8.5"
                    className={fieldCls(!!formErrors.weightKg)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Physical width (mm)" error={formErrors.widthMm}>
                  <input
                    type="number" min="1"
                    value={form.widthMm}
                    onChange={(e) => updateForm("widthMm", e.target.value)}
                    placeholder="e.g. 500"
                    className={fieldCls(!!formErrors.widthMm)}
                  />
                </FormField>
                <FormField label="Physical height (mm)" error={formErrors.heightMm}>
                  <input
                    type="number" min="1"
                    value={form.heightMm}
                    onChange={(e) => updateForm("heightMm", e.target.value)}
                    placeholder="e.g. 500"
                    className={fieldCls(!!formErrors.heightMm)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Pixel width (px)" error={formErrors.pixelsW}>
                  <input
                    type="number" min="1"
                    value={form.pixelsW}
                    onChange={(e) => updateForm("pixelsW", e.target.value)}
                    placeholder="e.g. 192"
                    className={fieldCls(!!formErrors.pixelsW)}
                  />
                </FormField>
                <FormField label="Pixel height (px)" error={formErrors.pixelsH}>
                  <input
                    type="number" min="1"
                    value={form.pixelsH}
                    onChange={(e) => updateForm("pixelsH", e.target.value)}
                    placeholder="e.g. 192"
                    className={fieldCls(!!formErrors.pixelsH)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Max power (W)" error={formErrors.maxPowerW}>
                  <input
                    type="number" min="1"
                    value={form.maxPowerW}
                    onChange={(e) => updateForm("maxPowerW", e.target.value)}
                    placeholder="e.g. 200"
                    className={fieldCls(!!formErrors.maxPowerW)}
                  />
                </FormField>
                <FormField label="Operating power (W)" error={formErrors.operatingPowerW}>
                  <input
                    type="number" min="1"
                    value={form.operatingPowerW}
                    onChange={(e) => updateForm("operatingPowerW", e.target.value)}
                    placeholder="auto (max × 0.6)"
                    className={fieldCls(!!formErrors.operatingPowerW)}
                  />
                </FormField>
              </div>

              {pitchWarning && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Pitch x pixel count does not exactly match physical dimensions. Please verify.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isFormMode && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 justify-end shrink-0">
            <button
              onClick={() => { setMode("list"); setFormErrors({}); setPitchWarning(false); }}
              className="text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleUseForProject}
              className="text-xs px-3 py-1.5 rounded border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Use for this project
            </button>
            <button
              onClick={handleSaveToLibrary}
              className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium"
            >
              Save to library
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PanelCard({
  panel,
  isActive,
  onSelect,
  menuContent,
}: {
  panel: PanelSpec;
  isActive: boolean;
  onSelect: (p: PanelSpec) => void;
  menuContent?: React.ReactNode;
}) {
  return (
    <div
      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors flex items-start justify-between gap-2 ${
        isActive
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      <button
        className="flex-1 text-left"
        onClick={() => onSelect(panel)}
      >
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {!panel.isPreset && <span className="text-blue-500 mr-1">◆</span>}
          {panel.name}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {panel.widthMm}×{panel.heightMm}mm · {panel.pixelsW}×{panel.pixelsH}px · P{panel.pixelPitch} · {panel.operatingPowerW}W op
        </p>
      </button>
      {menuContent}
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

function fieldCls(hasError: boolean) {
  return `text-sm border rounded px-2 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-100 w-full ${
    hasError
      ? "border-red-400 dark:border-red-500"
      : "border-gray-200 dark:border-gray-700"
  }`;
}
