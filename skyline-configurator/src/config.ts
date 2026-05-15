export const CONFIG = {
  PANEL_WIDTH_MM: 500,
  PANEL_HEIGHT_MM: 500,
  PANEL_PIXELS_W: 192,
  PANEL_PIXELS_H: 192,
  PIXEL_PITCH: "P2.5",
  PANEL_WEIGHT_KG: 10,
  PANEL_POWER_W: 150,
  VOLTAGE: 240,
  PROCESSOR_MAX_PIXELS_W: 1920,
  PROCESSOR_MAX_PIXELS_H: 1080,
  PANELS_PER_DATA_LINE: 13,
  SHUKO_MAX_W: 3000,
  PRODUCT_DEFAULT: "Absen Hi-LED 55+ Pro P1.9 / equivalent P2.5",
  COMPANY_NAME: "PROFOUND",
  // Material list ratios (derived from reference sheet: 21 panels → 3 cases)
  // Formula: cases = ceil(panels / 10)
  PANELS_PER_FLIGHTCASE: 10,
  // Per-case ratios from sheet (verified against 21-panel reference)
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
