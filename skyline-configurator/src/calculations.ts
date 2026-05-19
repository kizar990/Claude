import { CONFIG, PROCESSORS, computePanelsPerPort, type Config } from "./config";

export interface ScreenInput {
  columns: number;
  rows: number;
  blankPanels: number;
}

export interface ScreenDimensions {
  widthMm: number;
  heightMm: number;
  widthM: number;
  heightM: number;
  pixelsW: number;
  pixelsH: number;
  aspectRatio: string;
  totalPanels: number;
  activePanels: number;
}

export interface MaterialList {
  ledFlightcases: number;
  ledPanels: number;
  powerlink1m: number;
  datalink1m: number;
  powerstart10m: number;
  powerstart1m: number;
  datastartKit: number;
  etapeRolls: number;
  fitKit: number;
  neutrikCouplers: number;
  procFlightcase: number;
  ledSpares: number;
  processor: number;
  powerHdmiUsbUtp: number;
  mediaplayer: number;
  powerHdmiUsbStick: number;
}

export interface PowerSpec {
  totalWatts: number;
  amps: number;
  circuits: number;
  utpDataCables: number;
  dataLines: number;
}

export interface ProcessorSpec {
  modelName: string;
  count: number;
  /** "ok" | "tight" (>85% capacity) | "insufficient" (>100% capacity) */
  status: "ok" | "tight" | "insufficient";
  /** true when status === "insufficient" — kept for backward compat */
  needsUpgrade: boolean;
  specsConfirmed: boolean;
  warning: string | null;
  /** 0–1 fraction of the processor's total panel capacity used */
  panelLoad: number;
  /** Total panels this processor can drive (ports × panelsPerPort) */
  panelCapacity: number;
}

export interface FullConfig {
  dimensions: ScreenDimensions;
  materials: MaterialList;
  power: PowerSpec;
  processor: ProcessorSpec;
  contentSpec: string;
}

export function calcDimensions(input: ScreenInput, cfg: Config = CONFIG): ScreenDimensions {
  const { columns, rows, blankPanels } = input;
  const totalPanels = columns * rows;
  const activePanels = totalPanels - blankPanels;

  const widthMm = columns * cfg.PANEL_WIDTH_MM;
  const heightMm = rows * cfg.PANEL_HEIGHT_MM;
  const widthM = widthMm / 1000;
  const heightM = heightMm / 1000;

  const pixelsW = columns * cfg.PANEL_PIXELS_W;
  const pixelsH = rows * cfg.PANEL_PIXELS_H;

  const aspectRatio = simplifyRatio(pixelsW, pixelsH);

  return {
    widthMm,
    heightMm,
    widthM,
    heightM,
    pixelsW,
    pixelsH,
    aspectRatio,
    totalPanels,
    activePanels,
  };
}

export function calcMaterials(activePanels: number, cfg: Config = CONFIG): MaterialList {
  const cases = Math.ceil(activePanels / cfg.PANELS_PER_FLIGHTCASE);

  return {
    ledFlightcases: cases,
    ledPanels: activePanels,
    powerlink1m: cases * cfg.POWERLINK_PER_CASE,
    datalink1m: cases * cfg.DATALINK_PER_CASE,
    powerstart10m: cases * cfg.POWERSTART_10M_PER_CASE,
    powerstart1m: cases * cfg.POWERSTART_1M_PER_CASE,
    datastartKit: cases * cfg.DATASTART_KIT_PER_CASE,
    etapeRolls: cases * cfg.ETAPE_PER_CASE,
    fitKit: cases * cfg.FITKIT_PER_CASE,
    neutrikCouplers: cfg.NEUTRIK_COUPLER_FIXED,
    procFlightcase: 1,
    ledSpares: Math.ceil(activePanels * cfg.LED_SPARES_PCT),
    processor: calcProcessor(activePanels, cfg).count,
    powerHdmiUsbUtp: 1,
    mediaplayer: 1,
    powerHdmiUsbStick: 1,
  };
}

export function calcPower(activePanels: number, cfg: Config = CONFIG): PowerSpec {
  const totalWatts = activePanels * cfg.PANEL_POWER_W;
  const amps = totalWatts / cfg.VOLTAGE;
  const circuits = Math.ceil(totalWatts / cfg.CIRCUIT_MAX_W);
  const dataLines = Math.ceil(activePanels / cfg.PANELS_PER_DATA_LINE);

  return {
    totalWatts,
    amps,
    circuits,
    utpDataCables: 2,
    dataLines,
  };
}

export function calcProcessor(_activePanels: number, _cfg: Config = CONFIG): ProcessorSpec {
  return {
    modelName: "", count: 1, status: "ok", needsUpgrade: false,
    specsConfirmed: true, warning: null, panelLoad: 0, panelCapacity: 0,
  };
}

export function calcProcessorFromDimensions(
  pixelsW: number,
  pixelsH: number,
  cfg: Config = CONFIG
): ProcessorSpec {
  const maxW = cfg.PROCESSOR_MAX_PIXELS_W;
  const maxH = cfg.PROCESSOR_MAX_PIXELS_H;
  const base = { specsConfirmed: true, panelLoad: 0, panelCapacity: 0 };

  if (pixelsW <= maxW && pixelsH <= maxH) {
    return { ...base, modelName: "HD", count: 1, status: "ok", needsUpgrade: false, warning: null };
  }

  const neededW = Math.ceil(pixelsW / maxW);
  const neededH = Math.ceil(pixelsH / maxH);
  const count = Math.max(neededW, neededH);

  return {
    ...base,
    modelName: "HD",
    count,
    status: "insufficient",
    needsUpgrade: true,
    warning: `⚠ Exceeds HD processor (${pixelsW}×${pixelsH} px) — ${count} processor${count > 1 ? "s" : ""} needed or upgrade to 4K processor`,
  };
}

