import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Copy, Trash2, Settings } from "lucide-react";
import type { Profile } from "../profiles";
import {
  SKYLINE_PROFILE,
  MTA_PROFILE,
  blankProfile,
  duplicateProfile,
  saveCustomProfile,
} from "../profiles";

interface Props {
  profiles: Profile[];
  activeProfile: Profile;
  onSwitch: (id: string) => void;
  onProfilesChange: (profiles: Profile[]) => void;
}

type Template = "skyline" | "mta" | "blank" | "copy";

function ProfileAvatar({ profile, size = 20 }: { profile: Profile; size?: number }) {
  if (profile.logo) {
    return (
      <img
        src={profile.logo}
        alt={profile.name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0"
      />
    );
  }
  const initials = profile.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0 select-none"
      style={{ width: size, height: size, fontSize: size * 0.38, backgroundColor: profile.accentColor }}
    >
      {initials}
    </span>
  );
}

export { ProfileAvatar };

export function ProfileSwitcher({ profiles, activeProfile, onSwitch, onProfilesChange }: Props) {
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function handleDelete(id: string) {
    if (!confirm("Delete this profile? This cannot be undone.")) return;
    import("../profiles").then(({ deleteProfile }) => {
      deleteProfile(id);
      // Reload profiles and switch away if deleting active
      import("../profiles").then(({ loadProfiles }) => {
        const updated = loadProfiles();
        onProfilesChange(updated);
        if (id === activeProfile.id) {
          onSwitch(updated[0].id);
        }
      });
    });
  }

  function handleDuplicate(id: string) {
    const dup = duplicateProfile(id);
    if (!dup) return;
    saveCustomProfile(dup);
    import("../profiles").then(({ loadProfiles }) => {
      onProfilesChange(loadProfiles());
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <ProfileAvatar profile={activeProfile} size={16} />
        <span className="max-w-28 truncate font-medium">{activeProfile.name}</span>
        <ChevronDown size={11} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Active profile</p>
            <div className="flex items-center gap-2 mt-1">
              <ProfileAvatar profile={activeProfile} size={20} />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activeProfile.name}</p>
            </div>
          </div>

          <div className="py-1 max-h-64 overflow-y-auto">
            {profiles.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-3 py-2 group hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                  p.id === activeProfile.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <button
                  className="flex items-center gap-2 flex-1 min-w-0"
                  onClick={() => { onSwitch(p.id); setOpen(false); }}
                >
                  <ProfileAvatar profile={p} size={20} />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                      {p.riggingSystem}{p.isBuiltIn ? " · built-in" : ""}
                    </p>
                  </div>
                </button>
                {!p.isBuiltIn && (
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleDuplicate(p.id)}
                      title="Duplicate"
                      className="p-1 text-gray-400 hover:text-blue-500 rounded"
                    >
                      <Copy size={11} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      title="Delete"
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
                {p.isBuiltIn && (
                  <button
                    onClick={() => handleDuplicate(p.id)}
                    title="Copy to create custom profile"
                    className="p-1 text-gray-300 dark:text-gray-600 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rounded"
                  >
                    <Copy size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 py-1">
            <button
              onClick={() => { setShowCreate(true); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Plus size={13} className="text-gray-400" /> Create new profile
            </button>
            <button
              onClick={() => { /* Stage 4: full profile editor */ setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-not-allowed"
              title="Full profile editor — coming in a future update"
            >
              <Settings size={13} className="text-gray-300 dark:text-gray-600" /> Edit current profile
              <span className="ml-auto text-xs text-gray-300 dark:text-gray-600">soon</span>
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <ProfileCreateModal
          profiles={profiles}
          onCreate={(p) => {
            saveCustomProfile(p);
            import("../profiles").then(({ loadProfiles }) => {
              onProfilesChange(loadProfiles());
              onSwitch(p.id);
            });
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

// ── Profile create modal ──────────────────────────────────────────────────────

function ProfileCreateModal({
  profiles,
  onCreate,
  onCancel,
}: {
  profiles: Profile[];
  onCreate: (p: Profile) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [template, setTemplate] = useState<Template>("skyline");
  const [copyFromId, setCopyFromId] = useState(profiles[0]?.id ?? "");

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;

    let base: Profile;
    if (template === "skyline") base = { ...SKYLINE_PROFILE };
    else if (template === "mta") base = { ...MTA_PROFILE };
    else if (template === "copy") {
      const src = profiles.find((p) => p.id === copyFromId);
      base = src ? { ...src } : { ...blankProfile() };
    } else {
      base = blankProfile();
    }

    onCreate({
      ...base,
      id: crypto.randomUUID(),
      name: trimmed,
      isBuiltIn: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  const TEMPLATES: { id: Template; label: string; desc: string }[] = [
    { id: "skyline", label: "Modular system", desc: "Omega frames, Quick Fix, UTP — Skyline-style" },
    { id: "mta",     label: "Scaffolding system", desc: "Trussing, bridge clamps, sandbags — MTA-style" },
    { id: "blank",   label: "Blank", desc: "Start from scratch with no kit list" },
    { id: "copy",    label: "Copy existing", desc: "Duplicate an existing profile as a starting point" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-[420px] space-y-5">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base">Create new profile</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Profiles hold your branding, panel library, processor stock, and kit list.
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Profile name</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleCreate(); }}
            placeholder="e.g. Skyline Whitespace, MTA International…"
            className="mt-1 w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Starting template</label>
          <div className="mt-1.5 space-y-1.5">
            {TEMPLATES.map((t) => (
              <label key={t.id} className="flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700">
                <input
                  type="radio"
                  name="template"
                  value={t.id}
                  checked={template === t.id}
                  onChange={() => setTemplate(t.id)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</p>
                </div>
              </label>
            ))}
          </div>
          {template === "copy" && (
            <select
              value={copyFromId}
              onChange={(e) => setCopyFromId(e.target.value)}
              className="mt-2 w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
          >
            Create profile
          </button>
        </div>
      </div>
    </div>
  );
}
