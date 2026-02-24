import jsPDF from "jspdf";
import type { DbProposal } from "./api";
import { formatCurrency, services as allServicesCatalog, calculateServicePrice } from "./pricing-data";
import { dbToSelected } from "./api";

/* ─── Color palette (HTZ) ─── */
const C = {
  dark: [18, 34, 50] as [number, number, number],       // #122232
  heading: [40, 65, 92] as [number, number, number],     // #28415C
  accent: [4, 131, 171] as [number, number, number],     // #0483AB
  green: [60, 206, 167] as [number, number, number],     // #3CCEA7
  greenDark: [19, 85, 67] as [number, number, number],   // #135543
  body: [78, 105, 135] as [number, number, number],      // #4E6987
  label: [152, 152, 157] as [number, number, number],    // #98989D
  divider: [221, 227, 236] as [number, number, number],  // #DDE3EC
  bgLight: [246, 247, 249] as [number, number, number],  // #F6F7F9
  white: [255, 255, 255] as [number, number, number],
  accentBg: [220, 240, 255] as [number, number, number], // #DCF0FF
  greenBg: [217, 248, 239] as [number, number, number],  // #D9F8EF
};

const F = "DMSans"; // font family constant

/* ─── Helpers ─── */

function formatDateBR(iso: string): string {
  try {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return iso;
  }
}

function fmtCurr(v: number): string {
  return formatCurrency(v);
}

/* ─── Rounded rect helper ─── */
function roundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  style: "F" | "S" | "FD" = "F"
) {
  doc.roundedRect(x, y, w, h, r, r, style);
}

/* ─── Font loader (DM Sans from Google Fonts via jsDelivr) ─── */

const FONT_URL =
  "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf";

let fontCache: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function loadDMSansFont(): Promise<string> {
  if (fontCache) return fontCache;
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error("Failed to fetch DM Sans font");
  const buf = await res.arrayBuffer();
  fontCache = arrayBufferToBase64(buf);
  return fontCache;
}

function registerFont(doc: jsPDF, base64: string) {
  doc.addFileToVFS("DMSans-Variable.ttf", base64);
  doc.addFont("DMSans-Variable.ttf", F, "normal");
  doc.addFont("DMSans-Variable.ttf", F, "bold");
  doc.setFont(F);
}

/* ─── Main export ─── */

