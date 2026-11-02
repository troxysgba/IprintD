/**
 * Motor de Cálculo Gráfico e Aproveitamento de Folha
 */

export interface SheetDimensions {
  name: string;
  widthMm: number;
  heightMm: number;
  printableWidthMm: number;
  printableHeightMm: number;
}

export const STANDARD_SHEETS: Record<string, SheetDimensions> = {
  SRA3: {
    name: 'SRA3 (330x480 mm)',
    widthMm: 330,
    heightMm: 480,
    printableWidthMm: 310, // Margens de pinça e corte
    printableHeightMm: 460,
  },
  A3: {
    name: 'A3 (297x420 mm)',
    widthMm: 297,
    heightMm: 420,
    printableWidthMm: 285,
    printableHeightMm: 408,
  },
  A4: {
    name: 'A4 (210x297 mm)',
    widthMm: 210,
    heightMm: 297,
    printableWidthMm: 200,
    printableHeightMm: 287,
  },
};

export interface NestingResult {
  orientation: 'direta' | 'girada' | 'mista';
  itemsPerSheet: number;
  cols: number;
  rows: number;
  wastePercent: number;
  layoutVisual: {
    sheetW: number;
    sheetH: number;
    itemW: number;
    itemH: number;
    cols: number;
    rows: number;
  };
}

/**
 * Calcula quantos itens cabem na folha (imposição/aproveitamento)
 * com sangria e margem de corte técnica.
 */
export function calculateSheetNesting(
  itemWidthMm: number,
  itemHeightMm: number,
  sheetFormat: 'SRA3' | 'A3' | 'A4' = 'SRA3',
  bleedMm: number = 2 // Sangria padrão de 2mm por lado
): NestingResult {
  const sheet = STANDARD_SHEETS[sheetFormat] || STANDARD_SHEETS['SRA3'];
  const fullItemW = Math.max(10, itemWidthMm + bleedMm * 2);
  const fullItemH = Math.max(10, itemHeightMm + bleedMm * 2);

  // Opção 1: Orientação direta
  const colsDirect = Math.floor(sheet.printableWidthMm / fullItemW);
  const rowsDirect = Math.floor(sheet.printableHeightMm / fullItemH);
  const totalDirect = Math.max(1, colsDirect * rowsDirect);

  // Opção 2: Orientação girada 90 graus
  const colsRotated = Math.floor(sheet.printableWidthMm / fullItemH);
  const rowsRotated = Math.floor(sheet.printableHeightMm / fullItemW);
  const totalRotated = Math.max(1, colsRotated * rowsRotated);

  if (totalRotated > totalDirect) {
    const usedArea = totalRotated * (itemWidthMm * itemHeightMm);
    const totalArea = sheet.widthMm * sheet.heightMm;
    const waste = Math.max(0, Math.min(95, ((totalArea - usedArea) / totalArea) * 100));

    return {
      orientation: 'girada',
      itemsPerSheet: totalRotated,
      cols: colsRotated,
      rows: rowsRotated,
      wastePercent: Math.round(waste),
      layoutVisual: {
        sheetW: sheet.widthMm,
        sheetH: sheet.heightMm,
        itemW: itemHeightMm,
        itemH: itemWidthMm,
        cols: colsRotated,
        rows: rowsRotated,
      },
    };
  } else {
    const usedArea = totalDirect * (itemWidthMm * itemHeightMm);
    const totalArea = sheet.widthMm * sheet.heightMm;
    const waste = Math.max(0, Math.min(95, ((totalArea - usedArea) / totalArea) * 100));

    return {
      orientation: 'direta',
      itemsPerSheet: totalDirect,
      cols: colsDirect,
      rows: rowsDirect,
      wastePercent: Math.round(waste),
      layoutVisual: {
        sheetW: sheet.widthMm,
        sheetH: sheet.heightMm,
        itemW: itemWidthMm,
        itemH: itemHeightMm,
        cols: colsDirect,
        rows: rowsDirect,
      },
    };
  }
}

export interface ProductionCostCalculation {
  itemsPerSheet: number;
  sheetsNeeded: number;
  wasteSheets: number;
  totalSheetsToConsume: number;
  materialCost: number;
  printClickCost: number;
  finishingsCost: number;
  laborAndDepreciationCost: number;
  totalProductionCost: number;
  unitProductionCost: number;
  // Preços sugeridos para diferentes faixas
  suggestedPrices: {
    minMargin: { markup: number; price: number; unitPrice: number; profit: number };
    recommended: { markup: number; price: number; unitPrice: number; profit: number };
    premium: { markup: number; price: number; unitPrice: number; profit: number };
  };
}

/**
 * Calcula o custo total e o preço sugerido de venda
 */
