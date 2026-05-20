import { CONFIG, type Config } from "./config";
import type { Overrides } from "./useOverrides";
import type { PanelSpec } from "./panels";
import { PRESET_PANELS } from "./panels";

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
  panelWidthMm: number;   // backward compat
  panelHeightMm: number;  // backward compat
  panelSpec?: PanelSpec;  // new — full panel spec
  blankCells: number[];
  chains: ChainData[];
  processorId?: string;
  routingMode?: "layout" | "data" | "power";
  cableEntry?: "top" | "bottom" | "left" | "right";
  dataPortSequences?: Record<string, number[]>;  // port num as string key → ordered panel flat-indices
  powerChainSequences?: Record<string, number[]>;
  powerMaxWatts?: number;
  powerSizingMode?: "operating" | "max";
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

// Keep PRESET_PANELS exported reference for use in backward compat
export { PRESET_PANELS };

export function configFromPanel(panel: PanelSpec): Config {
  return {
    ...CONFIG,
    PANEL_WIDTH_MM: panel.widthMm,
    PANEL_HEIGHT_MM: panel.heightMm,
    PANEL_PIXELS_W: panel.pixelsW,
    PANEL_PIXELS_H: panel.pixelsH,
    PIXEL_PITCH: `P${panel.pixelPitch}`,
    PANEL_WEIGHT_KG: panel.weightKg,
    PANEL_OPERATING_POWER_W: panel.operatingPowerW,
    PANEL_MAX_POWER_W: panel.maxPowerW,
    PRODUCT_DEFAULT: panel.name,
  };
}

export const CHAIN_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#f59e0b",
  "#a855f7", "#ec4899", "#14b8a6", "#f97316",
];
