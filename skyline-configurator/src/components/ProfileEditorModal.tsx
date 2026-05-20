import { useState, useRef } from "react";
import { X } from "lucide-react";
import type { Profile, ProfileTerminology } from "../profiles";
import { fileToDataUrl, extractDominantColor } from "../profiles";

const TERM_FIELDS: { key: keyof ProfileTerminology; label: string; placeholder: string }[] = [
  { key: "frameConnector",        label: "Frame connector",      placeholder: "Quick Fix / Bridge Clamp" },
  { key: "panelSupport",          label: "Panel support",        placeholder: "UTP / Pickup Point" },
  { key: "structureType",         label: "Structure type",       placeholder: "Omega 55 / Trussing" },
  { key: "fitKitLabel",           label: "Fit kit",              placeholder: "FIT KIT (Quickfix + T-Bone)" },
  { key: "datastartKitLabel",     label: "Datastart kit",        placeholder: "Datastart KIT (20/10/5/3)" },
  { key: "neutrikCouplersLabel",  label: "Neutrik couplers",     placeholder: "Neutrik Couplers" },
  { key: "powerlinkLabel",        label: "Powerlink 1m",         placeholder: "Powerlink 1m" },
  { key: "datalinkLabel",         label: "Datalink 1m",          placeholder: "Datalink 1m" },
  { key: "powerstart10mLabel",    label: "Powerstart 10m",       placeholder: "Powerstart 10m" },
  { key: "powerstart1mLabel",     label: "Powerstart 1m",        placeholder: "Powerstart 1m" },
  { key: "etapeLabel",            label: "E-tape",               placeholder: "E-tape rolls" },
];

interface Props {
  profile: Profile;
  onSave: (updated: Profile) => void;
  onCancel: () => void;
}

export function ProfileEditorModal({ profile, onSave, onCancel }: Props) {
  const [name, setName] = useState(profile.name);
  const [accentColor, setAccentColor] = useState(profile.accentColor);
  const [logoDataUrl, setLogoDataUrl] = useState(profile.logo ?? "");
  const [riggingSystem, setRiggingSystem] = useState(profile.riggingSystem);
  const [chainBudget, setChainBudget] = useState(String(profile.chainBudgetDefault));
  const [terminology, setTerminology] = useState<ProfileTerminology>({ ...profile.terminology });
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoFile(file: File) {
    const dataUrl = await fileToDataUrl(file);
    setLogoDataUrl(dataUrl);
    const color = await extractDominantColor(dataUrl);
    setAccentColor(color);
  }

  function setTerm(key: keyof ProfileTerminology, value: string) {
    setTerminology((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({
      ...profile,
      name: trimmed,
      accentColor,
      logo: logoDataUrl || undefined,
      riggingSystem,
      chainBudgetDefault: Math.max(100, parseInt(chainBudget) || profile.chainBudgetDefault),
      terminology,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[520px] max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Edit profile</h3>
          <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Profile name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Logo & colour */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Logo &amp; accent colour</label>
            <div className="mt-1.5 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {logoDataUrl ? "Change logo" : "Upload logo"}
              </button>
              {logoDataUrl && (
                <>
                  <img src={logoDataUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                  <button type="button" onClick={() => setLogoDataUrl("")} className="text-xs text-red-500 hover:text-red-700">
                    Remove
                  </button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoFile(f); }}
              />
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-xs text-gray-500 dark:text-gray-400">Accent:</label>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border border-gray-200 dark:border-gray-600 p-0.5 bg-white"
                  title="Accent colour"
                />
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{accentColor}</span>
              </div>
            </div>
          </div>

          {/* Rigging system */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Rigging system</label>
            <div className="mt-1.5 flex gap-2">
              {(["modular", "scaffolding", "custom"] as const).map((sys) => (
                <button
                  key={sys}
                  type="button"
                  onClick={() => setRiggingSystem(sys)}
                  className={`text-xs px-3 py-1.5 rounded border font-medium capitalize transition-colors ${
                    riggingSystem === sys
                      ? "text-white border-transparent"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  style={riggingSystem === sys ? { backgroundColor: accentColor } : undefined}
                >
                  {sys}
                </button>
              ))}
            </div>
          </div>

          {/* Power chain budget */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Power chain budget (W)</label>
            <input
              type="number"
              min={100}
              max={9999}
              step={100}
              value={chainBudget}
              onChange={(e) => setChainBudget(e.target.value)}
              className="mt-1 w-32 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Max watts per power chain, used for power routing calculations
            </p>
          </div>

          {/* Terminology */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Terminology overrides</label>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 mb-2.5">
              Override default labels in the UI and tech PDF. Leave blank to use the default.
            </p>
            <div className="space-y-1.5">
              {TERM_FIELDS.map(({ key, label, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-36 shrink-0">{label}</span>
                  <input
                    type="text"
                    value={(terminology[key] as string) ?? ""}
                    onChange={(e) => setTerm(key, e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-300 dark:placeholder-gray-600"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-1.5 text-sm text-white rounded-lg disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: accentColor }}
          >
            Save changes
          </button>
        </div>

      </div>
    </div>
  );
}