export function calcProcessorSufficiency(
  pixelsW: number,
  pixelsH: number,
  activePanels: number,
  processorId: string,
  cfg: Config = CONFIG
): ProcessorSpec {
  const model = PROCESSORS.find((p) => p.id === processorId) ?? PROCESSORS[0];
  const { name, maxPixelsW, maxPixelsH, ports } = model;
  const tier = maxPixelsW <= 1920 ? "HD" : "4K";
  const label = `${name} (${tier})`;
  const panelsPerPort = computePanelsPerPort(model.pixelsPerPort, cfg.PANEL_PIXELS_W, cfg.PANEL_PIXELS_H);
  const panelCapacity = ports * panelsPerPort;
  const panelLoad = activePanels / panelCapacity;
  const TIGHT = cfg.PROCESSOR_TIGHT_THRESHOLD;

  // Condition A: pixel resolution fits within controller's max W×H
  const pixelsFit = pixelsW <= maxPixelsW && pixelsH <= maxPixelsH;

  // Condition B: panel count within port capacity
  const panelsFit = activePanels <= panelCapacity;

  if (!pixelsFit) {
    return {
      modelName: label, count: 1, status: "insufficient", needsUpgrade: true,
      specsConfirmed: model.specsConfirmed, panelLoad, panelCapacity,
      warning: `⚠ ${name} max content size is ${maxPixelsW}×${maxPixelsH} — screen is ${pixelsW}×${pixelsH} px`,
    };
  }

  if (!panelsFit) {
    return {
      modelName: label, count: 1, status: "insufficient", needsUpgrade: true,
      specsConfirmed: model.specsConfirmed, panelLoad, panelCapacity,
      warning: `⚠ ${name} can drive ${panelCapacity} panels (${ports} ports × ${panelsPerPort}) — screen has ${activePanels}`,
    };
  }

  if (panelLoad > TIGHT) {
    return {
      modelName: label, count: 1, status: "tight", needsUpgrade: false,
      specsConfirmed: model.specsConfirmed, panelLoad, panelCapacity,
      warning: `${name} at ${Math.round(panelLoad * 100)}% panel capacity (${activePanels}/${panelCapacity}) — consider a larger processor`,
    };
  }

  return {
    modelName: label, count: 1, status: "ok", needsUpgrade: false,
    specsConfirmed: model.specsConfirmed, panelLoad, panelCapacity,
    warning: null,
  };
}

export function calcAll(
  input: ScreenInput,
  cfg: Config = CONFIG,
  processorId?: string
): FullConfig {
  const dimensions = calcDimensions(input, cfg);
  const materials = calcMaterials(dimensions.activePanels, cfg);
  const power = calcPower(dimensions.activePanels, cfg);
  const processor = processorId
    ? calcProcessorSufficiency(dimensions.pixelsW, dimensions.pixelsH, dimensions.activePanels, processorId, cfg)
    : calcProcessorFromDimensions(dimensions.pixelsW, dimensions.pixelsH, cfg);

  // Override processor count in materials if needed
  materials.processor = processor.count;

  const contentSpec =
    `Create content at ${dimensions.pixelsW}×${dimensions.pixelsH} px, ` +
    `MP4 H.264, 50 Hz, start pixel 0,0, top-left corner`;

  return { dimensions, materials, power, processor, contentSpec };
}

export function snapToPanel(
  targetMm: number,
  panelSizeMm: number
): { panels: number; actualMm: number; deltaMm: number } {
  const panels = Math.round(targetMm / panelSizeMm);
  const actualMm = panels * panelSizeMm;
  return { panels, actualMm, deltaMm: actualMm - targetMm };
}

export function pixelsToInput(
  pixelsW: number,
  pixelsH: number,
  cfg: Config = CONFIG
): { input: ScreenInput; deltaW: number; deltaH: number } {
  const columns = Math.round(pixelsW / cfg.PANEL_PIXELS_W);
  const rows = Math.round(pixelsH / cfg.PANEL_PIXELS_H);
  const actualW = columns * cfg.PANEL_PIXELS_W;
  const actualH = rows * cfg.PANEL_PIXELS_H;
  return {
    input: { columns, rows, blankPanels: 0 },
    deltaW: actualW - pixelsW,
    deltaH: actualH - pixelsH,
  };
}

export function metresToInput(
  widthM: number,
  heightM: number,
  cfg: Config = CONFIG
): { input: ScreenInput; deltaWMm: number; deltaHMm: number } {
  const snapW = snapToPanel(widthM * 1000, cfg.PANEL_WIDTH_MM);
  const snapH = snapToPanel(heightM * 1000, cfg.PANEL_HEIGHT_MM);
  return {
    input: { columns: snapW.panels, rows: snapH.panels, blankPanels: 0 },
    deltaWMm: snapW.deltaMm,
    deltaHMm: snapH.deltaMm,
  };
}

// --- helpers ---

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function simplifyRatio(w: number, h: number): string {
  if (w === 0 || h === 0) return "N/A";
  const d = gcd(w, h);
  return `${w / d}:${h / d}`;
}
