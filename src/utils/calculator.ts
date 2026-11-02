/**
 * Motor de Cálculo de Custo e Orçamento Gráfico
 * Todas as medidas operam em Centímetros (cm)
 */

import { SheetType } from '../types';

export interface SheetFormatInfo {
  id: SheetType;
  name: string;
  badge: string;
  widthCm: number;
  heightCm: number;
  printableWidthCm: number;
  printableHeightCm: number;
  description: string;
}

export const SHEET_FORMATS: Record<'a4' | 'a3' | 'sra3', SheetFormatInfo> = {
  a4: {
    id: 'a4',
    name: 'A4',
    badge: '21 x 29,7 cm',
    widthCm: 21.0,
    heightCm: 29.7,
    printableWidthCm: 20.0,
    printableHeightCm: 28.7,
    description: 'Folha padrão A4 (área útil 20 x 28,7 cm)',
  },
  a3: {
    id: 'a3',
    name: 'A3',
    badge: '29,7 x 42 cm',
    widthCm: 29.7,
    heightCm: 42.0,
    printableWidthCm: 28.7,
    printableHeightCm: 41.0,
    description: 'Folha padrão A3 (área útil 28,7 x 41 cm)',
  },
  sra3: {
    id: 'sra3',
    name: 'SRA3',
    badge: '33 x 48 cm',
    widthCm: 33.0,
    heightCm: 48.0,
    printableWidthCm: 31.0,
    printableHeightCm: 46.0,
    description: 'Padrão Gráfica Digital (área útil 31 x 46 cm)',
  },
};

// Folha padrão para gráfica rápida digital: SRA3 (para compatibilidade legada)
export const SRA3_SHEET = SHEET_FORMATS.sra3;

export interface NestingOptions {
  sheetType?: SheetType;
  customWidthCm?: number;
  customHeightCm?: number;
  rollWidthCm?: number;
  bleedCm?: number;
  quantity?: number;
}

export interface NestingResult {
  sheetType: SheetType;
  orientation: 'direta' | 'girada';
  itemsPerSheet: number;
  cols: number;
  rows: number;
  wastePercent: number;
  sheetWidthCm: number;
  sheetHeightCm: number;
  printableWidthCm: number;
  printableHeightCm: number;
  isRoll: boolean;
  rollWidthCm?: number;
  linearMetersNeeded?: number;
  totalRollM2?: number;
  itemsPerRow?: number;
}

/**
 * Calcula o aproveitamento técnico em folhas cortadas (A4, A3, SRA3) ou bobina contínua.
 */
