import { describe, it, expect } from "vitest";
import {
  calcDimensions,
  calcMaterials,
  calcPower,
  calcProcessorFromDimensions,
  calcProcessorSufficiency,
  calcAll,
  snapToPanel,
  metresToInput,
  pixelsToInput,
} from "./calculations";

// Reference case: 7 columns × 3 rows, 0 blank = 21 active panels
// Panel size: 496mm × 496mm (confirmed default)
const REF_INPUT = { columns: 7, rows: 3, blankPanels: 0 };

describe("calcDimensions — 7×3 at 496mm panels", () => {
  const d = calcDimensions(REF_INPUT);

  it("total and active panels", () => {
    expect(d.totalPanels).toBe(21);
    expect(d.activePanels).toBe(21);
  });

  it("physical size in mm — 7 × 496 = 3472, 3 × 496 = 1488", () => {
    expect(d.widthMm).toBe(3472);
    expect(d.heightMm).toBe(1488);
  });

  it("physical size in metres to 3dp", () => {
    expect(d.widthM).toBeCloseTo(3.472, 3);
    expect(d.heightM).toBeCloseTo(1.488, 3);
  });

  it("pixel resolution unchanged (depends on pixel count, not panel size)", () => {
    expect(d.pixelsW).toBe(1792); // 7 × 256
    expect(d.pixelsH).toBe(768);  // 3 × 256
  });

  it("aspect ratio", () => {
    expect(d.aspectRatio).toBe("7:3");
  });
});

describe("calcDimensions — blank panels", () => {
  it("subtracts blank panels from active count, frame size stays full", () => {
    const d = calcDimensions({ columns: 7, rows: 3, blankPanels: 1 });
    expect(d.activePanels).toBe(20);
    expect(d.widthMm).toBe(3472);
    expect(d.heightMm).toBe(1488);
  });
});

describe("calcMaterials — 21 panels (reference sheet values)", () => {
  const m = calcMaterials(21);

  it("LED flightcases = ceil(21 / 10) = 3", () => {
    expect(m.ledFlightcases).toBe(3);
  });
  it("LED panels = 21", () => { expect(m.ledPanels).toBe(21); });
  it("Powerlink 1m = 3 cases × 10 = 30", () => { expect(m.powerlink1m).toBe(30); });
  it("Datalink 1m = 3 cases × 10 = 30", () => { expect(m.datalink1m).toBe(30); });
  it("Powerstart 10m = 3 cases × 1 = 3", () => { expect(m.powerstart10m).toBe(3); });
  it("Powerstart 1m = 3 cases × 1 = 3", () => { expect(m.powerstart1m).toBe(3); });
  it("Datastart KIT = 3 cases × 2 = 6", () => { expect(m.datastartKit).toBe(6); });
  it("E-tape rolls = 3 cases × 1 = 3", () => { expect(m.etapeRolls).toBe(3); });
  it("FIT KIT = 3 cases × 10 = 30", () => { expect(m.fitKit).toBe(30); });
  it("Neutrik Couplers = 4 (fixed)", () => { expect(m.neutrikCouplers).toBe(4); });
  it("PROC Flightcase = 1 (fixed)", () => { expect(m.procFlightcase).toBe(1); });
  it("LED spares = ceil(21 × 0.1) = 3", () => { expect(m.ledSpares).toBe(3); });
  it("Processor = 1 (HD sufficient for 1792×768)", () => { expect(m.processor).toBe(1); });
  it("POWER/HDMI/USB-A/UTP = 1", () => { expect(m.powerHdmiUsbUtp).toBe(1); });
  it("Mediaplayer = 1", () => { expect(m.mediaplayer).toBe(1); });
  it("POWER/HDMI/USB stick = 1", () => { expect(m.powerHdmiUsbStick).toBe(1); });
});

describe("calcPower — 21 panels, 13A circuits at 240V", () => {
  const p = calcPower(21);

  it("total watts = 21 × 120 = 2520 W", () => {
    expect(p.totalWatts).toBe(2520);
  });
  it("amps = 2520 / 240 = 10.5 A", () => {
    expect(p.amps).toBeCloseTo(10.5);
  });
  it("13A circuits = ceil(2520 / 2496) = 2", () => {
    expect(p.circuits).toBe(2); // ceil(1.0096) = 2
  });
  it("data links = 2", () => {
    expect(p.utpDataCables).toBe(2);
  });
  it("no utpBackupCables field", () => {
    expect((p as unknown as Record<string, unknown>).utpBackupCables).toBeUndefined();
  });
  it("data lines = ceil(21 / 13) = 2", () => {
    expect(p.dataLines).toBe(2);
  });
});

describe("calcProcessorFromDimensions", () => {
  it("1792×768 (7×3) → 1 processor, no upgrade needed", () => {
    const p = calcProcessorFromDimensions(1792, 768);
    expect(p.count).toBe(1);
    expect(p.needsUpgrade).toBe(false);
    expect(p.warning).toBeNull();
  });
  it("1920×1080 (exactly HD) → 1 processor", () => {
    const p = calcProcessorFromDimensions(1920, 1080);
    expect(p.count).toBe(1);
    expect(p.needsUpgrade).toBe(false);
  });
  it("2304×1152 → needs upgrade", () => {
    const p = calcProcessorFromDimensions(2304, 1152);
    expect(p.needsUpgrade).toBe(true);
    expect(p.count).toBeGreaterThanOrEqual(2);
    expect(p.warning).toMatch(/⚠/);
  });
});

// Helper: calcProcessorSufficiency with panel count, default cfg
function sufficiency(cols: number, rows: number, processorId: string) {
  const panels = cols * rows;
  const pixelsW = cols * 256;
  const pixelsH = rows * 256;
  return calcProcessorSufficiency(pixelsW, pixelsH, panels, processorId);
}