export function calculateProductionCost(params: {
  quantity: number;
  itemWidthMm: number;
  itemHeightMm: number;
  printSides: '4x0' | '4x4' | '1x0' | '1x1';
  sheetFormat: 'SRA3' | 'A3' | 'A4' | 'Bobina_m2';
  costPerSheetOrM2: number;
  clickCostColor: number;
  clickCostPB: number;
  equipmentHourlyRate: number;
  speedPerHour: number;
  wastePercent: number; // ex: 5% de quebra
  targetMarkupPercent: number; // ex: 120%
  finishingsTotalCost: number;
}): ProductionCostCalculation {
  const {
    quantity,
    itemWidthMm,
    itemHeightMm,
    printSides,
    sheetFormat,
    costPerSheetOrM2,
    clickCostColor,
    clickCostPB,
    equipmentHourlyRate,
    speedPerHour,
    wastePercent,
    targetMarkupPercent,
    finishingsTotalCost,
  } = params;

  let itemsPerSheet = 1;
  let sheetsNeeded = 0;
  let wasteSheets = 0;
  let totalSheetsToConsume = 0;
  let materialCost = 0;
  let printClickCost = 0;

  if (sheetFormat === 'Bobina_m2') {
    // Cálculo por metro quadrado (Plotter de Comunicação Visual)
    const areaUnitM2 = (itemWidthMm / 1000) * (itemHeightMm / 1000);
    const totalAreaM2 = areaUnitM2 * quantity;
    const wasteFactor = 1 + (wastePercent || 5) / 100;
    const billedAreaM2 = Math.max(0.25, totalAreaM2 * wasteFactor);

    itemsPerSheet = 1;
    sheetsNeeded = Math.ceil(totalAreaM2 * 100) / 100;
    wasteSheets = Math.ceil((billedAreaM2 - totalAreaM2) * 100) / 100;
    totalSheetsToConsume = Math.ceil(billedAreaM2 * 100) / 100;

    materialCost = totalSheetsToConsume * costPerSheetOrM2;
    // Custo de tinta em plotter (ex: R$ 12 a R$ 25 por m²)
    const inkCostPerM2 = clickCostColor > 0 ? clickCostColor : 12.0;
    printClickCost = billedAreaM2 * inkCostPerM2;
  } else {
    // Cálculo de folhas padrão SRA3/A3/A4
    const nesting = calculateSheetNesting(itemWidthMm, itemHeightMm, sheetFormat);
    itemsPerSheet = nesting.itemsPerSheet;

    sheetsNeeded = Math.ceil(quantity / itemsPerSheet);
    const wasteRatio = Math.max(0.03, (wastePercent || 5) / 100);
    wasteSheets = Math.max(2, Math.ceil(sheetsNeeded * wasteRatio)); // Pelo menos 2 folhas de acerto
    totalSheetsToConsume = sheetsNeeded + wasteSheets;

    materialCost = totalSheetsToConsume * costPerSheetOrM2;

    // Cliques de impressão: 4x0 (1 clique color), 4x4 (2 cliques color), 1x0 (1 clique PB), 1x1 (2 cliques PB)
    const isColor = printSides === '4x0' || printSides === '4x4';
    const clickCost = isColor ? clickCostColor : clickCostPB;
    const clicksPerSheet = printSides === '4x4' || printSides === '1x1' ? 2 : 1;
    const totalClicks = totalSheetsToConsume * clicksPerSheet;

    printClickCost = totalClicks * clickCost;
  }

  // Depreciação de máquina e tempo de operador
  const effectiveSpeed = Math.max(10, speedPerHour || 120);
  const hoursNeeded = totalSheetsToConsume / effectiveSpeed;
  const laborAndDepreciationCost = Math.max(2.5, hoursNeeded * (equipmentHourlyRate || 35.0));

  const totalProductionCost =
    materialCost + printClickCost + finishingsTotalCost + laborAndDepreciationCost;
  const unitProductionCost = quantity > 0 ? totalProductionCost / quantity : 0;

  // Multiplicadores de Markup para sugestão de preço de venda
  const calcPrice = (markup: number) => {
    const rawTotal = totalProductionCost * (1 + markup / 100);
    const finalTotal = Math.max(15, Math.ceil(rawTotal)); // Mínimo de R$ 15 para ordens de serviço
    const unitPrice = quantity > 0 ? Number((finalTotal / quantity).toFixed(3)) : 0;
    const profit = finalTotal - totalProductionCost;
    return { markup, price: finalTotal, unitPrice, profit };
  };

  const recMarkup = Math.max(40, targetMarkupPercent || 120);
  const minMarkup = Math.max(25, recMarkup * 0.7);
  const premMarkup = recMarkup * 1.4;

  return {
    itemsPerSheet,
    sheetsNeeded,
    wasteSheets,
    totalSheetsToConsume,
    materialCost: Number(materialCost.toFixed(2)),
    printClickCost: Number(printClickCost.toFixed(2)),
    finishingsCost: Number(finishingsTotalCost.toFixed(2)),
    laborAndDepreciationCost: Number(laborAndDepreciationCost.toFixed(2)),
    totalProductionCost: Number(totalProductionCost.toFixed(2)),
    unitProductionCost: Number(unitProductionCost.toFixed(3)),
    suggestedPrices: {
      minMargin: calcPrice(Math.round(minMarkup)),
      recommended: calcPrice(Math.round(recMarkup)),
      premium: calcPrice(Math.round(premMarkup)),
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

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}
