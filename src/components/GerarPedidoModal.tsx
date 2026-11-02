import React, { useState, useMemo } from 'react';
import { Equipment, Material, Order } from '../types';
import {
  calculateOrderCost,
  formatBRL,
  generateWhatsAppLink,
  generateWhatsAppMessage,
} from '../utils/calculator';
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  Layers,
  MessageSquare,
  Percent,
  Plus,
  Printer,
  Sparkles,
  User,
  Wand2,
  X,
} from 'lucide-react';

interface GerarPedidoModalProps {
  materials: Material[];
  equipments: Equipment[];
  onSaveOrder: (order: Order) => void;
  onClose: () => void;
}

interface QuickProductPreset {
  label: string;
  name: string;
  w: number;
  h: number;
  sides: '4x0' | '4x4' | '1x0' | '1x1';
  qty: number;
  materialKeyword: string;
  isPlotter?: boolean;
}

const PRESETS: QuickProductPreset[] = [
  {
    label: 'Cartão 9x5',
    name: 'Cartão de Visita 9x5cm Couché 300g',
    w: 90,
    h: 50,
    sides: '4x4',
    qty: 1000,
    materialKeyword: '300g',
  },
  {
    label: 'Panfleto A5',
    name: 'Panfleto A5 (148x210mm) Couché 150g',
    w: 148,
    h: 210,
    sides: '4x0',
    qty: 2500,
    materialKeyword: '150g',
  },
  {
    label: 'Folder A4',
    name: 'Folder A4 (297x210mm) 2 Dobras Couché 150g',
    w: 297,
    h: 210,
    sides: '4x4',
    qty: 500,
    materialKeyword: '150g',
  },
  {
    label: 'Banner Lona',
    name: 'Banner Lona 440g c/ Bastão e Ilhós',
    w: 1000,
    h: 1500,
    sides: '4x0',
    qty: 1,
    materialKeyword: 'Lona',
    isPlotter: true,
  },
  {
    label: 'Adesivo 5x5',
    name: 'Adesivo Vinil 5x5cm Meio-Corte',
    w: 50,
    h: 50,
    sides: '4x0',
    qty: 500,
    materialKeyword: 'Vinil',
    isPlotter: true,
  },
  {
    label: 'Receituário A5',
    name: 'Receituário A5 Offset 90g Blocado',
    w: 148,
    h: 210,
    sides: '1x0',
    qty: 1000,
    materialKeyword: 'Offset',
  },
];

