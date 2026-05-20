import { useState, useRef, useEffect } from "react";
import { ChevronDown, Save, FilePlus, Copy, FolderOpen, Trash2, MoreVertical } from "lucide-react";
import type { SavedProject } from "../store";

interface Props {
  projectName: string;
  isDirty: boolean;
  projects: SavedProject[];
  onSave: () => void;
  onSaveAs: () => void;
  onNew: () => void;
  onLoad: (p: SavedProject) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getDate()).padStart(2,"0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function ProjectDropdown({ projectName, isDirty, projects, onSave, onSaveAs, onNew, onLoad, onDuplicate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const sorted = [...projects].sort((a, b) => {
    const aT = a.lastOpenedAt ?? a.savedAt;
    const bT = b.lastOpenedAt ?? b.savedAt;
    return bT.localeCompare(aT);
  });

  const triggerLabel = projectName
    ? projectName + (isDirty ? " ●" : "")
    : isDirty ? "Untitled ●" : "Project";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded border font-medium transition-colors ${
          isDirty
            ? "border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
      >
        <span className="max-w-40 truncate">{triggerLabel}</span>
        <ChevronDown size={11} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {projectName && (
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">Current project</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{projectName}</p>
              {isDirty && <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Unsaved changes</p>}
            </div>
          )}

          <div className="py-1">
            <MenuBtn icon={<Save size={12} />} label="Save" onClick={() => { onSave(); setOpen(false); }} />
            <MenuBtn icon={<Copy size={12} />} label="Save as…" onClick={() => { onSaveAs(); setOpen(false); }} />
            <MenuBtn icon={<FilePlus size={12} />} label="New project" onClick={() => { onNew(); setOpen(false); }} />
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800">
            <div className="px-3 py-1.5">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Open recent</span>
            </div>
            {sorted.length === 0 ? (
              <p className="px-3 pb-3 text-xs text-gray-400 italic">No saved projects yet</p>
            ) : (
              <div className="max-h-60 overflow-y-auto pb-1">
                {sorted.map((p) => {
                  const dateStr = formatDate(p.lastOpenedAt ?? p.savedAt);
                  const hasName = Boolean(p.meta.name);
                  const displayName = hasName ? p.meta.name : `(unnamed — ${dateStr})`;
                  return (
                    <div key={p.id} className="relative flex items-center group hover:bg-gray-50 dark:hover:bg-gray-800">
                      <button
                        className="flex-1 px-3 py-2 text-left min-w-0"
                        onClick={() => { onLoad(p); setOpen(false); setMenuOpenId(null); }}
                      >
                        <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{displayName}</p>
                        {hasName && (
                          <p className="text-xs text-gray-400 dark:text-gray-500">{dateStr}</p>
                        )}
                      </button>
                      <div className="relative shrink-0 pr-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === p.id ? null : p.id); }}
                          className="p-1 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical size={12} />
                        </button>
                        {menuOpenId === p.id && (
                          <div className="absolute right-0 top-7 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 py-1">
                            <button
                              onClick={() => { onLoad(p); setOpen(false); setMenuOpenId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <FolderOpen size={11} /> Load
                            </button>
                            <button
                              onClick={() => { onDuplicate(p.id); setMenuOpenId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <Copy size={11} /> Duplicate
                            </button>
                            <button
                              onClick={() => { if (confirm("Delete this project?")) { onDelete(p.id); setMenuOpenId(null); } }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 size={11} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      {label}
    </button>
  );
}
