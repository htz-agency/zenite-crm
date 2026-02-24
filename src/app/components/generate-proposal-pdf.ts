import jsPDF from "jspdf";
import type { DbProposal } from "./api";
import { formatCurrency, services as allServicesCatalog, calculateServicePrice } from "./pricing-data";
import { dbToSelected } from "./api";

const C = {
  dark: [18, 34, 50] as [number, number, number],
  heading: [40, 65, 92] as [number, number, number],
  accent: [4, 131, 171] as [number, number, number],
  green: [60, 206, 167] as [number, number, number],
  greenDark: [19, 85, 67] as [number, number, number],
  body: [78, 105, 135] as [number, number, number],
  label: [152, 152, 157] as [number, number, number],
  divider: [221, 227, 236] as [number, number, number],
  bgLight: [246, 247, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  accentBg: [220, 240, 255] as [number, number, number],
  greenBg: [217, 248, 239] as [number, number, number],
};
const F = "Helvetica";

function formatDateBR(iso: string): string {
  try { const d = new Date(iso); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; } catch { return iso; }
}

export async function generateProposalPDF(proposal: DbProposal): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210; const pageH = 297; const mL = 20; const mR = 20; const contentW = pageW - mL - mR;
  let y = 0;

  const dbServices = proposal.price_proposal_services ?? [];
  const serviceDetails = dbServices.map((dbSvc) => {
    const catalogSvc = allServicesCatalog.find((s) => s.id === dbSvc.service_id);
    if (catalogSvc) { const selected = dbToSelected(dbSvc); const calc = calculateServicePrice(catalogSvc, selected); return { name: catalogSvc.name, monthly: calc.monthly, impl: calc.impl, hours: calc.hours }; }
    return { name: dbSvc.service_id, monthly: dbSvc.computed_monthly ?? 0, impl: dbSvc.computed_impl ?? 0, hours: dbSvc.computed_hours ?? 0 };
  });
  const totalHours = serviceDetails.reduce((s, sv) => s + sv.hours, 0);

  // Header
  doc.setFillColor(...C.accent); doc.rect(0, 0, pageW, 3, "F"); y = 18;
  doc.setFont(F, "bold"); doc.setFontSize(28); doc.setTextColor(...C.heading); doc.text("HTZ", mL, y);
  doc.setFont(F, "normal"); doc.setFontSize(10); doc.setTextColor(...C.label); doc.text("PROPOSTA COMERCIAL", pageW - mR, y - 4, { align: "right" });
  doc.setFont(F, "bold"); doc.setFontSize(12); doc.setTextColor(...C.accent); doc.text(proposal.id, pageW - mR, y + 2, { align: "right" });
  y += 8; doc.setDrawColor(...C.divider); doc.setLineWidth(0.4); doc.line(mL, y, pageW - mR, y);

  // Client info
  y += 8; doc.setFillColor(...C.bgLight); doc.roundedRect(mL, y, contentW, 28, 4, 4, "F");
  const infoY = y + 7;
  doc.setFont(F, "normal"); doc.setFontSize(8); doc.setTextColor(...C.label); doc.text("CLIENTE", mL + 8, infoY);
  doc.setFont(F, "bold"); doc.setFontSize(11); doc.setTextColor(...C.heading); doc.text(proposal.client_name, mL + 8, infoY + 6);
  doc.setFont(F, "normal"); doc.setFontSize(8); doc.setTextColor(...C.label); doc.text("DATA", mL + 70, infoY);
  doc.setFont(F, "bold"); doc.setFontSize(11); doc.setTextColor(...C.body); doc.text(formatDateBR(proposal.created_at), mL + 70, infoY + 6);
  y += 36;

  // Services
  doc.setFont(F, "bold"); doc.setFontSize(13); doc.setTextColor(...C.heading); doc.text("Servi\u00e7os Inclusos", mL, y); y += 8;
  const colX = { num: mL, name: mL + 8, monthly: mL + 100, impl: mL + 130, hours: mL + 160 };
  doc.setFillColor(...C.accentBg); doc.roundedRect(mL, y - 4, contentW, 9, 3, 3, "F");
  doc.setFont(F, "bold"); doc.setFontSize(8); doc.setTextColor(...C.accent);
  doc.text("#", colX.num + 2, y + 1); doc.text("SERVI\u00c7O", colX.name, y + 1); doc.text("MENSAL", colX.monthly + 24, y + 1, { align: "right" }); doc.text("IMPL.", colX.impl + 24, y + 1, { align: "right" }); doc.text("HORAS", colX.hours + 10, y + 1, { align: "right" }); y += 9;

  serviceDetails.forEach((svc, idx) => {
    if (y > pageH - 50) { doc.addPage(); y = 20; }
    if (idx % 2 === 0) { doc.setFillColor(252, 253, 254); doc.roundedRect(mL, y - 3.5, contentW, 8, 2, 2, "F"); }
    doc.setFont(F, "normal"); doc.setFontSize(9); doc.setTextColor(...C.label); doc.text(String(idx + 1).padStart(2, "0"), colX.num + 2, y + 1);
    doc.setTextColor(...C.dark); let displayName = svc.name; while (doc.getTextWidth(displayName) > 85 && displayName.length > 3) displayName = displayName.slice(0, -4) + "..."; doc.text(displayName, colX.name, y + 1);
    doc.setTextColor(...C.heading); doc.text(svc.monthly > 0 ? formatCurrency(svc.monthly) : "\u2014", colX.monthly + 24, y + 1, { align: "right" });
    doc.setTextColor(...C.body); doc.text(svc.impl > 0 ? formatCurrency(svc.impl) : "\u2014", colX.impl + 24, y + 1, { align: "right" });
    doc.text(svc.hours > 0 ? `${svc.hours}h` : "\u2014", colX.hours + 10, y + 1, { align: "right" }); y += 8;
  });

  // Totals
  doc.setDrawColor(...C.divider); doc.setLineWidth(0.3); doc.line(mL, y, pageW - mR, y); y += 6;
  doc.setFillColor(...C.bgLight); doc.roundedRect(mL, y - 4, contentW, 10, 3, 3, "F");
  doc.setFont(F, "bold"); doc.setFontSize(9); doc.setTextColor(...C.heading);
  doc.text("TOTAL", colX.name, y + 1); doc.text(formatCurrency(proposal.total_monthly ?? 0), colX.monthly + 24, y + 1, { align: "right" }); doc.text(formatCurrency(proposal.total_impl ?? 0), colX.impl + 24, y + 1, { align: "right" });
  doc.setTextColor(...C.body); doc.text(`${proposal.total_hours ?? totalHours}h`, colX.hours + 10, y + 1, { align: "right" }); y += 16;

  // Grand total
  doc.setFont(F, "bold"); doc.setFontSize(13); doc.setTextColor(...C.heading); doc.text("Total Geral", mL, y);
  doc.setFont(F, "bold"); doc.setFontSize(14); doc.setTextColor(...C.accent); doc.text(formatCurrency(proposal.grand_total ?? 0), pageW - mR, y, { align: "right" }); y += 16;

  // Footer
  doc.setFillColor(...C.accent); doc.rect(0, pageH - 3, pageW, 3, "F");
  doc.setFont(F, "normal"); doc.setFontSize(7); doc.setTextColor(...C.label);
  doc.text(`Proposta gerada por Zenite Price  |  HTZ Ag\u00eancia  |  ${formatDateBR(new Date().toISOString())}`, pageW / 2, pageH - 7, { align: "center" });

  const fileName = `Proposta_${proposal.id}_${proposal.client_name.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
}
