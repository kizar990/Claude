import React from "react";
import { renderToFile } from "@react-pdf/renderer";
import { calcAll } from "../src/calculations";
import { ClientPdfDocument } from "../src/components/ClientPdfExport";

const meta = {
  name: "Installer Show 2026",
  jobNumber: "SW-2026-001",
  client: "ClivetGroup Events Ltd",
  date: "2026-05-19",
  venue: "ExCeL London, Hall S7",
  contact: "James Hartley",
};

const calc = calcAll({ columns: 6, rows: 5, blankPanels: 0 });

const fields = {
  projectInfo:       true,
  screenSpecs:       true,
  contentSpec:       true,
  powerRequirements: true,
  materialList:      false,
  visualRender:      true,
  chainOverlay:      false,
};

const outPath = "./scripts/sample-client.pdf";

await renderToFile(
  React.createElement(ClientPdfDocument, {
    meta,
    calc,
    overrides: {},
    blankCells: [],
    chains: [],
    fields,
  }),
  outPath
);

console.log("✓ Generated:", outPath);
