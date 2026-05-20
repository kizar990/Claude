import type { PanelSpec } from "./panels";
import { PRESET_PANELS } from "./panels";
import { PROCESSORS } from "./config";

export type RiggingSystem = "modular" | "scaffolding" | "custom";

export interface ProfileTerminology {
  frameConnector: string;   // e.g. "Quick Fix" / "Bridge Clamp"
  panelSupport: string;     // e.g. "UTP" / "Pickup Point"
  structureType: string;    // e.g. "Omega 55" / "Trussing"
}

export interface Profile {
  id: string;
  name: string;
  logo?: string;              // data URL (uploaded) or empty
  accentColor: string;        // hex — drives UI accent and PDF colour
  companyAddress?: string;    // multiline, for PDF footer
  companyPhone?: string;
  companyWebsite?: string;
  riggingSystem: RiggingSystem;
  panels: PanelSpec[];        // panel library for this profile
  processorStockIds: string[]; // subset of PROCESSORS by id
  defaultProcessorId: string;
  defaultPanelId: string;
  powerSizingDefault: "operating" | "max";
  chainBudgetDefault: number; // watts per power chain
  terminology: ProfileTerminology;
  isBuiltIn?: boolean;        // built-in profiles cannot be deleted
  createdAt: string;
  updatedAt: string;
}

// ── MTA panel library ─────────────────────────────────────────────────────────

export const MTA_PANELS: PanelSpec[] = [
  {
    id: "mta-roe-bp2",
    name: "ROE Visual BP2 P1.95",
    pixelPitch: 1.95,
    widthMm: 500, heightMm: 500,
    pixelsW: 256, pixelsH: 256,
    maxPowerW: 600, operatingPowerW: 300,
    weightKg: 8.5,
    isPreset: true,
  },
  {
    id: "mta-absen-a3",
    name: "Absen A3 Pro P3.0",
    pixelPitch: 3.0,
    widthMm: 500, heightMm: 500,
    pixelsW: 166, pixelsH: 166,
    maxPowerW: 500, operatingPowerW: 200,
    weightKg: 7.5,
    isPreset: true,
  },
  {
    id: "mta-generic-p3.9",
    name: "Generic Outdoor P3.9",
    pixelPitch: 3.9,
    widthMm: 500, heightMm: 500,
    pixelsW: 128, pixelsH: 128,
    maxPowerW: 650, operatingPowerW: 250,
    weightKg: 10.5,
    isPreset: true,
  },
  {
    id: "mta-leyard-clm5",
    name: "Leyard CLM5 P5.0",
    pixelPitch: 5.0,
    widthMm: 500, heightMm: 500,
    pixelsW: 100, pixelsH: 100,
    maxPowerW: 700, operatingPowerW: 280,
    weightKg: 11.0,
    isPreset: true,
  },
];

// ── Built-in profile templates ────────────────────────────────────────────────

export const SKYLINE_PROFILE: Profile = {
  id: "builtin-skyline",
  name: "Skyline Whitespace",
  accentColor: "#2563EB",
  riggingSystem: "modular",
  panels: [...PRESET_PANELS],
  processorStockIds: PROCESSORS.map((p) => p.id),
  defaultProcessorId: PROCESSORS[0].id,
  defaultPanelId: PRESET_PANELS[0].id,
  powerSizingDefault: "operating",
  chainBudgetDefault: 2400,
  terminology: {
    frameConnector: "Quick Fix",
    panelSupport: "UTP",
    structureType: "Omega 55",
  },
  isBuiltIn: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

export const MTA_PROFILE: Profile = {
  id: "builtin-mta",
  name: "MTA International",
  accentColor: "#059669",
  riggingSystem: "scaffolding",
  panels: MTA_PANELS,
  processorStockIds: PROCESSORS.map((p) => p.id),
  defaultProcessorId: PROCESSORS[0].id,
  defaultPanelId: MTA_PANELS[0].id,
  powerSizingDefault: "operating",
  chainBudgetDefault: 3000,
  terminology: {
    frameConnector: "Bridge Clamp",
    panelSupport: "Pickup Point",
    structureType: "Trussing",
  },
  isBuiltIn: true,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const BUILTIN_PROFILES: Profile[] = [SKYLINE_PROFILE, MTA_PROFILE];

// ── Storage ───────────────────────────────────────────────────────────────────

const CUSTOM_PROFILES_KEY = "led-calc-custom-profiles";
const ACTIVE_PROFILE_KEY  = "led-calc-active-profile";

export function loadProfiles(): Profile[] {
  try {
    const custom = JSON.parse(localStorage.getItem(CUSTOM_PROFILES_KEY) ?? "[]") as Profile[];
    const builtInIds = new Set(BUILTIN_PROFILES.map((p) => p.id));
    return [
      ...BUILTIN_PROFILES,
      ...custom.filter((p) => !builtInIds.has(p.id)),
    ];
  } catch {
    return [...BUILTIN_PROFILES];
  }
}

export function saveCustomProfile(profile: Profile): void {
  if (profile.isBuiltIn) return;
  const all = loadProfiles().filter((p) => !p.isBuiltIn);
  const without = all.filter((p) => p.id !== profile.id);
  without.unshift(profile);
  localStorage.setItem(CUSTOM_PROFILES_KEY, JSON.stringify(without));
}

export function deleteProfile(id: string): void {
  const all = loadProfiles().filter((p) => !p.isBuiltIn);
  const remaining = all.filter((p) => p.id !== id);
  localStorage.setItem(CUSTOM_PROFILES_KEY, JSON.stringify(remaining));
}

export function duplicateProfile(id: string): Profile | null {
  const all = loadProfiles();
  const src = all.find((p) => p.id === id);
  if (!src) return null;
  return {
    ...src,
    id: crypto.randomUUID(),
    name: `${src.name} (copy)`,
    isBuiltIn: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getActiveProfileId(): string {
  return localStorage.getItem(ACTIVE_PROFILE_KEY) ?? SKYLINE_PROFILE.id;
}

export function setActiveProfileId(id: string): void {
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

export function getActiveProfile(profiles: Profile[]): Profile {
  const id = getActiveProfileId();
  return profiles.find((p) => p.id === id) ?? profiles[0];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function profileAvailableProcessors(profile: Profile) {
  return PROCESSORS.filter((p) => profile.processorStockIds.includes(p.id));
}

export function blankProfile(): Profile {
  return {
    id: crypto.randomUUID(),
    name: "New Profile",
    accentColor: "#6366f1",
    riggingSystem: "modular",
    panels: [...PRESET_PANELS],
    processorStockIds: PROCESSORS.map((p) => p.id),
    defaultProcessorId: PROCESSORS[0].id,
    defaultPanelId: PRESET_PANELS[0].id,
    powerSizingDefault: "operating",
    chainBudgetDefault: 2400,
    terminology: { frameConnector: "Connector", panelSupport: "Cable", structureType: "Frame" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
