export interface PanelSpec {
  id: string;
  name: string;
  pixelPitch: number;    // mm
  widthMm: number;
  heightMm: number;
  pixelsW: number;
  pixelsH: number;
  maxPowerW: number;
  operatingPowerW: number;
  weightKg: number;
  isPreset: boolean;
}

export const PRESET_PANELS: PanelSpec[] = [
  {
    id: "preset-absen-pl1.9",
    name: "Absen Hi-LED 55+ Pro P1.9",
    pixelPitch: 1.9,
    widthMm: 496,
    heightMm: 496,
    pixelsW: 256,
    pixelsH: 256,
    maxPowerW: 180,
    operatingPowerW: 120,
    weightKg: 10,
    isPreset: true,
  },
];

const LIBRARY_KEY = "skyline-custom-panels";

export function loadCustomPanels(): PanelSpec[] {
  try { return JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? "[]"); }
  catch { return []; }
}

export function saveAllCustomPanels(panels: PanelSpec[]): void {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(panels));
}

export function addCustomPanel(panel: PanelSpec): void {
  const panels = loadCustomPanels().filter((p) => p.id !== panel.id);
  panels.unshift(panel);
  saveAllCustomPanels(panels);
}

export function updateCustomPanel(id: string, updates: Partial<PanelSpec>): void {
  saveAllCustomPanels(loadCustomPanels().map((p) => p.id === id ? { ...p, ...updates } : p));
}

export function deleteCustomPanel(id: string): void {
  saveAllCustomPanels(loadCustomPanels().filter((p) => p.id !== id));
}

export function defaultOperatingPower(maxPowerW: number): number {
  return Math.round(maxPowerW * 0.6);
}
