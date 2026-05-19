/**
 * Shared Skyline Whitespace brand components for @react-pdf/renderer documents.
 * Logo: place white PNG at src/assets/brand/logo-white.png — text fallback used until then.
 */

import { View, Text, StyleSheet } from "@react-pdf/renderer";

// ── Brand colour palette (sourced from SW / WS logo assets) ─────────────────
export const C = {
  navy:     "#0F1C3F",   // primary — header band, body text
  orange:   "#D63025",   // SW lightning-bolt accent — section rules, callout borders
  coral:    "#E8724A",   // WS blob warm accent
  skyBlue:  "#1A56A0",   // WS blob cool accent — metadata labels
  dark:     "#1A202C",   // body text
  mid:      "#4A5568",   // secondary text
  muted:    "#718096",   // footer address, table labels
  rule:     "#CBD5E0",   // borders, dividers
  pale:     "#EDF2F7",   // alternating table rows
  paleBlu:  "#EBF4FF",   // content spec callout bg
  white:    "#FFFFFF",
} as const;

// ── Layout constants ─────────────────────────────────────────────────────────
export const MARGIN_H = 36;
export const HEADER_H = 62;   // includes 3pt orange accent stripe at bottom
export const FOOTER_H = 96;

// ── StyleSheet ───────────────────────────────────────────────────────────────
export const brand = StyleSheet.create({
  // Header
  headerBand: {
    backgroundColor: C.navy,
    paddingHorizontal: MARGIN_H,
    paddingBottom: 10,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  headerAccentBar: {
    height: 3,
    backgroundColor: C.orange,
  },
  logoBlock: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  logoSkyline: {
    fontFamily: "Helvetica-BoldOblique",
    fontSize: 7.5,
    color: C.white,
    letterSpacing: 0.8,
  },
  logoWhitespace: {
    fontFamily: "Helvetica-Bold",
    fontSize: 17,
    color: C.white,
    letterSpacing: -0.3,
    marginTop: -2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerDocType: {
    fontSize: 7,
    color: "#8BA3CC",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  headerDocTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },

  // Footer
  footerStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: FOOTER_H,
    borderTopWidth: 2,
    borderTopColor: C.orange,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: MARGIN_H,
    paddingTop: 8,
  },
  footerAddress: {
    fontSize: 6.5,
    color: C.muted,
    lineHeight: 1.6,
  },
  footerPageNum: {
    fontSize: 6.5,
    color: C.muted,
    marginTop: 6,
  },

  // Title block (bottom-right)
  metaBlock: {
    width: 200,
    borderWidth: 0.5,
    borderColor: C.rule,
    borderTopWidth: 2,
    borderTopColor: C.navy,
  },
  metaBlockRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.rule,
  },
  metaBlockRowLast: {
    flexDirection: "row",
  },
  metaBlockKey: {
    width: 72,
    fontSize: 6,
    color: C.muted,
    padding: "2.5 4",
    borderRightWidth: 0.5,
    borderRightColor: C.rule,
    backgroundColor: C.pale,
  },
  metaBlockVal: {
    flex: 1,
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    padding: "2.5 4",
  },
});

// ── BrandHeader ──────────────────────────────────────────────────────────────

export function BrandHeader({
  docType = "Configuration Document",
  docTitle = "LED Wall Configuration",
}: {
  docType?: string;
  docTitle?: string;
}) {
  return (
    <>
      <View style={brand.headerBand}>
        <View style={brand.logoBlock}>
          <Text style={brand.logoSkyline}>Skyline®</Text>
          <Text style={brand.logoWhitespace}>whitespace</Text>
        </View>
        <View style={brand.headerRight}>
          <Text style={brand.headerDocType}>{docType}</Text>
          <Text style={brand.headerDocTitle}>{docTitle}</Text>
        </View>
      </View>
      <View style={brand.headerAccentBar} />
    </>
  );
}

// ── BrandFooter ──────────────────────────────────────────────────────────────

export function BrandFooter({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <View fixed style={brand.footerStrip}>
      <View style={{ flex: 1 }}>
        <Text style={brand.footerAddress}>
          Skyline Whitespace  ·  320 Western Road, Wimbledon, London SW19 2QA
        </Text>
        <Text style={brand.footerAddress}>
          Tel. +44 (0) 345 260 5440  ·  www.skylinewhitespace.com
        </Text>
        <Text style={[brand.footerAddress, { marginTop: 4 }]}>
          Copyright © 2025 by Skyline Whitespace. All rights reserved.
        </Text>
        <Text
          style={brand.footerPageNum}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </View>
      <View style={brand.metaBlock}>
        {rows.map((row, i) => (
          <View key={row.label} style={i === rows.length - 1 ? brand.metaBlockRowLast : brand.metaBlockRow}>
            <Text style={brand.metaBlockKey}>{row.label}</Text>
            <Text style={brand.metaBlockVal}>{row.value || "—"}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
