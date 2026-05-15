import { Trash2, Copy, FolderOpen } from "lucide-react";
import type { SavedProject } from "../store";

interface Props {
  projects: SavedProject[];
  onLoad: (p: SavedProject) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function SaveSidebar({ projects, onLoad, onDelete, onDuplicate }: Props) {
  if (projects.length === 0) {
    return (
      <div className="text-xs text-gray-400 dark:text-gray-500 italic px-1">
        No saved projects
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {projects.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between gap-1 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800 group"
        >
          <button
            className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300 truncate"
            onClick={() => onLoad(p)}
            title={`${p.meta.client} — ${p.meta.venue}`}
          >
            {p.meta.name || "(unnamed)"}
            <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
              {p.meta.jobNumber}
            </span>
          </button>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onLoad(p)}
              title="Load"
              className="p-1 text-gray-400 hover:text-blue-500"
            >
              <FolderOpen size={12} />
            </button>
            <button
              onClick={() => onDuplicate(p.id)}
              title="Duplicate"
              className="p-1 text-gray-400 hover:text-green-500"
            >
              <Copy size={12} />
            </button>
            <button
              onClick={() => onDelete(p.id)}
              title="Delete"
              className="p-1 text-gray-400 hover:text-red-500"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
