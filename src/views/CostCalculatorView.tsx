import React, { useState, useMemo } from 'react';
import { Equipment, Material, Order, QuickProductPreset, SheetType } from '../types';
import {
  calculateOrderCost,
  calculateSheetNesting,
  formatBRL,
  SHEET_FORMATS,
} from '../utils/calculator';
import {
  Calculator,
  Check,
  Copy,
  Grid,
  Layers,
  Percent,
  PlusCircle,
  Printer,
  Share2,
  Sparkles,
} from 'lucide-react';

interface CostCalculatorViewProps {
  materials: Material[];
  equipments: Equipment[];
  presets?: QuickProductPreset[];
  onOpenGerarPedido: (prefill?: Partial<Order>) => void;
}

export const CostCalculatorView: React.FC<CostCalculatorViewProps> = ({
  materials,
  equipments,
  presets = [],
  onOpenGerarPedido,
}) => {
  const [quantity, setQuantity] = useState<number>(1000);
  const [widthCm, setWidthCm] = useState<number>(9);
  const [heightCm, setHeightCm] = useState<number>(5);
  const [printSides, setPrintSides] = useState<'4x0' | '4x4' | '1x0' | '1x1'>('4x4');
  const [markupPercent, setMarkupPercent] = useState<number>(120);

  // Aproveitamento de folha / mídia
  const [sheetType, setSheetType] = useState<SheetType>('a4');
  const [rollWidthCm, setRollWidthCm] = useState<number>(60);

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    materials[0]?.id || ''
  );
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(
    equipments[0]?.id || ''
  );

  const [copiedShare, setCopiedShare] = useState(false);

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === selectedMaterialId) || materials[0],
    [materials, selectedMaterialId]
  );

  const selectedEquipment = useMemo(
    () => equipments.find((e) => e.id === selectedEquipmentId) || equipments[0],
    [equipments, selectedEquipmentId]
  );

  const isPlotter = selectedEquipment?.category === 'plotter' || selectedMaterial?.unit === 'm2';

  // Cálculo de imposição e aproveitamento
  const nesting = useMemo(() => {
    return calculateSheetNesting(widthCm, heightCm, {
      sheetType,
      rollWidthCm,
      quantity,
    });
  }, [widthCm, heightCm, sheetType, rollWidthCm, quantity]);

  // Cálculo de custos e engenharia de preço
  const costResult = useMemo(() => {
    if (!selectedMaterial || !selectedEquipment) return null;
    return calculateOrderCost({
      quantity,
      widthCm,
      heightCm,
      printSides,
      costPerSheetOrM2: selectedMaterial.costPerUnit,
      isPlotterM2: isPlotter,
      clickCostColor: selectedEquipment.clickCostColor,
      clickCostPB: selectedEquipment.clickCostPB,
      machineHourlyRate: selectedEquipment.hourlyRate,
      machineSpeedPerHour: selectedEquipment.speedPerHour,
      inkPercent: selectedEquipment.inkPercent ?? 3,
      depreciationPercent: selectedEquipment.depreciationPercent ?? 10,
      markupPercent,
      sheetType,
      rollWidthCm,
    });
  }, [
    quantity,
    widthCm,
    heightCm,
    printSides,
    selectedMaterial,
    selectedEquipment,
    isPlotter,
    markupPercent,
    sheetType,
    rollWidthCm,
  ]);

  // Visualização SVG com proporção dinâmica exata da mídia (A4, A3, SRA3 ou Bobina)
  const previewMaxW = 260;
  const previewMaxH = 190;
  const currentSheetW = nesting.sheetWidthCm;
  const currentSheetH = nesting.sheetHeightCm;
  const scale = Math.min(
    previewMaxW / Math.max(10, currentSheetW),
    previewMaxH / Math.max(10, currentSheetH)
  );
  const svgW = Math.max(140, Math.round(currentSheetW * scale));
  const svgH = Math.max(140, Math.round(currentSheetH * scale));

  const itemW = (nesting.orientation === 'girada' ? heightCm : widthCm) * scale;
  const itemH = (nesting.orientation === 'girada' ? widthCm : heightCm) * scale;

  const applyPreset = (preset: QuickProductPreset) => {
    setWidthCm(preset.widthCm);
    setHeightCm(preset.heightCm);
    setPrintSides(preset.printSides);
    setQuantity(preset.quantity);

    if (preset.sheetType) {
      setSheetType(preset.sheetType);
    } else if (preset.isPlotter) {
      setSheetType('bobina');
    }

    if (preset.rollWidthCm) {
      setRollWidthCm(preset.rollWidthCm);
    }

    const matchedMat = materials.find((m) =>
      m.name.toLowerCase().includes(preset.materialKeyword.toLowerCase())
    );
    if (matchedMat) setSelectedMaterialId(matchedMat.id);

    if (preset.equipmentId && equipments.some((e) => e.id === preset.equipmentId)) {
      setSelectedEquipmentId(preset.equipmentId);
    } else if (preset.isPlotter) {
      const plotter = equipments.find((e) => e.category === 'plotter');
      if (plotter) setSelectedEquipmentId(plotter.id);
    } else if (equipments[0]) {
      setSelectedEquipmentId(equipments[0].id);
    }
  };

  const handleLaunchOrder = () => {
    if (!costResult || !selectedMaterial || !selectedEquipment) {
      onOpenGerarPedido();
      return;
    }

    const formatName =
      sheetType === 'bobina'
        ? `Bobina ${rollWidthCm}cm`
        : sheetType.toUpperCase();

    onOpenGerarPedido({
      productName: `Item ${widthCm}x${heightCm} cm (${formatName})`,
      quantity,
      widthCm,
      heightCm,
      printSides,
      materialId: selectedMaterial.id,
      materialName: selectedMaterial.name,
      equipmentId: selectedEquipment.id,
      equipmentName: selectedEquipment.name,
      sheetType,
      rollWidthCm: sheetType === 'bobina' ? rollWidthCm : undefined,
      linearMetersNeeded: costResult.linearMetersNeeded,
      itemsPerSheet: costResult.itemsPerSheet,
      sheetsNeeded: costResult.sheetsNeeded,
      wasteSheets: costResult.wasteSheets,
      materialCost: costResult.materialCost,
      clickCost: costResult.clickCost,
      machineLaborCost: costResult.machineLaborCost,
      inkCost: costResult.inkCost,
      inkPercent: costResult.inkPercent,
      depreciationCost: costResult.depreciationCost,
      depreciationPercent: costResult.depreciationPercent,
      totalCost: costResult.totalCost,
      suggestedPrice: costResult.suggestedPrices.recommended.price,
      finalPrice: costResult.suggestedPrices.recommended.price,
      unitPrice: costResult.suggestedPrices.recommended.unitPrice,
    });
  };

  const handleCopyQuoteSummary = () => {
    if (!costResult) return;
    const mediaText =
      sheetType === 'bobina'
        ? `Bobina Personalizada (${rollWidthCm} cm de largura, ${costResult.linearMetersNeeded} m lineares)`
        : `Folha ${sheetType.toUpperCase()} (${SHEET_FORMATS[sheetType as 'a4' | 'a3' | 'sra3']?.badge || ''})`;

    const text =
      `*Orçamento Gráfico - IprintDesginer*\n` +
      `📦 Item: ${widthCm} x ${heightCm} cm (${printSides})\n` +
      `🔢 Quantidade: ${quantity.toLocaleString('pt-BR')} un\n` +
      `📄 Formato de Aproveitamento: ${mediaText}\n` +
      `📑 Substrato: ${selectedMaterial?.name || '-'}\n` +
      `🖨️ Equipamento: ${selectedEquipment?.name || '-'}\n` +
      `💰 Preço Recomendado: ${formatBRL(costResult.suggestedPrices.recommended.price)} (${formatBRL(costResult.suggestedPrices.recommended.unitPrice)}/un)\n` +
      `📊 Custo de Produção (CPV): ${formatBRL(costResult.totalCost)}`;

    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Cálculo de Custo & Engenharia de Preço
            </h1>
            <span className="text-[10px] font-bold font-mono uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
              {sheetType === 'bobina' ? `Bobina ${rollWidthCm}cm` : sheetType.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Aproveitamento técnico de mídia (A4, A3, SRA3 ou Bobina Personalizada), cliques de impressão, CPV e formação de preço de venda.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyQuoteSummary}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            title="Copiar resumo do cálculo"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>Copiar Resumo</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLaunchOrder}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Gerar Pedido</span>
          </button>
        </div>
      </div>

      {/* Modelos Rápidos Bar in Calculator */}
      {presets.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Simular Modelo Rápido (1-Clique):</span>
            </span>
            <button
              onClick={() => onOpenGerarPedido()}
              className="text-xs text-amber-600 hover:text-amber-700 font-bold hover:underline cursor-pointer"
            >
              + Gerenciar / Novo Modelo
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-50 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-lg transition-all cursor-pointer"
                title={`Carregar ${p.name} (${p.widthCm}x${p.heightCm} cm)`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Form & Sheet Imposition (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs border-b border-slate-100 pb-2">
              Parâmetros da Produção (em Centímetros)
            </h3>

            {/* SELETOR DE APROVEITAMENTO DE FOLHA / BOBINA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>Tipo de Aproveitamento da Folha / Mídia:</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {sheetType === 'bobina' ? 'Mídia Contínua' : 'Folha Cortada'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Botão A4 */}
                <button
                  type="button"
                  onClick={() => setSheetType('a4')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    sheetType === 'a4'
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 text-slate-900 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs">A4</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        sheetType === 'a4'
                          ? 'bg-amber-200/80 text-amber-950'
                          : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      21×29,7 cm
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    Sulfite, fotográfico, receituários
                  </p>
                </button>

                {/* Botão A3 */}
                <button
                  type="button"
                  onClick={() => setSheetType('a3')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    sheetType === 'a3'
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 text-slate-900 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs">A3</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        sheetType === 'a3'
                          ? 'bg-amber-200/80 text-amber-950'
                          : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      29,7×42 cm
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    Cartazes, folders, cardápios
                  </p>
                </button>

                {/* Botão Bobina Personalizada */}
                <button
                  type="button"
                  onClick={() => setSheetType('bobina')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    sheetType === 'bobina'
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 text-slate-900 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs">Bobina</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        sheetType === 'bobina'
                          ? 'bg-amber-200/80 text-amber-950'
                          : 'bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      Rolo cm
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                    Vinil, lona, plotter, DTF
                  </p>
                </button>
              </div>

              {/* Controles da Bobina Personalizada */}
              {sheetType === 'bobina' && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-400/30 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-900">
                        Largura da Bobina / Rolo (cm):
                      </label>
                      <p className="text-[10px] text-slate-500">
                        Insira a largura exata da bobina física carregada na máquina
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="10"
                        max="320"
                        step="1"
                        value={rollWidthCm}
                        onChange={(e) =>
                          setRollWidthCm(
                            Math.max(10, Math.min(320, parseFloat(e.target.value) || 10))
                          )
                        }
                        className="w-24 px-3 py-1.5 font-mono font-bold text-sm bg-white border border-amber-400/60 rounded-lg text-slate-900 text-center"
                      />
                      <span className="text-xs font-bold text-slate-600">cm</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-amber-400/20">
                    <span className="text-[10px] font-semibold text-slate-600">
                      Padrões Comerciais:
                    </span>
                    {[30, 60, 90, 100, 120, 160].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setRollWidthCm(w)}
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border transition-all cursor-pointer ${
                          rollWidthCm === w
                            ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs font-extrabold'
                            : 'bg-white hover:bg-amber-100/60 text-slate-700 border-amber-300/50'
                        }`}
                      >
                        {w} cm
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Medidas do Item e Tiragem */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
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
                <label className="block font-medium text-slate-700 mb-1">Largura Item (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={widthCm}
                  onChange={(e) => setWidthCm(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                  className="w-full px-3 py-2 font-mono font-bold text-sm bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Altura Item (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                  className="w-full px-3 py-2 font-mono font-bold text-sm bg-slate-50 border border-slate-200 rounded-lg"
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

          {/* Sheet / Roll Imposition Visualization */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {sheetType === 'bobina'
                    ? `Aproveitamento na Bobina (${rollWidthCm} cm)`
                    : `Aproveitamento na Folha ${sheetType.toUpperCase()} (${nesting.sheetWidthCm} x ${nesting.sheetHeightCm} cm)`}
                </h4>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {sheetType === 'bobina'
                  ? `${nesting.cols} unid / fila`
                  : `${nesting.itemsPerSheet} unid / folha`}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 shrink-0 flex items-center justify-center min-w-[160px] min-h-[160px]">
                {sheetType === 'bobina' ? (
                  /* Visualizador Gráfico para Bobina Contínua */
                  <div className="flex flex-col items-center">
                    {/* Cilindro do rolo superior */}
                    <div
                      style={{ width: svgW }}
                      className="h-4 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 rounded-t-md border-b border-amber-500/40 relative shadow-inner flex items-center justify-center"
                    >
                      <span className="text-[9px] font-mono font-bold text-amber-300">
                        ROLO {rollWidthCm} cm
                      </span>
                    </div>

                    {/* Mídia desenrolada com grade de itens */}
                    <svg
                      width={svgW}
                      height={svgH}
                      className="border-x border-b border-slate-700 bg-white/5"
                    >
                      {/* Margens de pinça/tração */}
                      <rect
                        x={0.5 * scale}
                        y={1}
                        width={nesting.printableWidthCm * scale}
                        height={svgH - 2}
                        fill="none"
                        stroke="#475569"
                        strokeDasharray="2,2"
                        strokeWidth="0.8"
                      />
                      {/* Grid de itens na bobina (mostra as primeiras linhas representativas) */}
                      {Array.from({ length: Math.min(6, nesting.rows) }).map((_, r) =>
                        Array.from({ length: nesting.cols }).map((__, c) => {
                          const x = 0.5 * scale + c * itemW + 1;
                          const y = r * itemH + 2;
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

                    <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-2">
                      <span>↓ Avanço: {nesting.linearMetersNeeded} m lineares</span>
                    </div>
                  </div>
                ) : (
                  /* Visualizador Gráfico para Folha Cortada (A4, A3, SRA3) */
                  <svg
                    width={svgW}
                    height={svgH}
                    className="border border-slate-700 bg-white/5 rounded-sm"
                  >
                    <rect
                      x={(nesting.sheetWidthCm - nesting.printableWidthCm) * 0.5 * scale}
                      y={(nesting.sheetHeightCm - nesting.printableHeightCm) * 0.5 * scale}
                      width={nesting.printableWidthCm * scale}
                      height={nesting.printableHeightCm * scale}
                      fill="none"
                      stroke="#475569"
                      strokeDasharray="2,2"
                      strokeWidth="0.8"
                    />
                    {Array.from({ length: nesting.rows }).map((_, r) =>
                      Array.from({ length: nesting.cols }).map((__, c) => {
                        const x =
                          (nesting.sheetWidthCm - nesting.printableWidthCm) * 0.5 * scale +
                          c * itemW +
                          1;
                        const y =
                          (nesting.sheetHeightCm - nesting.printableHeightCm) * 0.5 * scale +
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
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 w-full text-xs font-mono">
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">
                    {sheetType === 'bobina' ? 'Itens por Fila' : 'Rendimento'}
                  </div>
                  <div className="text-sm font-bold text-amber-400">
                    {sheetType === 'bobina'
                      ? `${nesting.cols} un / fila`
                      : `${nesting.itemsPerSheet} por folha`}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {nesting.cols} col × {nesting.rows} lin ({nesting.orientation})
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">
                    {sheetType === 'bobina' ? 'Metros Lineares' : 'Folhas Brutas'}
                  </div>
                  <div className="text-sm font-bold text-white">
                    {sheetType === 'bobina'
                      ? `${costResult?.linearMetersNeeded || 0} m lineares`
                      : `${costResult?.sheetsNeeded || 0} folhas`}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {sheetType === 'bobina'
                      ? `Área: ${costResult?.totalRollM2 || 0} m²`
                      : `+${costResult?.wasteSheets || 0} quebra`}
                  </div>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">Tamanho Corte</div>
                  <div className="text-sm font-bold text-white">
                    {widthCm} x {heightCm} cm
                  </div>
                  <div className="text-[10px] text-slate-500">+0,2 cm sangria</div>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">Aproveitamento</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {100 - nesting.wastePercent}% útil
                  </div>
                  <div className="text-[10px] text-slate-500">{nesting.wastePercent}% sobra</div>
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
                  <span>
                    {sheetType === 'bobina'
                      ? `Mídia em Bobina (${costResult.totalRollM2 || 0} m² / ${costResult.linearMetersNeeded || 0} m)`
                      : `Papel / Substrato ${sheetType.toUpperCase()} (${costResult.totalSheetsToConsume} folhas)`}
                  </span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatBRL(costResult.materialCost)}
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
                      +{costResult.suggestedPrices.min.markup}% margem
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
                      +{costResult.suggestedPrices.recommended.markup}% margem
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
                      +{costResult.suggestedPrices.premium.markup}% margem
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total Highlight */}
            {costResult && (
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span className="font-semibold uppercase tracking-wider">
                    Preço Sugerido (tinta {costResult.inkPercent}% · depr. {costResult.depreciationPercent}%):
                  </span>
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

                <div className="text-[11px] text-slate-300 pt-1.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-1">
                  <span>Custo Produção: {formatBRL(costResult.totalCost)}</span>
                  <span>Tinta ({costResult.inkPercent}%): {formatBRL(costResult.suggestedPrices.recommended.inkCost)}</span>
                  <span>Depr. ({costResult.depreciationPercent}%): {formatBRL(costResult.suggestedPrices.recommended.depreciationCost)}</span>
                  <span className="text-emerald-300 font-mono font-semibold">Lucro: {formatBRL(costResult.suggestedPrices.recommended.profit)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleLaunchOrder}
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
