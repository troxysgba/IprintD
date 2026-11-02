/**
 * Motor de Cálculo de Custo e Orçamento Gráfico
 * Todas as medidas operam em Centímetros (cm)
 */

export interface NestingResult {
  orientation: 'direta' | 'girada';
  itemsPerSheet: number;
  cols: number;
  rows: number;
  wastePercent: number;
}

// Folha padrão para gráfica rápida digital: SRA3 (33 x 48 cm, área imprimível útil 31 x 46 cm)
export const SRA3_SHEET = {
  widthCm: 33,
  heightCm: 48,
  printableWidthCm: 31,
  printableHeightCm: 46,
};

/**
 * Calcula quantos itens cabem em uma folha SRA3 com 0,2 cm (2mm) de sangria
 * @param itemWidthCm Largura do item em centímetros (cm)
 * @param itemHeightCm Altura do item em centímetros (cm)
 * @param bleedCm Sangria técnica em centímetros (padrão 0.2 cm)
 */
export function calculateSheetNesting(
  itemWidthCm: number,
  itemHeightCm: number,
  bleedCm: number = 0.2
): NestingResult {
  const safeW = Math.max(1, itemWidthCm);
  const safeH = Math.max(1, itemHeightCm);

  const fullW = safeW + bleedCm * 2;
  const fullH = safeH + bleedCm * 2;

  // Orientação direta
  const colsDirect = Math.floor(SRA3_SHEET.printableWidthCm / fullW);
  const rowsDirect = Math.floor(SRA3_SHEET.printableHeightCm / fullH);
  const totalDirect = Math.max(1, colsDirect * rowsDirect);

  // Orientação girada 90º
  const colsRotated = Math.floor(SRA3_SHEET.printableWidthCm / fullH);
  const rowsRotated = Math.floor(SRA3_SHEET.printableHeightCm / fullW);
  const totalRotated = Math.max(1, colsRotated * rowsRotated);

  const totalArea = SRA3_SHEET.widthCm * SRA3_SHEET.heightCm;

  if (totalRotated > totalDirect) {
    const usedArea = totalRotated * (safeW * safeH);
    const waste = Math.max(0, Math.min(95, ((totalArea - usedArea) / totalArea) * 100));
    return {
      orientation: 'girada',
      itemsPerSheet: totalRotated,
      cols: colsRotated,
      rows: rowsRotated,
      wastePercent: Math.round(waste),
    };
  }

  const usedArea = totalDirect * (safeW * safeH);
  const waste = Math.max(0, Math.min(95, ((totalArea - usedArea) / totalArea) * 100));
  return {
    orientation: 'direta',
    itemsPerSheet: totalDirect,
    cols: colsDirect,
    rows: rowsDirect,
    wastePercent: Math.round(waste),
  };
}

export interface CostCalculationResult {
  nestingOrientation?: 'direta' | 'girada';
  itemsPerSheet: number;
  sheetsNeeded: number;
  wasteSheets: number;
  totalSheetsToConsume: number;
  materialCost: number;
  clickCost: number;
  machineLaborCost: number;
  totalCost: number;
  unitCost: number;
  suggestedPrices: {
    min: { markup: number; price: number; unitPrice: number; profit: number };
    recommended: { markup: number; price: number; unitPrice: number; profit: number };
    premium: { markup: number; price: number; unitPrice: number; profit: number };
  };
}