export function calculateSheetNesting(
  itemWidthCm: number,
  itemHeightCm: number,
  bleedOrOptions: number | NestingOptions = 0.2,
  explicitSheetType?: SheetType
): NestingResult {
  let bleedCm = 0.2;
  let options: NestingOptions = {};

  if (typeof bleedOrOptions === 'number') {
    bleedCm = bleedOrOptions;
    if (explicitSheetType) {
      options.sheetType = explicitSheetType;
    }
  } else if (bleedOrOptions && typeof bleedOrOptions === 'object') {
    options = bleedOrOptions;
    bleedCm = options.bleedCm ?? 0.2;
  }

  const sheetType: SheetType = options.sheetType || 'sra3';
  const safeW = Math.max(0.5, itemWidthCm);
  const safeH = Math.max(0.5, itemHeightCm);

  const fullW = safeW + bleedCm * 2;
  const fullH = safeH + bleedCm * 2;

  // CASO 1: BOBINA PERSONALIZADA (ROLO CONTÍNUO)
  if (sheetType === 'bobina') {
    const rollWidth = Math.max(10, options.rollWidthCm || 60);
    // Margens laterais de tração/pinças da impressora/plotter: 0.5 cm de cada lado (total 1 cm)
    const printableWidth = Math.max(5, rollWidth - 1.0);

    // Itens na horizontal direta vs girada 90º
    const colsDirect = Math.floor(printableWidth / fullW);
    const colsRotated = Math.floor(printableWidth / fullH);

    let orientation: 'direta' | 'girada' = 'direta';
    let cols = Math.max(1, colsDirect);
    let itemStepH = fullH;

    if (colsRotated > 0 && colsDirect <= 0) {
      orientation = 'girada';
      cols = colsRotated;
      itemStepH = fullW;
    } else if (colsDirect > 0 && colsRotated <= 0) {
      orientation = 'direta';
      cols = colsDirect;
      itemStepH = fullH;
    } else if (colsDirect > 0 && colsRotated > 0) {
      // Compara avanço linear por unidade produzida (menor avanço por item = mais econômico)
      const advancePerItemDirect = fullH / colsDirect;
      const advancePerItemRotated = fullW / colsRotated;
      if (advancePerItemRotated < advancePerItemDirect) {
        orientation = 'girada';
        cols = colsRotated;
        itemStepH = fullW;
      } else {
        orientation = 'direta';
        cols = colsDirect;
        itemStepH = fullH;
      }
    }

    const qty = Math.max(1, options.quantity || 100);
    const rows = Math.ceil(qty / cols);
    const printedLengthCm = rows * itemStepH;
    // Margem técnica de carregamento e refile da bobina: 20 cm
    const totalLinearLengthCm = Math.ceil(printedLengthCm + 20);
    const linearMetersNeeded = Number((totalLinearLengthCm / 100).toFixed(2));
    const totalRollM2 = Number(((rollWidth / 100) * (totalLinearLengthCm / 100)).toFixed(3));
    const usedAreaM2 = Number((qty * (safeW / 100) * (safeH / 100)).toFixed(3));
    const wastePercent = Math.max(
      0,
      Math.min(95, Math.round(((totalRollM2 - usedAreaM2) / Math.max(0.001, totalRollM2)) * 100))
    );

    // Altura virtual proporcional para o preview SVG da bobina
    const previewWebLengthCm = Math.min(120, Math.max(40, rows * itemStepH + 10));

    return {
      sheetType: 'bobina',
      orientation,
      itemsPerSheet: cols,
      itemsPerRow: cols,
      cols,
      rows,
      wastePercent,
      sheetWidthCm: rollWidth,
      sheetHeightCm: previewWebLengthCm,
      printableWidthCm: printableWidth,
      printableHeightCm: previewWebLengthCm - 2,
      isRoll: true,
      rollWidthCm: rollWidth,
      linearMetersNeeded,
      totalRollM2,
    };
  }

  // CASO 2: FOLHAS CORTADAS (A4, A3, SRA3)
  const format = SHEET_FORMATS[sheetType as 'a4' | 'a3' | 'sra3'] || SHEET_FORMATS.sra3;
  const sheetW = format.widthCm;
  const sheetH = format.heightCm;
  const printW = format.printableWidthCm;
  const printH = format.printableHeightCm;

  // Orientação direta
  const colsDirect = Math.floor(printW / fullW);
  const rowsDirect = Math.floor(printH / fullH);
  const totalDirect = Math.max(1, colsDirect * rowsDirect);

  // Orientação girada 90º
  const colsRotated = Math.floor(printW / fullH);
  const rowsRotated = Math.floor(printH / fullW);
  const totalRotated = Math.max(1, colsRotated * rowsRotated);

  const totalArea = sheetW * sheetH;

  if (totalRotated > totalDirect) {
    const usedArea = totalRotated * (safeW * safeH);
    const waste = Math.max(0, Math.min(95, ((totalArea - usedArea) / totalArea) * 100));
    return {
      sheetType,
      orientation: 'girada',
      itemsPerSheet: totalRotated,
      cols: colsRotated,
      rows: rowsRotated,
      wastePercent: Math.round(waste),
      sheetWidthCm: sheetW,
      sheetHeightCm: sheetH,
      printableWidthCm: printW,
      printableHeightCm: printH,
      isRoll: false,
    };
  }

  const usedArea = totalDirect * (safeW * safeH);
  const waste = Math.max(0, Math.min(95, ((totalArea - usedArea) / totalArea) * 100));
  return {
    sheetType,
    orientation: 'direta',
    itemsPerSheet: totalDirect,
    cols: colsDirect,
    rows: rowsDirect,
    wastePercent: Math.round(waste),
    sheetWidthCm: sheetW,
    sheetHeightCm: sheetH,
    printableWidthCm: printW,
    printableHeightCm: printH,
    isRoll: false,
  };
}

