import { CONFIG, type Config } from "./config";

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
  shukoCiruits: number;
  utpDataCables: number;
  utpBackupCables: number;
  dataLines: number;
}

export interface ProcessorSpec {
  count: number;
  needsUpgrade: boolean;
  warning: string | null;
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
    ledSpares: cfg.LED_SPARES_FIXED,
    processor: calcProcessor(activePanels, cfg).count,
    powerHdmiUsbUtp: 1,
    mediaplayer: 1,
    powerHdmiUsbStick: 1,
  };
}

export function calcPower(activePanels: number, cfg: Config = CONFIG): PowerSpec {
  const totalWatts = activePanels * cfg.PANEL_POWER_W;
  const amps = totalWatts / cfg.VOLTAGE;
  const shukoCiruits = Math.ceil(totalWatts / cfg.SHUKO_MAX_W);
  const dataLines = Math.ceil(activePanels / cfg.PANELS_PER_DATA_LINE);

  return {
    totalWatts,
    amps,
    shukoCiruits,
    utpDataCables: 2,
    utpBackupCables: 2,
    dataLines,
  };
}

export function calcProcessor(activePanels: number, cfg: Config = CONFIG): ProcessorSpec {
  const screenPixelsW = Math.ceil(Math.sqrt(activePanels)) * cfg.PANEL_PIXELS_W;
  const maxHdPixels = cfg.PROCESSOR_MAX_PIXELS_W * cfg.PROCESSOR_MAX_PIXELS_H;

  // More precise: check if actual configured pixels exceed HD
  // This is checked against the real pixel dimensions in the full calc
  const hdPixels = cfg.PROCESSOR_MAX_PIXELS_W * cfg.PROCESSOR_MAX_PIXELS_H;
  const _ = screenPixelsW; // used below via full calc

  return { count: 1, needsUpgrade: false, warning: null };
}

export function calcProcessorFromDimensions(
  pixelsW: number,
  pixelsH: number,
  cfg: Config = CONFIG
): ProcessorSpec {
  const maxW = cfg.PROCESSOR_MAX_PIXELS_W;
  const maxH = cfg.PROCESSOR_MAX_PIXELS_H;

  if (pixelsW <= maxW && pixelsH <= maxH) {
    return { count: 1, needsUpgrade: false, warning: null };
  }

  const neededW = Math.ceil(pixelsW / maxW);
  const neededH = Math.ceil(pixelsH / maxH);
  const count = Math.max(neededW, neededH);

  return {
    count,
    needsUpgrade: true,
    warning: `⚠ Exceeds HD processor (${pixelsW}×${pixelsH} px) — ${count} processor${count > 1 ? "s" : ""} needed or upgrade to 4K processor`,
  };
}

export function calcAll(input: ScreenInput, cfg: Config = CONFIG): FullConfig {
  const dimensions = calcDimensions(input, cfg);
  const materials = calcMaterials(dimensions.activePanels, cfg);
  const power = calcPower(dimensions.activePanels, cfg);
  const processor = calcProcessorFromDimensions(dimensions.pixelsW, dimensions.pixelsH, cfg);

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
