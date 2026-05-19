export const CONFIG = {
  PANEL_WIDTH_MM: 496,
  PANEL_HEIGHT_MM: 496,
  PANEL_PIXELS_W: 192,
  PANEL_PIXELS_H: 192,
  PIXEL_PITCH: "P1.9",
  PANEL_WEIGHT_KG: 10,
  PANEL_POWER_W: 120,
  VOLTAGE: 240,
  PROCESSOR_MAX_PIXELS_W: 1920,
  PROCESSOR_MAX_PIXELS_H: 1080,
  PANELS_PER_DATA_LINE: 13,
  // 13A circuit at 240V with 0.8 safety margin: 240 × 13 × 0.8 = 2496W
  CIRCUIT_MAX_W: 2496,
  PRODUCT_DEFAULT: "Absen Hi-LED 55+ Pro P1.9",
  COMPANY_NAME: "PROFOUND",
  PANELS_PER_FLIGHTCASE: 10,
  POWERLINK_PER_CASE: 10,
  DATALINK_PER_CASE: 10,
  POWERSTART_10M_PER_CASE: 1,
  POWERSTART_1M_PER_CASE: 1,
  DATASTART_KIT_PER_CASE: 2,
  ETAPE_PER_CASE: 1,
  FITKIT_PER_CASE: 10,
  NEUTRIK_COUPLER_FIXED: 4,
  LED_SPARES_PCT: 0.1,
};

export type Config = typeof CONFIG;

export interface ProcessorModel {
  id: string;
  name: string;
  // TODO: confirm from Novastar spec sheet
  maxPixelsW: number;
  maxPixelsH: number;
  maxTotalPixels: number;
}

export const PROCESSORS: ProcessorModel[] = [
  { id: "mctrl660",  name: "MCTRL660",   maxPixelsW: 1920, maxPixelsH: 1200, maxTotalPixels: 2_300_000 },
  { id: "vx600",     name: "VX600",      maxPixelsW: 4096, maxPixelsH: 2160, maxTotalPixels: 3_900_000 },
  { id: "vx1000",    name: "VX1000",     maxPixelsW: 4096, maxPixelsH: 2160, maxTotalPixels: 6_500_000 },
  { id: "vx2000pro", name: "VX2000 Pro", maxPixelsW: 4096, maxPixelsH: 2160, maxTotalPixels: 13_000_000 },
  { id: "mx40pro",   name: "MX40 Pro",   maxPixelsW: 4096, maxPixelsH: 2160, maxTotalPixels: 8_800_000 },
];
