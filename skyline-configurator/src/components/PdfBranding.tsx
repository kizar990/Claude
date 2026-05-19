/**
 * Shared Skyline Whitespace brand components for @react-pdf/renderer documents.
 * Used by both ClientPdfExport and TechPdfExport.
 *
 * Logo: place the white PNG at src/assets/brand/logo-white.png
 * Until then the text-based logo is used as fallback.
 */

import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

// ── Brand colour palette ─────────────────────────────────────────────────────
export const C = {
  navy:     "#0F1C3F",   // header band
  blue:     "#1A56A0",   // section headings, accent
  red:      "#C53030",   // dimension callouts
  dark:     "#1A202C",   // primary body text
  mid:      "#4A5568",   // secondary text
  muted:    "#718096",   // labels, footer address
  rule:     "#CBD5E0",   // borders, rules
  pale:     "#EDF2F7",   // alternating table rows
  paleBlu:  "#EBF4FF",   // callout box background
  white:    "#FFFFFF",
} as const;

// ── Shared layout constants ──────────────────────────────────────────────────
export const MARGIN_H   = 36;   // left / right page margin (pt)
export const HEADER_H   = 58;   // header band height
export const FOOTER_H   = 96;   // footer strip height (content + metadata table)

// ── Shared StyleSheet ────────────────────────────────────────────────────────
export const brand = StyleSheet.create({
  // Header band
  headerBand: {
    backgroundColor: C.navy,
    height: HEADER_H,
    paddingHorizontal: MARGIN_H,
    paddingBottom: 10,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
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

  // Footer strip
  footerStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: FOOTER_H,
    borderTopWidth: 0.75,
    borderTopColor: C.rule,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: MARGIN_H,
    paddingTop: 8,
  },
  footerAddress: {
    flex: 1,
    fontSize: 6.5,
    color: C.muted,
    lineHeight: 1.6,
  },
  footerPageNum: {
    fontSize: 6.5,
    color: C.muted,
    marginTop: 6,
  },

  // Metadata title block (bottom-right of footer)
  metaBlock: {
    width: 198,
    borderWidth: 0.5,
    borderColor: C.rule,
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
    width: 70,
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
    color: C.dark,
    fontFamily: "Helvetica-Bold",
    padding: "2.5 4",
  },
});

// ── BrandHeader ──────────────────────────────────────────────────────────────

interface HeaderProps {
  docType?: string;
  docTitle?: string;
}

export function BrandHeader({
  docType = "Configuration Document",
  docTitle = "LED Wall Configuration",
}: HeaderProps) {
  return (
    <View style={brand.headerBand}>
      {/* Logo — text fallback; swap for <Image> once logo-white.png is supplied */}
      <View style={brand.logoBlock}>
        <Text style={brand.logoSkyline}>Skyline®</Text>
        <Text style={brand.logoWhitespace}>whitespace</Text>
      </View>
      <View style={brand.headerRight}>
        <Text style={brand.headerDocType}>{docType}</Text>
        <Text style={brand.headerDocTitle}>{docTitle}</Text>
      </View>
    </View>
  );
}

// ── BrandFooter ──────────────────────────────────────────────────────────────

interface FooterRow {
  label: string;
  value: string;
}

interface FooterProps {
  rows: FooterRow[];
  pageNumber?: number;
  totalPages?: number;
}

export function BrandFooter({ rows }: FooterProps) {
  return (
    <View fixed style={brand.footerStrip}>
      {/* Left: company address */}
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
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
        />
      </View>

      {/* Right: title-block metadata table */}
      <View style={brand.metaBlock}>
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1;
          return (
            <View
              key={row.label}
              style={isLast ? brand.metaBlockRowLast : brand.metaBlockRow}
            >
              <Text style={brand.metaBlockKey}>{row.label}</Text>
              <Text style={brand.metaBlockVal}>{row.value || "—"}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
