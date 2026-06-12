export const CONFIG = {
  PANEL_WIDTH_MM: 496,
  PANEL_HEIGHT_MM: 496,
  PANEL_PIXELS_W: 256,
  PANEL_PIXELS_H: 256,
  PIXEL_PITCH: "P1.9",
  PANEL_WEIGHT_KG: 10,
  PANEL_OPERATING_POWER_W: 120,
  PANEL_MAX_POWER_W: 180,
  VOLTAGE: 240,
  PANELS_PER_DATA_LINE: 13,
  // 13A circuit at 240V with 0.8 safety margin: 240 × 13 × 0.8 = 2496W
  CIRCUIT_MAX_W: 2496,
  PRODUCT_DEFAULT: "Absen Hi-LED 55+ Pro P1.9",
  COMPANY_NAME: "PROFOUND",
  PANELS_PER_FLIGHTCASE: 10,
  POWERSTART_10M_PER_CASE: 1,
  POWERSTART_1M_PER_CASE: 1,
  DATASTART_KIT_PER_CASE: 2,
  ETAPE_PER_CASE: 1,
  FITKIT_PER_CASE: 10,
  NEUTRIK_COUPLER_FIXED: 4,
  LED_SPARES_PCT: 0.1,
  // Processor panel-load headroom: flag as "tight" above this fraction of capacity
  PROCESSOR_TIGHT_THRESHOLD: 0.85,
};

export type Config = typeof CONFIG;

export function computePanelsPerPort(pixelsPerPort: number, pw: number, ph: number): number {
  return Math.floor(pixelsPerPort / (pw * ph));
}

export interface ProcessorModel {
  id: string;
  name: string;
  category: string;
  processorType: string;
  isModular: boolean;

  ethernetPorts: number | null;
  ethernetPortType: string;
  officialPerPortMaxPixels: number | null;
  recommendedPerPortPixels: number | null;

  officialTheoreticalMaxPixels: number | null;
  recommendedMaxPixels: number | null;

  devicePixelCap: number | null;
  maxInputPixels: number | null;
  maxInputResolution: string;

  maxOutputWidth: number | null;
  maxOutputHeight: number | null;

  opticalOutputs: number | null;
  videoInputs: string[];
  supportsScaling: boolean;
  supportsLayers: boolean;
  maxLayers: number;
  supportsGenlock: boolean;
  supportsFiberMode: boolean;

  bestUse: string;
  calculatorNotes: string[];
  bitDepthPortLimits?: { "8bit60Hz": number; "10bit60Hz": number; "12bit60Hz": number };
}

