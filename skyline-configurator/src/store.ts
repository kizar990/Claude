import { CONFIG, type Config } from "./config";
import type { Overrides } from "./useOverrides";

export interface ProjectMeta {
  name: string;
  jobNumber: string;
  client: string;
  date: string;
  venue: string;
  contact: string;
}

export interface ScreenInputState {
  columns: number;
  rows: number;
  blankPanels: number;
}

export interface SavedProject {
  id: string;
  savedAt: string;
  meta: ProjectMeta;
  input: ScreenInputState;
  overrides: Overrides;
  panelWidthMm: number;
  panelHeightMm: number;
  blankCells: number[];
  chains: ChainData[];
  processorId?: string;
  routingMode?: "layout" | "data" | "power";
  dataPortSequences?: Record<string, number[]>;  // port num as string key → ordered panel flat-indices
  powerChainSequences?: Record<string, number[]>;
  powerMaxWatts?: number;
}

export interface ChainData {
  id: string;
  color: string;
  panels: number[];
}

const STORAGE_KEY = "skyline-projects";

export function listProjects(): SavedProject[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveProject(project: SavedProject): void {
  const all = listProjects().filter((p) => p.id !== project.id);
  all.unshift(project);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteProject(id: string): void {
  const all = listProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function duplicateProject(id: string): SavedProject | null {
  const all = listProjects();
  const src = all.find((p) => p.id === id);
  if (!src) return null;
  return {
    ...src,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    meta: { ...src.meta, name: `${src.meta.name} (copy)` },
  };
}

export function defaultMeta(): ProjectMeta {
  return {
    name: "",
    jobNumber: "",
    client: "",
    date: new Date().toISOString().slice(0, 10),
    venue: "",
    contact: "",
  };
}

export function configFromPanelSize(
  panelWidthMm: number,
  panelHeightMm: number
): Config {
  return { ...CONFIG, PANEL_WIDTH_MM: panelWidthMm, PANEL_HEIGHT_MM: panelHeightMm };
}

export const CHAIN_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#f59e0b",
  "#a855f7", "#ec4899", "#14b8a6", "#f97316",
];