export interface PriceTier {
  markup: number;
  basePrice: number;
  inkCost: number;
  price: number;
  unitPrice: number;
  profit: number;
}

export interface CostCalculationResult {
  sheetType: SheetType;
  nestingOrientation?: 'direta' | 'girada';
  itemsPerSheet: number;
  sheetsNeeded: number;
  wasteSheets: number;
  totalSheetsToConsume: number;
  materialCost: number;
  clickCost: number;
  machineLaborCost: number;
  inkCost: number; // Custo com tinta calculado em 3% do valor do pedido
  totalCost: number;
  unitCost: number;
  isRoll?: boolean;
  rollWidthCm?: number;
  linearMetersNeeded?: number;
  totalRollM2?: number;
  suggestedPrices: {
    min: PriceTier;
    recommended: PriceTier;
    premium: PriceTier;
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
  sheetType?: SheetType;
  rollWidthCm?: number;
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
    sheetType = 'sra3',
    rollWidthCm = 60,
  } = params;

  let itemsPerSheet = 1;
  let sheetsNeeded = 0;
  let wasteSheets = 0;
  let totalSheetsToConsume = 0;
  let materialCost = 0;
  let clickCost = 0;
  let nestingOrientation: 'direta' | 'girada' | undefined = undefined;
  let isRoll = false;
  let linearMetersNeeded: number | undefined = undefined;
  let totalRollM2: number | undefined = undefined;

  // CASO A: BOBINA PERSONALIZADA
  if (sheetType === 'bobina') {
    isRoll = true;
    const nesting = calculateSheetNesting(widthCm, heightCm, {
      sheetType: 'bobina',
      rollWidthCm,
      quantity,
    });
    nestingOrientation = nesting.orientation;
    itemsPerSheet = nesting.itemsPerSheet;
    linearMetersNeeded = nesting.linearMetersNeeded || 1;
    totalRollM2 = nesting.totalRollM2 || 1;

    sheetsNeeded = nesting.rows;
    wasteSheets = Number((linearMetersNeeded * 0.05).toFixed(2));
    totalSheetsToConsume = linearMetersNeeded;

    // Custo do substrato (se for cadastrado em m², calcula por m² consumido; se for por folha, usa base linear)
    materialCost = totalRollM2 * costPerSheetOrM2;

    const isColor = printSides === '4x0' || printSides === '4x4';
    const clickUnitPrice = isColor ? (clickCostColor > 0 ? clickCostColor : 12.0) : clickCostPB;
    // Em bobina/plotter, o clique/tinta é proporcional à área impressa em m²
    clickCost = totalRollM2 * clickUnitPrice;

    const speedM2 = Math.max(4, machineSpeedPerHour || 15);
    const hours = totalRollM2 / speedM2;
    const machineLaborCost = Math.max(3.0, hours * (machineHourlyRate || 35.0));

    const totalCost = Number((materialCost + clickCost + machineLaborCost).toFixed(2));
    const unitCost = quantity > 0 ? Number((totalCost / quantity).toFixed(3)) : 0;

    const buildTier = (markup: number): PriceTier => {
      const raw = totalCost * (1 + markup / 100);
      const basePrice = Math.max(15, Math.ceil(raw));
      // Custo com tinta é 3% do valor total do pedido (ex: R$ 100 -> + R$ 3 = R$ 103)
      const inkCost = Number((basePrice * 0.03).toFixed(2));
      const price = Number((basePrice + inkCost).toFixed(2));
      const unitPrice = quantity > 0 ? Number((price / quantity).toFixed(3)) : 0;
      const profit = Number((price - totalCost).toFixed(2));
      return { markup, basePrice, inkCost, price, unitPrice, profit };
    };

    const recMarkup = Math.max(40, markupPercent);
    const minMarkup = Math.max(25, Math.round(recMarkup * 0.7));
    const premMarkup = Math.round(recMarkup * 1.4);

    const minTier = buildTier(minMarkup);
    const recTier = buildTier(recMarkup);
    const premTier = buildTier(premMarkup);

    return {
      sheetType: 'bobina',
      nestingOrientation,
      itemsPerSheet,
      sheetsNeeded,
      wasteSheets,
      totalSheetsToConsume,
      materialCost: Number(materialCost.toFixed(2)),
      clickCost: Number(clickCost.toFixed(2)),
      machineLaborCost: Number(machineLaborCost.toFixed(2)),
      inkCost: recTier.inkCost,
      totalCost,
      unitCost,
      isRoll: true,
      rollWidthCm,
      linearMetersNeeded,
      totalRollM2,
      suggestedPrices: {
        min: minTier,
        recommended: recTier,
        premium: premTier,
      },
    };
  }