export const GerarPedidoModal: React.FC<GerarPedidoModalProps> = ({
  materials,
  equipments,
  onSaveOrder,
  onClose,
}) => {
  // 1. Dados do Cliente
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // 2. Produto e Especificações
  const [productName, setProductName] = useState('Cartão de Visita 9x5cm Couché 300g');
  const [quantity, setQuantity] = useState<number>(1000);
  const [widthMm, setWidthMm] = useState<number>(90);
  const [heightMm, setHeightMm] = useState<number>(50);
  const [printSides, setPrintSides] = useState<'4x0' | '4x4' | '1x0' | '1x1'>('4x4');
  const [notes, setNotes] = useState('');

  // 3. Material e Máquina
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    materials[0]?.id || ''
  );
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(
    equipments[0]?.id || ''
  );

  // 4. Preço e Margem
  const [markupPercent, setMarkupPercent] = useState<number>(120);
  const [customFinalPrice, setCustomFinalPrice] = useState<number | null>(null);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Find active material and equipment
  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === selectedMaterialId) || materials[0],
    [materials, selectedMaterialId]
  );

  const selectedEquipment = useMemo(
    () => equipments.find((e) => e.id === selectedEquipmentId) || equipments[0],
    [equipments, selectedEquipmentId]
  );

  const isPlotter = selectedEquipment?.category === 'plotter' || selectedMaterial?.unit === 'm2';

  // Cost and Suggested Price Calculation in Real Time
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

  const activeTotalPrice = useMemo(() => {
    if (customFinalPrice !== null) return customFinalPrice;
    return costResult?.suggestedPrices.recommended.price || 0;
  }, [customFinalPrice, costResult]);

  const activeUnitPrice = useMemo(() => {
    return quantity > 0 ? activeTotalPrice / quantity : 0;
  }, [activeTotalPrice, quantity]);

  // Apply preset
  const applyPreset = (preset: QuickProductPreset) => {
    setProductName(preset.name);
    setWidthMm(preset.w);
    setHeightMm(preset.h);
    setPrintSides(preset.sides);
    setQuantity(preset.qty);
    setCustomFinalPrice(null);

    // Auto-select material
    const matchedMat = materials.find((m) =>
      m.name.toLowerCase().includes(preset.materialKeyword.toLowerCase())
    );
    if (matchedMat) setSelectedMaterialId(matchedMat.id);

    // Auto-select equipment
    if (preset.isPlotter) {
      const plotter = equipments.find((e) => e.category === 'plotter');
      if (plotter) setSelectedEquipmentId(plotter.id);
    } else {
      const laser = equipments.find((e) => e.category === 'laser');
      if (laser) setSelectedEquipmentId(laser.id);
    }
  };

  // WhatsApp text representation
  const whatsAppText = useMemo(() => {
    return generateWhatsAppMessage({
      clientName,
      productName,
      quantity,
      widthMm,
      heightMm,
      printSides,
      materialName: selectedMaterial?.name || 'Padrão',
      totalPrice: activeTotalPrice,
      unitPrice: activeUnitPrice,
      notes,
    });
  }, [
    clientName,
    productName,
    quantity,
    widthMm,
    heightMm,
    printSides,
    selectedMaterial,
    activeTotalPrice,
    activeUnitPrice,
    notes,
  ]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openWhatsAppDirect = () => {
    const link = generateWhatsAppLink(clientPhone, whatsAppText);
    window.open(link, '_blank');
  };

  // Save handler
  const handleSave = (type: 'pedido' | 'orcamento') => {
    const prefix = type === 'pedido' ? 'OS' : 'ORC';
    const randomCode = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      code: randomCode,
      type,
      clientName: clientName.trim() || 'Cliente Balcão',
      clientPhone: clientPhone.trim() || '',
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      status: type === 'pedido' ? 'em_producao' : 'orcamento',
      paymentStatus: 'pendente',
      paymentMethod: 'pix',
      productName: productName.trim() || 'Serviço Gráfico',
      quantity,
      widthMm,
      heightMm,
      printSides,
      materialId: selectedMaterial?.id || '',
      materialName: selectedMaterial?.name || '',
      equipmentId: selectedEquipment?.id || '',
      equipmentName: selectedEquipment?.name || '',
      itemsPerSheet: costResult?.itemsPerSheet || 1,
      sheetsNeeded: costResult?.sheetsNeeded || 0,
      wasteSheets: costResult?.wasteSheets || 0,
      materialCost: costResult?.materialCost || 0,
      clickCost: costResult?.clickCost || 0,
      machineLaborCost: costResult?.machineLaborCost || 0,
      totalCost: costResult?.totalCost || 0,
      suggestedPrice: costResult?.suggestedPrices.recommended.price || activeTotalPrice,
      finalPrice: activeTotalPrice,
      unitPrice: activeUnitPrice,
      notes: notes.trim(),
      stockDeducted: false,
    };

    onSaveOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Gerar Pedido / Orçamento
              </h2>
              <p className="text-xs text-slate-400">
                Cadastro rápido, cálculo automático de custo e envio para o WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Quick Presets Strip */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Modelos Rápidos (1-Clique):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-lg transition-all cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Client & Material & Equipment (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* 1. Cadastro do Cliente */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    1. Cadastro do Cliente
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nome do Cliente / Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ana Paula Arquitetura"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      WhatsApp / Telefone *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="(11) 98765-4321"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Produto, Medidas e Quantidade */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    2. Produto & Especificações
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Descrição do Produto
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Ex: Cartão de Visita 9x5cm Couché 300g"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Tiragem (Qtd)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Largura (mm)
                    </label>
                    <input
                      type="number"
                      min="10"
                      value={widthMm}
                      onChange={(e) => setWidthMm(Math.max(10, parseInt(e.target.value) || 10))}
                      className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Altura (mm)
                    </label>
                    <input
                      type="number"
                      min="10"
                      value={heightMm}
                      onChange={(e) => setHeightMm(Math.max(10, parseInt(e.target.value) || 10))}
                      className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Cores
                    </label>
                    <select
                      value={printSides}
                      onChange={(e) => setPrintSides(e.target.value as any)}
                      className="w-full px-2 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="4x0">4x0 (Frente Color)</option>
                      <option value="4x4">4x4 (Frente/Verso)</option>
                      <option value="1x0">1x0 (Frente PB)</option>
                      <option value="1x1">1x1 (Frente/Verso PB)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. Adicionar Material e Máquina */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    3. Matéria-Prima & Máquina Utilizada
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Material / Papel / Substrato
                    </label>
                    <select
                      value={selectedMaterialId}
                      onChange={(e) => setSelectedMaterialId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg"
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} — Custo: {formatBRL(m.costPerUnit)}/{m.unit} (Estoque: {m.currentStock} {m.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Máquina que vai produzir
                    </label>
                    <select
                      value={selectedEquipmentId}
                      onChange={(e) => setSelectedEquipmentId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg"
                    >
                      {equipments.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name} — Clique: Color {formatBRL(e.clickCostColor)} | PB {formatBRL(e.clickCostPB)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Observações Técnicas / Acabamento
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ex: Plastificação brilhante, corte reto, furos..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Preços Sugeridos & WhatsApp (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Preços Sugeridos */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Preços Sugeridos
                    </h3>
                  </div>
                  {costResult && (
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Custo: {formatBRL(costResult.totalCost)}
                    </span>
                  )}
                </div>

                {/* 3 Clickable Pricing Tiers */}
                {costResult && (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMarkupPercent(costResult.suggestedPrices.min.markup);
                        setCustomFinalPrice(costResult.suggestedPrices.min.price);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        activeTotalPrice === costResult.suggestedPrices.min.price
                          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[10px] text-slate-500 font-bold uppercase">
                        Econômico
                      </div>
                      <div className="text-xs font-bold font-mono text-slate-900">
                        {formatBRL(costResult.suggestedPrices.min.price)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        +{costResult.suggestedPrices.min.markup}%
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMarkupPercent(costResult.suggestedPrices.recommended.markup);
                        setCustomFinalPrice(costResult.suggestedPrices.recommended.price);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        activeTotalPrice === costResult.suggestedPrices.recommended.price
                          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[10px] text-amber-700 font-bold uppercase flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Recomendado
                      </div>
                      <div className="text-xs font-bold font-mono text-slate-900">
                        {formatBRL(costResult.suggestedPrices.recommended.price)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        +{costResult.suggestedPrices.recommended.markup}%
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMarkupPercent(costResult.suggestedPrices.premium.markup);
                        setCustomFinalPrice(costResult.suggestedPrices.premium.price);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        activeTotalPrice === costResult.suggestedPrices.premium.price
                          ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[10px] text-slate-500 font-bold uppercase">
                        Alta Margem
                      </div>
                      <div className="text-xs font-bold font-mono text-slate-900">
                        {formatBRL(costResult.suggestedPrices.premium.price)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        +{costResult.suggestedPrices.premium.markup}%
                      </div>
                    </button>
                  </div>
                )}

                {/* Final Price Highlight / Custom Input */}
                <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-300">
                    <span className="font-semibold uppercase tracking-wider">Preço de Venda Final:</span>
                    <span className="font-mono text-emerald-400 text-[11px]">
                      Lucro: {formatBRL(activeTotalPrice - (costResult?.totalCost || 0))}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono text-amber-400">R$</span>
                    <input
                      type="number"
                      step="1"
                      value={activeTotalPrice}
                      onChange={(e) => setCustomFinalPrice(parseFloat(e.target.value) || 0)}
                      className="text-2xl font-black font-mono bg-transparent text-white w-full border-b border-slate-700 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Valor unitário: {formatBRL(activeUnitPrice)} / unidade
                  </div>
                </div>
              </div>

              {/* Gerar Orçamento para copiar e mandar pelo WhatsApp */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Orçamento para WhatsApp</span>
                  </div>
                  {copied && (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Copiado!
                    </span>
                  )}
                </div>

                <div className="bg-white p-3 rounded-lg border border-emerald-200/80 text-[11px] text-slate-700 whitespace-pre-wrap max-h-36 overflow-y-auto font-sans leading-relaxed select-all">
                  {whatsAppText}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </button>

                  <button
                    type="button"
                    onClick={openWhatsAppDirect}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {selectedMaterial ? (
              <span>
                Consumo: ~{costResult?.totalSheetsToConsume || 0} {selectedMaterial.unit}s ({selectedMaterial.name})
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSave('orcamento')}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer text-center"
            >
              Salvar como Orçamento
            </button>

            <button
              type="button"
              onClick={() => handleSave('pedido')}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Gerar Pedido (OS)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
