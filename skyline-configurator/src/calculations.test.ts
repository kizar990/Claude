import { describe, it, expect } from "vitest";
import {
  calcDimensions,
  calcMaterials,
  calcPower,
  calcProcessorFromDimensions,
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
    expect(d.pixelsW).toBe(1344); // 7 × 192
    expect(d.pixelsH).toBe(576);  // 3 × 192
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
  it("Processor = 1 (HD sufficient for 1344×576)", () => { expect(m.processor).toBe(1); });
  it("POWER/HDMI/USB-A/UTP = 1", () => { expect(m.powerHdmiUsbUtp).toBe(1); });
  it("Mediaplayer = 1", () => { expect(m.mediaplayer).toBe(1); });
  it("POWER/HDMI/USB stick = 1", () => { expect(m.powerHdmiUsbStick).toBe(1); });
});

describe("calcPower — 21 panels, 13A circuits at 240V", () => {
  const p = calcPower(21);

  it("total watts = 21 × 150 = 3150 W", () => {
    expect(p.totalWatts).toBe(3150);
  });
  it("amps = 3150 / 240 ≈ 13.125 A", () => {
    expect(p.amps).toBeCloseTo(13.125);
  });
  it("13A circuits = ceil(3150 / 2496) = 2", () => {
    expect(p.circuits).toBe(2); // ceil(1.262) = 2
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
  it("1344×576 (7×3) → 1 processor, no upgrade needed", () => {
    const p = calcProcessorFromDimensions(1344, 576);
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

describe("calcAll — 7×3 integration", () => {
  const result = calcAll(REF_INPUT);

  it("dimensions match 496mm reference", () => {
    expect(result.dimensions.activePanels).toBe(21);
    expect(result.dimensions.widthM).toBeCloseTo(3.472, 3);
    expect(result.dimensions.heightM).toBeCloseTo(1.488, 3);
  });
  it("content spec uses panel pixel count, not physical size", () => {
    expect(result.contentSpec).toBe(
      "Create content at 1344×576 px, MP4 H.264, 50 Hz, start pixel 0,0, top-left corner"
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

  it("pixelsToInput — 1344×576 → 7×3 with zero delta (aligned input, no snap needed)", () => {
    const r = pixelsToInput(1344, 576);
    expect(r.input.columns).toBe(7);
    expect(r.input.rows).toBe(3);
    expect(r.deltaW).toBe(0);
    expect(r.deltaH).toBe(0);
  });

  it("pixelsToInput — 1920×1080 → 10×5.625? rounds correctly", () => {
    const r = pixelsToInput(1920, 1080);
    expect(r.input.columns).toBe(10); // 1920/192 = 10 exact
    expect(r.input.rows).toBe(6);    // 1080/192 = 5.625 → rounds to 6
    expect(r.deltaW).toBe(0);
    expect(r.deltaH).toBe(6 * 192 - 1080); // 1152 - 1080 = +72
  });

  it("pixelsToInput snaps non-exact pixels and reports delta", () => {
    const r = pixelsToInput(1400, 600); // 1400/192 = 7.29 → 7; 600/192 = 3.125 → 3
    expect(r.input.columns).toBe(7);
    expect(r.input.rows).toBe(3);
    expect(r.deltaW).toBe(1344 - 1400); // -56
    expect(r.deltaH).toBe(576 - 600);   // -24
  });
});