describe("calcProcessorSufficiency — three-state panel-load check", () => {
  // MCTRL660: 4 ports × floor(650000/65536) = 4 × 9 = 36 panels capacity

  it("6×5 (30 panels) with MCTRL660 (36 cap) → OK at 83%", () => {
    const p = sufficiency(6, 5, "mctrl660");
    expect(p.status).toBe("ok");
    expect(p.needsUpgrade).toBe(false);
    expect(p.panelCapacity).toBe(36); // 4 ports × 9
    expect(p.panelLoad).toBeCloseTo(30 / 36, 4);
    expect(p.warning).toBeNull();
  });

  it("6×5 (30 panels) with MCTRL660 Pro (54 cap) → OK at 55.6%", () => {
    const p = sufficiency(6, 5, "mctrl660pro");
    expect(p.status).toBe("ok");
    expect(p.needsUpgrade).toBe(false);
    expect(p.panelCapacity).toBe(54); // 6 ports × 9
    expect(p.warning).toBeNull();
  });

  it("7×3 (21 panels) with MCTRL660 (36 cap) → OK at 58.3%", () => {
    const p = sufficiency(7, 3, "mctrl660");
    expect(p.status).toBe("ok");
    expect(p.panelLoad).toBeCloseTo(21 / 36, 4);
    expect(p.warning).toBeNull();
  });

  it("7×4 (28 panels) with MCTRL660 (36 cap) → OK at 77.8%", () => {
    const p = sufficiency(7, 4, "mctrl660");
    expect(p.status).toBe("ok");
    expect(p.panelLoad).toBeCloseTo(28 / 36, 4);
  });

  it("8×5 (40 panels) with MCTRL660 (36 cap) → INSUFFICIENT", () => {
    const p = sufficiency(8, 5, "mctrl660");
    expect(p.status).toBe("insufficient");
    expect(p.needsUpgrade).toBe(true);
    expect(p.warning).toMatch(/⚠/);
  });

  it("pixel resolution failure also gives INSUFFICIENT", () => {
    // MCTRL660 max 1920×1200; 8×5 = 2048×1280 exceeds it
    const p = sufficiency(8, 5, "mctrl660");
    expect(p.status).toBe("insufficient");
    expect(p.warning).toMatch(/⚠/);
  });
});

describe("calcAll — 7×3 integration", () => {
  const result = calcAll(REF_INPUT);

  it("dimensions match 496mm reference", () => {
    expect(result.dimensions.activePanels).toBe(21);
    expect(result.dimensions.widthM).toBeCloseTo(3.472, 3);
    expect(result.dimensions.heightM).toBeCloseTo(1.488, 3);
  });
  it("content spec uses panel pixel count, not physical size", () => {
    expect(result.contentSpec).toBe(
      "Create content at 1792×768 px, MP4 H.264, 50 Hz, start pixel 0,0, top-left corner"
    );
  });
  it("no processor warning for HD-sized screen", () => {
    expect(result.processor.warning).toBeNull();
  });
});

describe("input mode helpers — 496mm panels", () => {
  it("snapToPanel rounds to nearest panel", () => {
    const s = snapToPanel(1600, 496); // target 1.6m, panel 0.496m
    expect(s.panels).toBe(3);       // nearest = 3 × 496 = 1488mm
    expect(s.actualMm).toBe(1488);
    expect(s.deltaMm).toBe(-112);   // 1488 - 1600
  });

  it("metresToInput — 3.472m × 1.488m → exactly 7×3 with zero delta", () => {
    const r = metresToInput(3.472, 1.488);
    expect(r.input.columns).toBe(7);
    expect(r.input.rows).toBe(3);
    expect(r.deltaWMm).toBeCloseTo(0, 1);
    expect(r.deltaHMm).toBeCloseTo(0, 1);
  });

  it("metresToInput snaps non-exact metres to nearest panel", () => {
    const r = metresToInput(3.5, 1.5); // 3500mm / 496 = 7.06 → 7 panels; 1500mm / 496 = 3.02 → 3 panels
    expect(r.input.columns).toBe(7);
    expect(r.input.rows).toBe(3);
    expect(r.deltaWMm).toBeCloseTo(3472 - 3500, 0); // -28mm
    expect(r.deltaHMm).toBeCloseTo(1488 - 1500, 0); // -12mm
  });

  it("pixelsToInput — 1792×768 → 7×3 with zero delta (aligned input, no snap needed)", () => {
    const r = pixelsToInput(1792, 768);
    expect(r.input.columns).toBe(7);
    expect(r.input.rows).toBe(3);
    expect(r.deltaW).toBe(0);
    expect(r.deltaH).toBe(0);
  });

  it("pixelsToInput — 1920×1080 → rounds correctly", () => {
    const r = pixelsToInput(1920, 1080);
    expect(r.input.columns).toBe(8);  // 1920/256 = 7.5 → rounds to 8
    expect(r.input.rows).toBe(4);     // 1080/256 = 4.21875 → rounds to 4
    expect(r.deltaW).toBe(8 * 256 - 1920); // 2048 - 1920 = +128
    expect(r.deltaH).toBe(4 * 256 - 1080); // 1024 - 1080 = -56
  });

  it("pixelsToInput snaps non-exact pixels and reports delta", () => {
    const r = pixelsToInput(1400, 600); // 1400/256 = 5.47 → 5; 600/256 = 2.34 → 2
    expect(r.input.columns).toBe(5);
    expect(r.input.rows).toBe(2);
    expect(r.deltaW).toBe(5 * 256 - 1400); // 1280 - 1400 = -120
    expect(r.deltaH).toBe(2 * 256 - 600);  // 512 - 600 = -88
  });
});