  // CASO B: PLOTTER POR M² TRADICIONAL
  if (isPlotterM2 && sheetType !== 'a4' && sheetType !== 'a3' && sheetType !== 'sra3') {
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
    // CASO C: FOLHAS CORTADAS (A4, A3, SRA3)
    const nesting = calculateSheetNesting(widthCm, heightCm, {
      sheetType: sheetType as 'a4' | 'a3' | 'sra3',
      quantity,
    });
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

  const buildTier = (markup: number): PriceTier => {
    const raw = totalCost * (1 + markup / 100);
    const basePrice = Math.max(15, Math.ceil(raw));
    // Custo com tinta é 3% do valor total do pedido (ex: R$ 100 -> + R$ 3 = R$ 103)
    const inkCost = Number((basePrice * 0.03).toFixed(2));
    const price = Number((basePrice + inkCost).toFixed(2));
    const unitPrice = quantity > 0 ? Number((price / quantity).toFixed(3)) : 0;
    const profit = Number((price - totalCost).toFixed(2));
    return { markup, basePrice, inkCost, price, unitPrice, profit };
  };

  const recMarkup = Math.max(40, markupPercent);
  const minMarkup = Math.max(25, Math.round(recMarkup * 0.7));
  const premMarkup = Math.round(recMarkup * 1.4);

  const minTier = buildTier(minMarkup);
  const recTier = buildTier(recMarkup);
  const premTier = buildTier(premMarkup);

  return {
    sheetType,
    nestingOrientation: isPlotterM2 ? undefined : nestingOrientation,
    itemsPerSheet,
    sheetsNeeded,
    wasteSheets,
    totalSheetsToConsume,
    materialCost: Number(materialCost.toFixed(2)),
    clickCost: Number(clickCost.toFixed(2)),
    machineLaborCost: Number(machineLaborCost.toFixed(2)),
    inkCost: recTier.inkCost,
    totalCost,
    unitCost,
    isRoll: false,
    suggestedPrices: {
      min: minTier,
      recommended: recTier,
      premium: premTier,
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
  basePrice?: number;
  inkCost?: number;
  hasDelivery?: boolean;
  deliveryFee?: number;
  deliveryAddress?: string;
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
    basePrice,
    inkCost,
    hasDelivery,
    deliveryFee = 7,
    deliveryAddress,
    notes,
  } = params;

  const resolvedInkCost =
    inkCost !== undefined
      ? inkCost
      : basePrice !== undefined
        ? Number((basePrice * 0.03).toFixed(2))
        : 0;

  return (
    `*Orçamento Gráfico - PrintFlow*\n\n` +
    `Olá, *${clientName || 'Cliente'}*! Segue a cotação solicitada:\n\n` +
    `📌 *Item:* ${productName}\n` +
    `🔢 *Quantidade:* ${quantity.toLocaleString('pt-BR')} unidades\n` +
    `📏 *Tamanho / Formato:* ${widthCm} x ${heightCm} cm (${printSides})\n` +
    `📄 *Papel / Material:* ${materialName}\n` +
    (resolvedInkCost > 0
      ? `💧 *Custo com Tinta (3%):* ${formatBRL(resolvedInkCost)}\n`
      : '') +
    (hasDelivery
      ? `🚚 *Entrega:* Sim (+ ${formatBRL(deliveryFee)})${deliveryAddress ? `\n📍 *Endereço:* ${deliveryAddress}` : ''}\n`
      : `🏪 *Retirada:* No balcão da gráfica\n`) +
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
