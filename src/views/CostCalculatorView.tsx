import React, { useState, useMemo } from 'react';
import { Equipment, Material } from '../types';
import {
  calculateOrderCost,
  calculateSheetNesting,
  formatBRL,
  SRA3_SHEET,
} from '../utils/calculator';
import {
  Calculator,
  Grid,
  Layers,
  Percent,
  PlusCircle,
  Printer,
  Scissors,
  Sparkles,
} from 'lucide-react';

interface CostCalculatorViewProps {
  materials: Material[];
  equipments: Equipment[];
  onOpenGerarPedido: () => void;
}

export const CostCalculatorView: React.FC<CostCalculatorViewProps> = ({
  materials,
  equipments,
  onOpenGerarPedido,
}) => {
  const [quantity, setQuantity] = useState<number>(1000);
  const [widthMm, setWidthMm] = useState<number>(90);
  const [heightMm, setHeightMm] = useState<number>(50);
  const [printSides, setPrintSides] = useState<'4x0' | '4x4' | '1x0' | '1x1'>('4x4');
  const [markupPercent, setMarkupPercent] = useState<number>(120);

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    materials[0]?.id || ''
  );
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(
    equipments[0]?.id || ''
  );

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === selectedMaterialId) || materials[0],
    [materials, selectedMaterialId]
  );

  const selectedEquipment = useMemo(
    () => equipments.find((e) => e.id === selectedEquipmentId) || equipments[0],
    [equipments, selectedEquipmentId]
  );

  const isPlotter = selectedEquipment?.category === 'plotter' || selectedMaterial?.unit === 'm2';

  const nesting = useMemo(() => {
    return calculateSheetNesting(widthMm, heightMm);
  }, [widthMm, heightMm]);

  const costResult = useMemo(() => {
    if (!selectedMaterial || !selectedEquipment) return null;
    return calculateOrderCost({
      quantity,
      widthMm,
      heightMm,
      printSides,
      costPerSheetOrM2: selectedMaterial.costPerUnit,
      isPlotterM2: isPlotter,
      clickCostColor: selectedEquipment.clickCostColor,
      clickCostPB: selectedEquipment.clickCostPB,
      machineHourlyRate: selectedEquipment.hourlyRate,
      machineSpeedPerHour: selectedEquipment.speedPerHour,
      markupPercent,
    });
  }, [
    quantity,
    widthMm,
    heightMm,
    printSides,
    selectedMaterial,
    selectedEquipment,
    isPlotter,
    markupPercent,
  ]);

  // SVG Scaling for imposition preview
  const previewMaxW = 260;
  const previewMaxH = 180;
  const scale = Math.min(
    previewMaxW / SRA3_SHEET.widthMm,
    previewMaxH / SRA3_SHEET.heightMm
  );
  const svgW = SRA3_SHEET.widthMm * scale;
  const svgH = SRA3_SHEET.heightMm * scale;

  const itemW = (nesting.orientation === 'girada' ? heightMm : widthMm) * scale;
  const itemH = (nesting.orientation === 'girada' ? widthMm : heightMm) * scale;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            Cálculo de Custo & Engenharia de Preço
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulador avançado com aproveitamento geométrico de folha SRA3, cliques e formação de preço.
          </p>
        </div>

        <button
          onClick={onOpenGerarPedido}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>Gerar Pedido</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Form (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
              Parâmetros da Produção
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Tiragem (Qtd)</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 font-mono font-bold text-sm bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Largura (mm)</label>
                <input
                  type="number"
                  min="10"
                  value={widthMm}
                  onChange={(e) => setWidthMm(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-full px-3 py-2 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Altura (mm)</label>
                <input
                  type="number"
                  min="10"
                  value={heightMm}
                  onChange={(e) => setHeightMm(Math.max(10, parseInt(e.target.value) || 10))}
                  className="w-full px-3 py-2 font-mono text-sm bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Tipo de Impressão</label>
              <select
                value={printSides}
                onChange={(e) => setPrintSides(e.target.value as any)}
                className="w-full px-3 py-2 font-medium bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="4x0">4x0 (Frente Colorida)</option>
                <option value="4x4">4x4 (Frente e Verso Color)</option>
                <option value="1x0">1x0 (Frente Preto & Branco)</option>
                <option value="1x1">1x1 (Frente e Verso PB)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Papel / Substrato</label>
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full px-3 py-2 font-medium bg-slate-50 border border-slate-200 rounded-lg"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {formatBRL(m.costPerUnit)}/{m.unit}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Equipamento</label>
              <select
                value={selectedEquipmentId}
                onChange={(e) => setSelectedEquipmentId(e.target.value)}
                className="w-full px-3 py-2 font-medium bg-slate-50 border border-slate-200 rounded-lg"
              >
                {equipments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} — Clique Color: {formatBRL(e.clickCostColor)} | PB: {formatBRL(e.clickCostPB)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sheet Imposition Visualization */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Aproveitamento na Folha SRA3
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {nesting.itemsPerSheet} unid / folha
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 shrink-0 flex items-center justify-center">
                <svg
                  width={svgW}
                  height={svgH}
                  className="border border-slate-700 bg-white/5 rounded-sm"
                >
                  <rect
                    x={(SRA3_SHEET.widthMm - SRA3_SHEET.printableWidthMm) * 0.5 * scale}
                    y={(SRA3_SHEET.heightMm - SRA3_SHEET.printableHeightMm) * 0.5 * scale}
                    width={SRA3_SHEET.printableWidthMm * scale}
                    height={SRA3_SHEET.printableHeightMm * scale}
                    fill="none"
                    stroke="#475569"
                    strokeDasharray="2,2"
                    strokeWidth="0.8"
                  />
                  {Array.from({ length: nesting.rows }).map((_, r) =>
                    Array.from({ length: nesting.cols }).map((__, c) => {
                      const x =
                        (SRA3_SHEET.widthMm - SRA3_SHEET.printableWidthMm) * 0.5 * scale +
                        c * itemW +
                        1;
                      const y =
                        (SRA3_SHEET.heightMm - SRA3_SHEET.printableHeightMm) * 0.5 * scale +
                        r * itemH +
                        1;
                      return (
                        <rect
                          key={`${r}-${c}`}
                          x={x}
                          y={y}
                          width={Math.max(2, itemW - 1.5)}
                          height={Math.max(2, itemH - 1.5)}
                          fill="#f59e0b"
                          fillOpacity="0.25"
                          stroke="#fbbf24"
                          strokeWidth="0.8"
                          rx="1"
                        />
                      );
                    })
                  )}
                </svg>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full text-xs font-mono">
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">Rendimento</div>
                  <div className="text-sm font-bold text-amber-400">
                    {nesting.itemsPerSheet} por folha
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {nesting.cols} col × {nesting.rows} lin
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">Folhas Brutas</div>
                  <div className="text-sm font-bold text-white">
                    {costResult?.sheetsNeeded || 0} folhas
                  </div>
                  <div className="text-[10px] text-slate-500">
                    +{costResult?.wasteSheets || 0} quebra
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">Tamanho Corte</div>
                  <div className="text-sm font-bold text-white">
                    {widthMm}x{heightMm} mm
                  </div>
                  <div className="text-[10px] text-slate-500">+2mm sangria</div>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">Refile Técnico</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {nesting.wastePercent}%
                  </div>
                  <div className="text-[10px] text-slate-500">aproveitamento</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Cost Breakdown & Suggested Selling Price (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
              Composição de Custo Real (CPV)
            </h3>

            {costResult && (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Papel / Substrato ({costResult.totalSheetsToConsume} folhas/m²)</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatBRL(costResult.materialCost)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Cliques de Impressão / Toner</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatBRL(costResult.clickCost)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Mão de Obra e Depreciação de Máquina</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatBRL(costResult.machineLaborCost)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline font-bold text-sm">
                  <span className="text-slate-900">CUSTO TOTAL DE PRODUÇÃO:</span>
                  <div className="text-right">
                    <span className="text-base font-mono text-slate-900 tabular-nums">
                      {formatBRL(costResult.totalCost)}
                    </span>
                    <div className="text-[10px] font-mono text-slate-400 font-normal">
                      Custo Unitário: {formatBRL(costResult.unitCost)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Markup Slider */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-amber-500" />
                  Margem de Lucro Desejada:
                </span>
                <span className="font-mono font-bold text-amber-700 text-sm">
                  {markupPercent}%
                </span>
              </div>

              <input
                type="range"
                min="30"
                max="250"
                step="5"
                value={markupPercent}
                onChange={(e) => setMarkupPercent(parseInt(e.target.value) || 100)}
                className="w-full accent-amber-500 cursor-pointer"
              />

              {costResult && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-left">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">
                      Econômico
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-900">
                      {formatBRL(costResult.suggestedPrices.min.price)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      +{costResult.suggestedPrices.min.markup}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-amber-300 bg-amber-50/80 text-left">
                    <div className="text-[10px] text-amber-800 font-bold uppercase flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Recomendado
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-900">
                      {formatBRL(costResult.suggestedPrices.recommended.price)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      +{costResult.suggestedPrices.recommended.markup}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-left">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">
                      Alta Margem
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-900">
                      {formatBRL(costResult.suggestedPrices.premium.price)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      +{costResult.suggestedPrices.premium.markup}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total Highlight */}
            {costResult && (
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span className="font-semibold uppercase tracking-wider">Preço Sugerido:</span>
                  <span className="font-mono text-emerald-400 text-xs">
                    Lucro Bruto: {formatBRL(costResult.suggestedPrices.recommended.profit)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <div className="text-2xl font-black font-mono text-white tabular-nums">
                    {formatBRL(costResult.suggestedPrices.recommended.price)}
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    {formatBRL(costResult.suggestedPrices.recommended.unitPrice)} / un
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onOpenGerarPedido}
              className="w-full py-3 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Gerar Pedido a Partir Deste Cálculo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