export function calculateOrderCost(params: {
  quantity: number;
  widthCm: number;
  heightCm: number;
  printSides: '4x0' | '4x4' | '1x0' | '1x1';
  costPerSheetOrM2: number;
  isPlotterM2?: boolean;
  clickCostColor: number;
  clickCostPB: number;
  machineHourlyRate: number;
  machineSpeedPerHour: number;
  markupPercent?: number;
}): CostCalculationResult {
  const {
    quantity,
    widthCm,
    heightCm,
    printSides,
    costPerSheetOrM2,
    isPlotterM2,
    clickCostColor,
    clickCostPB,
    machineHourlyRate,
    machineSpeedPerHour,
    markupPercent = 120,
  } = params;

  let itemsPerSheet = 1;
  let sheetsNeeded = 0;
  let wasteSheets = 0;
  let totalSheetsToConsume = 0;
  let materialCost = 0;
  let clickCost = 0;
  let nestingOrientation: 'direta' | 'girada' | undefined = undefined;

  if (isPlotterM2) {
    // Cálculo em metros quadrados a partir de centímetros: (L cm / 100) * (A cm / 100)
    const unitAreaM2 = (widthCm / 100) * (heightCm / 100);
    const totalAreaM2 = unitAreaM2 * quantity;
    const billedAreaM2 = Math.max(0.25, totalAreaM2 * 1.05); // 5% de margem técnica
    itemsPerSheet = 1;
    sheetsNeeded = Number(totalAreaM2.toFixed(2));
    wasteSheets = Number((billedAreaM2 - totalAreaM2).toFixed(2));
    totalSheetsToConsume = Number(billedAreaM2.toFixed(2));
    materialCost = totalSheetsToConsume * costPerSheetOrM2;
    clickCost = billedAreaM2 * (clickCostColor > 0 ? clickCostColor : 14.0);
  } else {
    const nesting = calculateSheetNesting(widthCm, heightCm);
    nestingOrientation = nesting.orientation;
    itemsPerSheet = nesting.itemsPerSheet;
    sheetsNeeded = Math.ceil(quantity / itemsPerSheet);
    wasteSheets = Math.max(2, Math.ceil(sheetsNeeded * 0.05)); // 5% de quebra (mínimo 2 folhas de acerto)
    totalSheetsToConsume = sheetsNeeded + wasteSheets;

    materialCost = totalSheetsToConsume * costPerSheetOrM2;
    const isColor = printSides === '4x0' || printSides === '4x4';
    const clickUnitPrice = isColor ? clickCostColor : clickCostPB;
    const clicksPerSheet = printSides === '4x4' || printSides === '1x1' ? 2 : 1;
    clickCost = totalSheetsToConsume * clicksPerSheet * clickUnitPrice;
  }

  const speed = Math.max(20, machineSpeedPerHour || 1500);
  const hours = totalSheetsToConsume / speed;
  const machineLaborCost = Math.max(2.5, hours * (machineHourlyRate || 35.0));

  const totalCost = Number((materialCost + clickCost + machineLaborCost).toFixed(2));
  const unitCost = quantity > 0 ? Number((totalCost / quantity).toFixed(3)) : 0;

  const buildTier = (markup: number) => {
    const raw = totalCost * (1 + markup / 100);
    const price = Math.max(15, Math.ceil(raw));
    const unitPrice = quantity > 0 ? Number((price / quantity).toFixed(3)) : 0;
    const profit = Number((price - totalCost).toFixed(2));
    return { markup, price, unitPrice, profit };
  };

  const recMarkup = Math.max(40, markupPercent);
  const minMarkup = Math.max(25, Math.round(recMarkup * 0.7));
  const premMarkup = Math.round(recMarkup * 1.4);

  return {
    nestingOrientation: isPlotterM2 ? undefined : nestingOrientation,
    itemsPerSheet,
    sheetsNeeded,
    wasteSheets,
    totalSheetsToConsume,
    materialCost: Number(materialCost.toFixed(2)),
    clickCost: Number(clickCost.toFixed(2)),
    machineLaborCost: Number(machineLaborCost.toFixed(2)),
    totalCost,
    unitCost,
    suggestedPrices: {
      min: buildTier(minMarkup),
      recommended: buildTier(recMarkup),
      premium: buildTier(premMarkup),
    },
  };
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Gera mensagem formatada pronta para enviar no WhatsApp com medidas em Centímetros (cm)
 */
export function generateWhatsAppMessage(params: {
  clientName: string;
  productName: string;
  quantity: number;
  widthCm: number;
  heightCm: number;
  printSides: string;
  materialName: string;
  totalPrice: number;
  unitPrice: number;
  notes?: string;
}): string {
  const {
    clientName,
    productName,
    quantity,
    widthCm,
    heightCm,
    printSides,
    materialName,
    totalPrice,
    unitPrice,
    notes,
  } = params;

  return (
    `*Orçamento Gráfico - PrintFlow*\n\n` +
    `Olá, *${clientName || 'Cliente'}*! Segue a cotação solicitada:\n\n` +
    `📌 *Item:* ${productName}\n` +
    `🔢 *Quantidade:* ${quantity.toLocaleString('pt-BR')} unidades\n` +
    `📏 *Tamanho / Formato:* ${widthCm} x ${heightCm} cm (${printSides})\n` +
    `📄 *Papel / Material:* ${materialName}\n` +
    (notes ? `📝 *Observações:* ${notes}\n` : '') +
    `\n` +
    `💰 *Valor Total:* ${formatBRL(totalPrice)}\n` +
    `🏷️ *Valor Unitário:* ${formatBRL(unitPrice)}/un\n\n` +
    `⏱️ *Prazo de Produção:* 2 a 3 dias úteis após aprovação da arte.\n` +
    `✅ *Validade da proposta:* 7 dias.\n\n` +
    `Para aprovar ou tirar dúvidas, basta responder a esta mensagem!`
  );
}

export function generateWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(text);
  if (cleanPhone) {
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    return `https://wa.me/${fullPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