export const PROCESSORS: ProcessorModel[] = [
  {
    "id": "mctrl660", "name": "NovaStar MCTRL660", "category": "controller",
    "processorType": "LED display controller", "isModular": false,
    "ethernetPorts": 4, "ethernetPortType": "1G RJ45",
    "officialPerPortMaxPixels": 650000, "recommendedPerPortPixels": 600000,
    "officialTheoreticalMaxPixels": 2600000, "recommendedMaxPixels": 2400000,
    "devicePixelCap": null, "maxInputPixels": 2304000, "maxInputResolution": "1920×1200@60Hz",
    "maxOutputWidth": 3840, "maxOutputHeight": 2560,
    "opticalOutputs": 0, "videoInputs": ["DVI", "HDMI 1.3", "Audio"],
    "supportsScaling": false, "supportsLayers": false, "maxLayers": 1,
    "supportsGenlock": false, "supportsFiberMode": false,
    "bestUse": "Small-to-medium LED walls using simple sending-card control.",
    "calculatorNotes": [
      "Use 600,000 pixels per Ethernet port for recommended calculations.",
      "Official per-port maximum is 650,000 pixels.",
      "4 ports × 600,000 = 2,400,000 recommended pixels.",
      "4 ports × 650,000 = 2,600,000 theoretical pixels.",
      "1920×1200 is an input resolution figure, not the total Ethernet output capacity."
    ]
  },
  {
    "id": "mctrl660-pro", "name": "NovaStar MCTRL660 Pro", "category": "controller",
    "processorType": "Professional LED display controller", "isModular": false,
    "ethernetPorts": 6, "ethernetPortType": "1G RJ45",
    "officialPerPortMaxPixels": 650000, "recommendedPerPortPixels": 600000,
    "officialTheoreticalMaxPixels": 3900000, "recommendedMaxPixels": 3600000,
    "devicePixelCap": null, "maxInputPixels": 2304000, "maxInputResolution": "1920×1200@60Hz",
    "maxOutputWidth": 3840, "maxOutputHeight": 3840,
    "opticalOutputs": 2, "videoInputs": ["DVI", "HDMI", "3G-SDI"],
    "supportsScaling": false, "supportsLayers": false, "maxLayers": 1,
    "supportsGenlock": true, "supportsFiberMode": true,
    "bestUse": "LED walls needing SDI input, optical ports, Genlock, or more outputs than the standard MCTRL660.",
    "calculatorNotes": [
      "Use 600,000 pixels per Ethernet port for recommended calculations.",
      "Official per-port maximum is 650,000 pixels at standard 8-bit operation.",
      "6 ports × 600,000 = 3,600,000 recommended pixels.",
      "6 ports × 650,000 = 3,900,000 theoretical pixels.",
      "Useful where optical conversion or sync is required."
    ]
  },
  {
    "id": "mctrl4k", "name": "NovaStar MCTRL4K", "category": "controller",
    "processorType": "4K LED display controller", "isModular": false,
    "ethernetPorts": 16, "ethernetPortType": "1G RJ45",
    "officialPerPortMaxPixels": 650000, "recommendedPerPortPixels": 600000,
    "officialTheoreticalMaxPixels": 8800000, "recommendedMaxPixels": 8800000,
    "devicePixelCap": 8800000, "maxInputPixels": null, "maxInputResolution": "3840×2160@60Hz",
    "maxOutputWidth": 7680, "maxOutputHeight": 4320,
    "opticalOutputs": 4, "videoInputs": ["DP 1.2", "HDMI 2.0", "Dual-Link DVI ×2"],
    "supportsScaling": false, "supportsLayers": false, "maxLayers": 1,
    "supportsGenlock": true, "supportsFiberMode": true,
    "bestUse": "4K-class LED walls, high-resolution rental and fixed installs.",
    "calculatorNotes": [
      "Use 600,000 pixels per Ethernet port for recommended calculations.",
      "Official per-port maximum is 650,000 pixels.",
      "16 ports × 600,000 = 9,600,000 theoretical, but device pixel cap is 8,800,000.",
      "Use 8,800,000 as the recommended and maximum calculator limit.",
      "Maximum output width is 7,680 pixels.",
      "Maximum output height is 4,320 pixels.",
      "Supports HDR10 and 8/10/12-bit colour depth.",
      "4 OPT outputs (2 main + 2 backup) for fiber transmission."
    ]
  },
  {
    "id": "vx600", "name": "NovaStar VX600", "category": "all-in-one",
    "processorType": "All-in-one video processor and LED controller", "isModular": false,
    "ethernetPorts": 6, "ethernetPortType": "1G RJ45",
    "officialPerPortMaxPixels": 650000, "recommendedPerPortPixels": 600000,
    "officialTheoreticalMaxPixels": 3900000, "recommendedMaxPixels": 3600000,
    "devicePixelCap": 3900000, "maxInputPixels": null, "maxInputResolution": "4K-class input depending on connector",
    "maxOutputWidth": 10240, "maxOutputHeight": 8192,
    "opticalOutputs": 2, "videoInputs": ["HDMI", "DVI", "3G-SDI", "OPT"],
    "supportsScaling": true, "supportsLayers": true, "maxLayers": 3,
    "supportsGenlock": true, "supportsFiberMode": true,
    "bestUse": "Medium LED walls needing built-in scaling, processing, and multiple layers.",
    "calculatorNotes": [
      "Use 600,000 pixels per Ethernet port for recommended calculations.",
      "Official loading capacity is 3,900,000 pixels.",
      "6 ports × 600,000 = 3,600,000 recommended pixels.",
      "6 ports × 650,000 = 3,900,000 theoretical pixels.",
      "Maximum output width is 10,240 pixels.", "Maximum output height is 8,192 pixels."
    ]
  },
  {
    "id": "vx1000", "name": "NovaStar VX1000", "category": "all-in-one",
    "processorType": "All-in-one video processor and LED controller", "isModular": false,
    "ethernetPorts": 10, "ethernetPortType": "1G RJ45",
    "officialPerPortMaxPixels": 650000, "recommendedPerPortPixels": 600000,
    "officialTheoreticalMaxPixels": 6500000, "recommendedMaxPixels": 6000000,
    "devicePixelCap": 6500000, "maxInputPixels": null, "maxInputResolution": "4K-class input depending on connector",
    "maxOutputWidth": 10240, "maxOutputHeight": 8192,
    "opticalOutputs": 2, "videoInputs": ["HDMI 1.4", "DVI", "3G-SDI", "OPT"],
    "supportsScaling": true, "supportsLayers": true, "maxLayers": 3,
    "supportsGenlock": true, "supportsFiberMode": true,
    "bestUse": "Larger rental or stage LED walls where 6 output ports are not enough.",
    "calculatorNotes": [
      "Use 600,000 pixels per Ethernet port for recommended calculations.",
      "Official loading capacity is 6,500,000 pixels.",
      "10 ports × 600,000 = 6,000,000 recommended pixels.",
      "10 ports × 650,000 = 6,500,000 theoretical pixels.",
      "Maximum output width is 10,240 pixels.", "Maximum output height is 8,192 pixels."
    ]
  },
  {
    "id": "vx2000-pro", "name": "NovaStar VX2000 Pro", "category": "all-in-one",
    "processorType": "High-capacity all-in-one video processor and LED controller", "isModular": false,
    "ethernetPorts": 20, "ethernetPortType": "1G RJ45",
    "officialPerPortMaxPixels": 650000, "recommendedPerPortPixels": 600000,
    "officialTheoreticalMaxPixels": 13000000, "recommendedMaxPixels": 12000000,
    "devicePixelCap": 13000000, "maxInputPixels": null, "maxInputResolution": "4K×2K@60Hz class",
    "maxOutputWidth": 16384, "maxOutputHeight": 8192,
    "opticalOutputs": 4, "videoInputs": ["DP 1.2", "HDMI 2.0", "HDMI 1.3", "12G-SDI", "OPT", "USB 3.0"],
    "supportsScaling": true, "supportsLayers": true, "maxLayers": 12,
    "supportsGenlock": true, "supportsFiberMode": true,
    "bestUse": "Large LED walls, ultra-wide screens, high-output rental builds, and complex processing jobs.",
    "calculatorNotes": [
      "Use 600,000 pixels per Ethernet port for recommended calculations.",
      "Official loading capacity is 13,000,000 pixels.",
      "20 ports × 600,000 = 12,000,000 recommended pixels.",
      "20 ports × 650,000 = 13,000,000 theoretical pixels.",
      "Maximum output width is 16,384 pixels.", "Maximum output height is 8,192 pixels.",
      "Supports high layer counts and advanced scaling."
    ]
  },
  {
    "id": "mx40-pro", "name": "NovaStar MX40 Pro", "category": "controller",
    "processorType": "COEX 4K LED display controller", "isModular": false,
    "ethernetPorts": 20, "ethernetPortType": "1G RJ45",
    "officialPerPortMaxPixels": 659722, "recommendedPerPortPixels": 600000,
    "officialTheoreticalMaxPixels": 9000000, "recommendedMaxPixels": 9000000,
    "devicePixelCap": 9000000, "maxInputPixels": null, "maxInputResolution": "4K-class input depending on connector",
    "maxOutputWidth": 16384, "maxOutputHeight": 16384,
    "opticalOutputs": 4, "videoInputs": ["HDMI 2.0", "DP 1.2", "12G-SDI"],
    "supportsScaling": true, "supportsLayers": true, "maxLayers": 3,
    "supportsGenlock": true, "supportsFiberMode": false,
    "bitDepthPortLimits": { "8bit60Hz": 659722, "10bit60Hz": 494791, "12bit60Hz": 329861 },
    "bestUse": "Higher-end COEX workflows, 4K controller setups, better colour handling, and bit-depth-aware LED builds.",
    "calculatorNotes": [
      "The MX40 Pro has 20 Ethernet ports, but the device-level loading cap is 9,000,000 pixels.",
      "Do not calculate this as 20 × 600,000 = 12,000,000 usable pixels.",
      "Use 9,000,000 pixels as the recommended and maximum calculator limit.",
      "At 8-bit/60Hz, official per-port capacity is 659,722 pixels.",
      "At 10-bit/60Hz, official per-port capacity is 494,791 pixels.",
      "At 12-bit/60Hz, official per-port capacity is 329,861 pixels.",
      "For simple calculator mode, cap the processor at 9,000,000 pixels."
    ]
  },
  {
    "id": "h2", "name": "NovaStar H2", "category": "splicer",
    "processorType": "Modular video wall splicer / processor", "isModular": true,
    "ethernetPorts": null, "ethernetPortType": "Card-dependent",
    "officialPerPortMaxPixels": null, "recommendedPerPortPixels": null,
    "officialTheoreticalMaxPixels": null, "recommendedMaxPixels": null,
    "devicePixelCap": null, "maxInputPixels": null,
    "maxInputResolution": "Card-dependent; up to 4K-class depending on installed input cards",
    "maxOutputWidth": null, "maxOutputHeight": null,
    "opticalOutputs": null,
    "videoInputs": ["HDMI", "DVI", "VGA", "CVBS", "3G-SDI", "12G-SDI", "DP"],
    "supportsScaling": true, "supportsLayers": true, "maxLayers": 32,
    "supportsGenlock": true, "supportsFiberMode": true,
    "bestUse": "Large custom LED/video-wall systems, multi-source splicing, and modular card-based installations.",
    "calculatorNotes": [
      "Do not treat H2 as a fixed-port LED controller.",
      "H2 capacity depends on the installed input, output, and LED sending cards.",
      "Show this as a custom/card-dependent processor in the calculator.",
      "Require the user to choose the installed output card type and quantity before calculating LED load.",
      "For simple calculator mode, display H2 as Custom / Modular rather than assigning a fixed pixel limit."
    ]
  }
];