export async function generateProposalPDF(proposal: DbProposal): Promise<void> {
  /* Load DM Sans font */
  const fontBase64 = await loadDMSansFont();

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  /* Register DM Sans */
  registerFont(doc, fontBase64);

  const pageW = 210;
  const pageH = 297;
  const mL = 20; // margin left
  const mR = 20; // margin right
  const contentW = pageW - mL - mR; // 170mm
  let y = 0; // cursor

  /* ─── Compute services ─── */
  const dbServices = proposal.price_proposal_services ?? [];
  const serviceDetails = dbServices.map((dbSvc) => {
    const catalogSvc = allServicesCatalog.find((s) => s.id === dbSvc.service_id);
    if (catalogSvc) {
      const selected = dbToSelected(dbSvc);
      const calc = calculateServicePrice(catalogSvc, selected);
      return { name: catalogSvc.name, monthly: calc.monthly, impl: calc.impl, hours: calc.hours };
    }
    return {
      name: dbSvc.service_id,
      monthly: dbSvc.computed_monthly ?? 0,
      impl: dbSvc.computed_impl ?? 0,
      hours: dbSvc.computed_hours ?? 0,
    };
  });

  const totalHours = serviceDetails.reduce((s, sv) => s + sv.hours, 0);

  /* ═══════════════════════════════════════════════════════════════ */
  /*  PAGE HEADER                                                    */
  /* ═══════════════════════════════════════════════════════════════ */

  // Top accent bar
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, pageW, 3, "F");

  y = 18;

  // HTZ logo text
  doc.setFont(F, "bold");
  doc.setFontSize(28);
  doc.setTextColor(...C.heading);
  doc.text("HTZ", mL, y);

  // "PROPOSTA COMERCIAL" right-aligned
  doc.setFont(F, "normal");
  doc.setFontSize(10);
  doc.setTextColor(...C.label);
  doc.text("PROPOSTA COMERCIAL", pageW - mR, y - 4, { align: "right" });

  // Proposal ID
  doc.setFont(F, "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.accent);
  doc.text(proposal.id, pageW - mR, y + 2, { align: "right" });

  y += 8;

  // Divider
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.4);
  doc.line(mL, y, pageW - mR, y);

  /* ═══════════════════════════════════════════════════════════════ */
  /*  CLIENT INFO CARD                                               */
  /* ═══════════════════════════════════════════════════════════════ */

  y += 8;

  // Background card
  doc.setFillColor(...C.bgLight);
  roundedRect(doc, mL, y, contentW, 28, 4, "F");

  const infoY = y + 7;

  // Column 1 - Client
  doc.setFont(F, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.label);
  doc.text("CLIENTE", mL + 8, infoY);
  doc.setFont(F, "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.heading);
  doc.text(proposal.client_name, mL + 8, infoY + 6);

  // Column 2 - Date
  const col2X = mL + 70;
  doc.setFont(F, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.label);
  doc.text("DATA", col2X, infoY);
  doc.setFont(F, "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.body);
  doc.text(formatDateBR(proposal.created_at), col2X, infoY + 6);

  // Column 3 - Status
  const col3X = mL + 115;
  doc.setFont(F, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.label);
  doc.text("STATUS", col3X, infoY);

  const statusLabels: Record<string, string> = {
    rascunho: "Rascunho",
    criada: "Criada",
    enviada: "Enviada",
    aprovada: "Aprovada",
    recusada: "Recusada",
  };
  doc.setFont(F, "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.body);
  doc.text(statusLabels[proposal.status] ?? proposal.status, col3X, infoY + 6);

  // Column 4 - Hours
  const col4X = mL + 148;
  doc.setFont(F, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.label);
  doc.text("HORAS/MES", col4X, infoY);
  doc.setFont(F, "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.body);
  doc.text(`${proposal.total_hours ?? totalHours}h`, col4X, infoY + 6);

  y += 36;

  /* ═══════════════════════════════════════════════════════════════ */
  /*  SERVICES TABLE                                                 */
  /* ═══════════════════════════════════════════════════════════════ */

  // Section title
  doc.setFont(F, "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.heading);
  doc.text("Servi\u00e7os Inclusos", mL, y);

  y += 8;

  // Table header
  const colX = {
    num: mL,
    name: mL + 8,
    monthly: mL + 100,
    impl: mL + 130,
    hours: mL + 160,
  };

  doc.setFillColor(...C.accentBg);
  roundedRect(doc, mL, y - 4, contentW, 9, 3, "F");

  doc.setFont(F, "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.accent);
  doc.text("#", colX.num + 2, y + 1);
  doc.text("SERVI\u00c7O", colX.name, y + 1);
  doc.text("MENSAL", colX.monthly + 24, y + 1, { align: "right" });
  doc.text("IMPL.", colX.impl + 24, y + 1, { align: "right" });
  doc.text("HORAS", colX.hours + 10, y + 1, { align: "right" });

  y += 9;

  // Table rows
  serviceDetails.forEach((svc, idx) => {
    // Check if we need a new page
    if (y > pageH - 50) {
      doc.addPage();
      registerFont(doc, fontBase64); // re-register font on new page
      y = 20;
    }

    const isEven = idx % 2 === 0;
    if (isEven) {
      doc.setFillColor(252, 253, 254);
      roundedRect(doc, mL, y - 3.5, contentW, 8, 2, "F");
    }

    doc.setFont(F, "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.label);
    doc.text(String(idx + 1).padStart(2, "0"), colX.num + 2, y + 1);

    doc.setFont(F, "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.dark);

    // Truncate long names
    const maxNameW = 85;
    let displayName = svc.name;
    while (doc.getTextWidth(displayName) > maxNameW && displayName.length > 3) {
      displayName = displayName.slice(0, -4) + "...";
    }
    doc.text(displayName, colX.name, y + 1);

    doc.setTextColor(...C.heading);
    doc.text(
      svc.monthly > 0 ? fmtCurr(svc.monthly) : "\u2014",
      colX.monthly + 24,
      y + 1,
      { align: "right" }
    );

    doc.setTextColor(...C.body);
    doc.text(
      svc.impl > 0 ? fmtCurr(svc.impl) : "\u2014",
      colX.impl + 24,
      y + 1,
      { align: "right" }
    );

    doc.text(
      svc.hours > 0 ? `${svc.hours}h` : "\u2014",
      colX.hours + 10,
      y + 1,
      { align: "right" }
    );

    y += 8;
  });

  // Divider before totals
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.3);
  doc.line(mL, y, pageW - mR, y);

  y += 6;

  // Totals row
  doc.setFillColor(...C.bgLight);
  roundedRect(doc, mL, y - 4, contentW, 10, 3, "F");

  doc.setFont(F, "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.heading);
  doc.text("TOTAL", colX.name, y + 1);
  doc.text(fmtCurr(proposal.total_monthly ?? 0), colX.monthly + 24, y + 1, { align: "right" });
  doc.text(fmtCurr(proposal.total_impl ?? 0), colX.impl + 24, y + 1, { align: "right" });
  doc.setTextColor(...C.body);
  doc.text(`${proposal.total_hours ?? totalHours}h`, colX.hours + 10, y + 1, { align: "right" });

  y += 16;

  /* ═══════════════════════════════════════════════════════════════ */
  /*  COMBO DISCOUNT BANNER                                          */
  /* ═══════════════════════════════════════════════════════════════ */

  if ((proposal.combo_discount_percent ?? 0) > 0) {
    // Check page break
    if (y > pageH - 60) {
      doc.addPage();
      registerFont(doc, fontBase64);
      y = 20;
    }

    doc.setFillColor(...C.greenBg);
    roundedRect(doc, mL, y, contentW, 16, 4, "F");

    // Green pill icon area
    doc.setFillColor(...C.green);
    roundedRect(doc, mL + 5, y + 3.5, 9, 9, 2, "F");

    doc.setFont(F, "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C.white);
    doc.text("%", mL + 7.4, y + 10);

    // Label
    doc.setFont(F, "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C.greenDark);
    doc.text(proposal.combo_label || "Desconto Combo", mL + 18, y + 8);

    // Subtitle
    doc.setFont(F, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(19, 85, 67);
    doc.text("Desconto combo aplicado na mensalidade", mL + 18, y + 13);

    // Discount badge
    const discText = `-${proposal.combo_discount_percent}%`;
    const discW = doc.getTextWidth(discText) + 8;
    doc.setFillColor(60, 206, 167, 50);
    roundedRect(doc, pageW - mR - discW - 5, y + 4.5, discW + 4, 7.5, 3, "F");
    doc.setFont(F, "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.greenDark);
    doc.text(discText, pageW - mR - 6, y + 9.5, { align: "right" });

    y += 24;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  FINANCIAL SUMMARY                                              */
  /* ═══════════════════════════════════════════════════════════════ */

  // Check page break
  if (y > pageH - 70) {
    doc.addPage();
    registerFont(doc, fontBase64);
    y = 20;
  }

  doc.setFont(F, "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.heading);
  doc.text("Resumo Financeiro", mL, y);

  y += 10;

  // Financial card background
  const finCardH = (proposal.combo_discount_percent ?? 0) > 0 ? 52 : 44;
  doc.setFillColor(...C.bgLight);
  roundedRect(doc, mL, y - 2, contentW, finCardH, 4, "F");

  // Row helper
  const drawFinRow = (label: string, value: string, rowY: number, bold = false, valueColor = C.body) => {
    doc.setFont(F, bold ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.body);
    doc.text(label, mL + 8, rowY);
    doc.setFont(F, bold ? "bold" : "normal");
    doc.setTextColor(...valueColor);
    doc.text(value, pageW - mR - 8, rowY, { align: "right" });
  };

  drawFinRow("Mensalidade", fmtCurr(proposal.total_monthly ?? 0), y + 6);
  drawFinRow("Implementa\u00e7\u00e3o (\u00fanico)", fmtCurr(proposal.total_impl ?? 0), y + 14);
  drawFinRow("Horas Estimadas", `${proposal.total_hours ?? totalHours}h/m\u00eas`, y + 22);

  let totalY = y + 30;

  if ((proposal.combo_discount_percent ?? 0) > 0) {
    drawFinRow("Desconto Combo", `-${proposal.combo_discount_percent}%`, y + 30, false, C.green);
    totalY = y + 38;
  }

  // Divider before grand total
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.3);
  doc.line(mL + 6, totalY - 2, pageW - mR - 6, totalY - 2);

  // Grand total
  doc.setFont(F, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...C.dark);
  doc.text("Total Geral", mL + 8, totalY + 5);

  doc.setFont(F, "bold");
  doc.setFontSize(14);
  doc.setTextColor(...C.accent);
  doc.text(fmtCurr(proposal.grand_total ?? 0), pageW - mR - 8, totalY + 5.5, { align: "right" });

  y = totalY + finCardH - 30;

  /* ═══════════════════════════════════════════════════════════════ */
  /*  NOTES                                                          */
  /* ═══════════════════════════════════════════════════════════════ */

  if (proposal.notes) {
    y += 14;

    if (y > pageH - 50) {
      doc.addPage();
      registerFont(doc, fontBase64);
      y = 20;
    }

    doc.setFont(F, "bold");
    doc.setFontSize(13);
    doc.setTextColor(...C.heading);
    doc.text("Observa\u00e7\u00f5es", mL, y);

    y += 8;

    doc.setFont(F, "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.body);

    const lines = doc.splitTextToSize(proposal.notes, contentW - 16);
    const noteBgH = Math.max(lines.length * 5 + 10, 16);

    doc.setFillColor(...C.bgLight);
    roundedRect(doc, mL, y - 2, contentW, noteBgH, 4, "F");

    doc.text(lines, mL + 8, y + 5);

    y += noteBgH + 4;
  }

  /* ═══════════════════════════════════════════════════════════════ */
  /*  FOOTER                                                         */
  /* ═══════════════════════════════════════════════════════════════ */

  // Bottom accent bar
  doc.setFillColor(...C.accent);
  doc.rect(0, pageH - 3, pageW, 3, "F");

  // Footer text
  doc.setFont(F, "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.label);
  doc.text(
    `Proposta gerada por Zenite Price  |  HTZ Ag\u00eancia  |  ${formatDateBR(new Date().toISOString())}`,
    pageW / 2,
    pageH - 7,
    { align: "center" }
  );

  // Confidential notice
  doc.setFont(F, "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.label);
  doc.text(
    "Este documento \u00e9 confidencial e destinado exclusivamente ao destinat\u00e1rio.",
    pageW / 2,
    pageH - 12,
    { align: "center" }
  );

  /* ═══════════════════════════════════════════════════════════════ */
  /*  SAVE                                                           */
  /* ═══════════════════════════════════════════════════════════════ */

  const fileName = `Proposta_${proposal.id}_${proposal.client_name.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
}
