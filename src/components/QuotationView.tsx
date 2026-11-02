import React, { useState, useMemo } from 'react';
import {
  Equipment,
  FinishingOption,
  Material,
  Order,
  OrderItem,
  OrderStatus,
} from '../types';
import { calculateProductionCost, formatBRL } from '../utils/calculator';
import { SheetImpositionViewer } from './SheetImpositionViewer';
import {
  Calculator,
  CheckCircle2,
  Copy,
  FileText,
  Layers,
  Percent,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';

interface QuotationViewProps {
  materials: Material[];
  equipments: Equipment[];
  onSaveOrder: (order: Order) => void;
  onPrintProposal: (order: Order) => void;
  defaultMarkup: number;
  wastePercent: number;
}

interface PresetProduct {
  name: string;
  category: OrderItem['productType'];
  w: number;
  h: number;
  sides: '4x0' | '4x4' | '1x0' | '1x1';
  format: 'SRA3' | 'A3' | 'A4' | 'Bobina_m2';
  suggestedMaterialKeyword: string;
  defaultQty: number;
  defaultFinishings: FinishingOption[];
}

const PRESET_PRODUCTS: PresetProduct[] = [
  {
    name: 'Cartão de Visita (90x50 mm)',
    category: 'cartao',
    w: 90,
    h: 50,
    sides: '4x4',
    format: 'SRA3',
    suggestedMaterialKeyword: '300g',
    defaultQty: 1000,
    defaultFinishings: [{ id: 'f_bopp', name: 'BOPP Fosco Frente e Verso', cost: 22.0, price: 60.0 }],
  },
  {
    name: 'Panfleto / Flyer A6 (100x150 mm)',
    category: 'panfleto',
    w: 100,
    h: 150,
    sides: '4x0',
    format: 'SRA3',
    suggestedMaterialKeyword: '150g',
    defaultQty: 2500,
    defaultFinishings: [{ id: 'f_refile', name: 'Refile na Guilhotina', cost: 10.0, price: 25.0 }],
  },
  {
    name: 'Folder A4 c/ 2 Dobras (297x210 mm)',
    category: 'folder',
    w: 297,
    h: 210,
    sides: '4x4',
    format: 'SRA3',
    suggestedMaterialKeyword: '150g',
    defaultQty: 500,
    defaultFinishings: [{ id: 'f_dobra', name: 'Vinco e Dobra Tripla (Sanfona)', cost: 25.0, price: 60.0 }],
  },
  {
    name: 'Banner Lona c/ Bastão (1000x1500 mm)',
    category: 'banner',
    w: 1000,
    h: 1500,
    sides: '4x0',
    format: 'Bobina_m2',
    suggestedMaterialKeyword: 'Lona',
    defaultQty: 1,
    defaultFinishings: [{ id: 'f_bastao', name: 'Bastão de Madeira + Cordão + Ilhós', cost: 25.0, price: 50.0 }],
  },
  {
    name: 'Adesivo Vinil Meio-Corte (50x50 mm)',
    category: 'adesivo',
    w: 50,
    h: 50,
    sides: '4x0',
    format: 'Bobina_m2',
    suggestedMaterialKeyword: 'Vinil',
    defaultQty: 500,
    defaultFinishings: [{ id: 'f_corte', name: 'Meio-corte em Plotter Digital', cost: 30.0, price: 70.0 }],
  },
  {
    name: 'Apostila A4 Sulfite 75g (210x297 mm)',
    category: 'livro_apostila',
    w: 210,
    h: 297,
    sides: '1x1',
    format: 'A4',
    suggestedMaterialKeyword: '75g',
    defaultQty: 50,
    defaultFinishings: [{ id: 'f_wireo', name: 'Encadernação Wire-o + Capa Acetato', cost: 8.0, price: 18.0 }],
  },
];

export const QuotationView: React.FC<QuotationViewProps> = ({
  materials,
  equipments,
  onSaveOrder,
  onPrintProposal,
  defaultMarkup,
  wastePercent,
}) => {
  // Client details
  const [clientName, setClientName] = useState('');
  const [clientDoc, setClientDoc] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Item configuration
  const [description, setDescription] = useState('Cartão de Visita 9x5cm Couché 300g 4x4');
  const [productType, setProductType] = useState<OrderItem['productType']>('cartao');
  const [quantity, setQuantity] = useState<number>(1000);
  const [widthMm, setWidthMm] = useState<number>(90);
  const [heightMm, setHeightMm] = useState<number>(50);
  const [printSides, setPrintSides] = useState<'4x0' | '4x4' | '1x0' | '1x1'>('4x4');
  const [sheetFormat, setSheetFormat] = useState<'SRA3' | 'A3' | 'A4' | 'Bobina_m2'>('SRA3');

  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    materials[0]?.id || ''
  );
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(
    equipments[0]?.id || ''
  );

  const [finishings, setFinishings] = useState<FinishingOption[]>([
    { id: 'f1', name: 'Laminação Térmica BOPP Fosco', cost: 22.0, price: 60.0 },
  ]);

  const [markupPercent, setMarkupPercent] = useState<number>(defaultMarkup || 120);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === selectedMaterialId) || materials[0],
    [materials, selectedMaterialId]
  );

  const selectedEquipment = useMemo(
    () => equipments.find((e) => e.id === selectedEquipmentId) || equipments[0],
    [equipments, selectedEquipmentId]
  );

  const finishingsCostTotal = useMemo(
    () => finishings.reduce((sum, f) => sum + f.cost, 0),
    [finishings]
  );

  // Recalculate production cost & suggested prices
  const costCalculation = useMemo(() => {
    if (!selectedMaterial || !selectedEquipment) return null;

    return calculateProductionCost({
      quantity,
      itemWidthMm: widthMm,
      itemHeightMm: heightMm,
      printSides,
      sheetFormat,
      costPerSheetOrM2: selectedMaterial.costPerUnit,
      clickCostColor: selectedEquipment.clickCostColor,
      clickCostPB: selectedEquipment.clickCostPB,
      equipmentHourlyRate: selectedEquipment.hourlyRate,
      speedPerHour: selectedEquipment.speedPerHour,
      wastePercent,
      targetMarkupPercent: markupPercent,
      finishingsTotalCost: finishingsCostTotal,
    });
  }, [
    quantity,
    widthMm,
    heightMm,
    printSides,
    sheetFormat,
    selectedMaterial,
    selectedEquipment,
    wastePercent,
    markupPercent,
    finishingsCostTotal,
  ]);

  const activeTotalPrice = useMemo(() => {
    if (customPrice !== null) return customPrice;
    return costCalculation?.suggestedPrices.recommended.price || 0;
  }, [customPrice, costCalculation]);

  const activeUnitPrice = useMemo(() => {
    return quantity > 0 ? activeTotalPrice / quantity : 0;
  }, [activeTotalPrice, quantity]);

  const profitEstimate = useMemo(() => {
    const totalCost = costCalculation?.totalProductionCost || 0;
    return Math.max(0, activeTotalPrice - totalCost);
  }, [activeTotalPrice, costCalculation]);

  // Apply Preset product
  const applyPreset = (preset: PresetProduct) => {
    setDescription(preset.name);
    setProductType(preset.category);
    setWidthMm(preset.w);
    setHeightMm(preset.h);
    setPrintSides(preset.sides);
    setSheetFormat(preset.format);
    setQuantity(preset.defaultQty);
    setFinishings(preset.defaultFinishings);
    setCustomPrice(null);

    // Auto-select fitting material
    const matchedMat = materials.find((m) =>
      m.name.toLowerCase().includes(preset.suggestedMaterialKeyword.toLowerCase())
    );
    if (matchedMat) setSelectedMaterialId(matchedMat.id);

    // Auto-select fitting equipment
    if (preset.format === 'Bobina_m2') {
      const plotter = equipments.find((e) => e.category === 'plotter_comunicacao');
      if (plotter) setSelectedEquipmentId(plotter.id);
    } else {
      const digital = equipments.find((e) => e.category === 'impressora_laser');
      if (digital) setSelectedEquipmentId(digital.id);
    }
  };

  // Add custom finishing
  const [newFinishingName, setNewFinishingName] = useState('');
  const [newFinishingCost, setNewFinishingCost] = useState(15);
  const [newFinishingPrice, setNewFinishingPrice] = useState(35);

  const addFinishing = () => {
    if (!newFinishingName.trim()) return;
    setFinishings([
      ...finishings,
      {
        id: `fin_${Date.now()}`,
        name: newFinishingName,
        cost: Number(newFinishingCost) || 0,
        price: Number(newFinishingPrice) || 0,
      },
    ]);
    setNewFinishingName('');
    setNewFinishingCost(15);
    setNewFinishingPrice(35);
  };

  const removeFinishing = (id: string) => {
    setFinishings(finishings.filter((f) => f.id !== id));
  };

  // Build complete Order object
  const createOrderObject = (type: 'pedido' | 'orcamento'): Order => {
    const year = new Date().getFullYear();
    const prefix = type === 'pedido' ? 'OS' : 'ORC';
    const randomCode = `${prefix}-${year}-0${Math.floor(100 + Math.random() * 900)}`;

    const item: OrderItem = {
      id: `it_${Date.now()}`,
      description,
      productType,
      quantity,
      widthMm,
      heightMm,
      printSides,
      materialId: selectedMaterial?.id || '',
      materialName: selectedMaterial?.name || '',
      equipmentId: selectedEquipment?.id || '',
      equipmentName: selectedEquipment?.name || '',
      sheetFormat,
      itemsPerSheet: costCalculation?.itemsPerSheet || 1,
      sheetsNeeded: costCalculation?.sheetsNeeded || 0,
      wasteSheets: costCalculation?.wasteSheets || 0,
      materialCost: costCalculation?.materialCost || 0,
      printClickCost: costCalculation?.printClickCost || 0,
      finishingsCost: costCalculation?.finishingsCost || 0,
      laborAndDepreciationCost: costCalculation?.laborAndDepreciationCost || 0,
      totalProductionCost: costCalculation?.totalProductionCost || 0,
      suggestedMarginPercent: markupPercent,
      unitPrice: Number(activeUnitPrice.toFixed(3)),
      totalPrice: Number(activeTotalPrice.toFixed(2)),
      finishings,
    };

    const status: OrderStatus = type === 'pedido' ? 'aprovado' : 'orcamento';

    return {
      id: `ord_${Date.now()}`,
      code: randomCode,
      type,
      clientName: clientName.trim() || 'Cliente Balcão',
      clientDoc: clientDoc.trim() || 'Não Informado',
      clientPhone: clientPhone.trim() || '',
      clientEmail: clientEmail.trim() || '',
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      status,
      paymentStatus: 'pendente',
      paymentMethod: 'pix',
      amountPaid: 0,
      items: [item],
      subtotal: activeTotalPrice,
      discount: 0,
      total: activeTotalPrice,
      totalCost: costCalculation?.totalProductionCost || 0,
      profitEstimate,
      notes: notes.trim() || 'Orçamento gerado pelo sistema PrintFlow.',
      hasNfIssued: false,
      stockDeducted: false,
    };
  };

  const handleSaveAsQuote = () => {
    const order = createOrderObject('orcamento');
    onSaveOrder(order);
    showToast(`Orçamento ${order.code} salvo com sucesso!`);
  };

  const handleConvertToProduction = () => {
    const order = createOrderObject('pedido');
    onSaveOrder(order);
    showToast(`Pedido ${order.code} gerado e pronto para produção!`);
  };

  const handlePrint = () => {
    const order = createOrderObject('orcamento');
    onPrintProposal(order);
  };

  const copyWhatsAppText = () => {
    const text = `*Orçamento - PrintFlow Gráfica Rápida*\n\n` +
      `*Cliente:* ${clientName || 'Cliente'}\n` +
      `*Item:* ${description}\n` +
      `*Quantidade:* ${quantity.toLocaleString('pt-BR')} unidades\n` +
      `*Formato:* ${widthMm}x${heightMm} mm (${printSides})\n` +
      `*Material:* ${selectedMaterial?.name}\n` +
      `*Acabamento:* ${finishings.map((f) => f.name).join(', ') || 'Nenhum'}\n\n` +
      `*Valor Total:* ${formatBRL(activeTotalPrice)}\n` +
      `*Valor Unitário:* ${formatBRL(activeUnitPrice)}\n` +
      `*Prazo de Produção:* 2 a 3 dias úteis após aprovação da arte.\n` +
      `*Validade:* 7 dias.\n\n` +
      `Chave PIX: contato@printflow.com.br`;

    navigator.clipboard.writeText(text);
    showToast('Proposta comercial copiada para a área de transferência!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header and Quick Presets */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Gerador de Orçamentos & Engenharia de Custos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Calcule com precisão custo de papel, aproveitamento de corte, cliques e margem de lucro sugerida.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyWhatsAppText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar p/ WhatsApp
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Proposta PDF
            </button>
          </div>
        </div>

        {/* Presets Segmented Buttons */}
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Modelos Rápidos (1-Clique):
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_PRODUCTS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-50 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-500" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Specifications (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Client Information */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Dados do Cliente
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Cliente / Razão Social
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: Ana Paula Arquitetura"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  WhatsApp / Celular
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  CPF ou CNPJ (para Nota Fiscal)
                </label>
                <input
                  type="text"
                  value={clientDoc}
                  onChange={(e) => setClientDoc(e.target.value)}
                  placeholder="000.000.000-00 ou CNPJ"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="contato@cliente.com.br"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Product Technical Specs */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Especificações do Produto Gráfico
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Descrição do Item
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Cartão de Visita 9x5cm Couché 300g"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tiragem (Quantidade)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Impressão (Lados)
                </label>
                <select
                  value={printSides}
                  onChange={(e) => setPrintSides(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="4x0">4x0 (Frente Colorida)</option>
                  <option value="4x4">4x4 (Frente e Verso Color)</option>
                  <option value="1x0">1x0 (Frente Preto/Branco)</option>
                  <option value="1x1">1x1 (Frente e Verso PB)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Formato de Imposição
                </label>
                <select
                  value={sheetFormat}
                  onChange={(e) => setSheetFormat(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                >
                  <option value="SRA3">SRA3 (330x480 mm)</option>
                  <option value="A3">A3 (297x420 mm)</option>
                  <option value="A4">A4 (210x297 mm)</option>
                  <option value="Bobina_m2">Plotter Bobina (m²)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Papel / Substrato (Matéria-Prima)
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
                >
                  {materials.map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} ({formatBRL(mat.costPerUnit)}/{mat.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Equipamento de Impressão
              </label>
              <select
                value={selectedEquipmentId}
                onChange={(e) => setSelectedEquipmentId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} — Clique Color: {formatBRL(eq.clickCostColor)} | PB:{' '}
                    {formatBRL(eq.clickCostPB)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Acabamentos Especiais */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                3. Acabamentos & Pós-Impressão
              </h3>
              <span className="text-xs font-mono text-slate-500">
                Total Acabamentos: {formatBRL(finishingsCostTotal)}
              </span>
            </div>

            {finishings.length > 0 ? (
              <div className="space-y-2">
                {finishings.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-sm"
                  >
                    <span className="font-medium text-slate-800">{f.name}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-slate-500">
                        Custo: {formatBRL(f.cost)}
                      </span>
                      <button
                        onClick={() => removeFinishing(f.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remover Acabamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Nenhum acabamento adicional selecionado. Refile padrão incluso.
              </p>
            )}

            {/* Add new finishing row */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 items-center">
              <input
                type="text"
                placeholder="Nome do acabamento (Ex: Vinco, Furo, Espiral)"
                value={newFinishingName}
                onChange={(e) => setNewFinishingName(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">R$ Custo:</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newFinishingCost}
                  onChange={(e) => setNewFinishingCost(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <button
                type="button"
                onClick={addFinishing}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
          </div>

          {/* Observations */}
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observações / Instruções para Produção
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções de corte, cores especiais, arquivo enviado via e-mail ou pendrive..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Right Column: Sheet Imposition & Pricing Engine (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Visual Imposition Preview */}
          <SheetImpositionViewer
            itemWidthMm={widthMm}
            itemHeightMm={heightMm}
            sheetFormat={sheetFormat}
            quantity={quantity}
          />

          {/* Cost Breakdown & Pricing Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  4. Engenharia de Custo Real
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                Quebra Técnica: {wastePercent}%
              </span>
            </div>

            {costCalculation && (
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>
                    Substrato (
                    {sheetFormat === 'Bobina_m2'
                      ? `${costCalculation.totalSheetsToConsume} m²`
                      : `${costCalculation.totalSheetsToConsume} folhas`}
                    )
                  </span>
                  <span className="font-mono tabular-nums text-slate-900 font-semibold">
                    {formatBRL(costCalculation.materialCost)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Cliques & Tintas</span>
                  <span className="font-mono tabular-nums text-slate-900 font-semibold">
                    {formatBRL(costCalculation.printClickCost)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Acabamentos & Pós-impressão</span>
                  <span className="font-mono tabular-nums text-slate-900 font-semibold">
                    {formatBRL(costCalculation.finishingsCost)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Depreciação de Máquina & Mão de Obra</span>
                  <span className="font-mono tabular-nums text-slate-900 font-semibold">
                    {formatBRL(costCalculation.laborAndDepreciationCost)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline font-bold">
                  <span className="text-slate-900">Custo Total de Produção:</span>
                  <div className="text-right">
                    <span className="text-base font-mono text-slate-900">
                      {formatBRL(costCalculation.totalProductionCost)}
                    </span>
                    <div className="text-[11px] font-mono text-slate-500 font-normal">
                      Custo Unitário: {formatBRL(costCalculation.unitProductionCost)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Selling Price Multipliers */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-amber-500" />
                  Margem de Lucro (Markup):
                </label>
                <span className="text-sm font-bold font-mono text-amber-600">
                  {markupPercent}%
                </span>
              </div>

              <input
                type="range"
                min="30"
                max="300"
                step="5"
                value={markupPercent}
                onChange={(e) => {
                  setMarkupPercent(parseInt(e.target.value) || 100);
                  setCustomPrice(null); // Reset manual price override
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />

              {costCalculation && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMarkupPercent(costCalculation.suggestedPrices.minMargin.markup);
                      setCustomPrice(null);
                    }}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      markupPercent === costCalculation.suggestedPrices.minMargin.markup
                        ? 'border-amber-500 bg-amber-50/60'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">
                      Competitivo
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-800">
                      {formatBRL(costCalculation.suggestedPrices.minMargin.price)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      +{costCalculation.suggestedPrices.minMargin.markup}%
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMarkupPercent(costCalculation.suggestedPrices.recommended.markup);
                      setCustomPrice(null);
                    }}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      markupPercent === costCalculation.suggestedPrices.recommended.markup
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[10px] text-amber-600 font-bold uppercase flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Recomendado
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-900">
                      {formatBRL(costCalculation.suggestedPrices.recommended.price)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      +{costCalculation.suggestedPrices.recommended.markup}%
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMarkupPercent(costCalculation.suggestedPrices.premium.markup);
                      setCustomPrice(null);
                    }}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      markupPercent === costCalculation.suggestedPrices.premium.markup
                        ? 'border-amber-500 bg-amber-50/60'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">
                      Alta Margem
                    </div>
                    <div className="text-xs font-bold font-mono text-slate-800">
                      {formatBRL(costCalculation.suggestedPrices.premium.price)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      +{costCalculation.suggestedPrices.premium.markup}%
                    </div>
                  </button>
                </div>
              )}

              {/* Total Final Highlight */}
              <div className="bg-slate-900 text-white p-4 rounded-xl mt-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                    Preço Sugerido de Venda
                  </span>
                  <span className="text-xs font-mono text-emerald-400">
                    Lucro Bruto: {formatBRL(profitEstimate)}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <div className="text-2xl font-black font-mono text-white tabular-nums">
                    {formatBRL(activeTotalPrice)}
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    {formatBRL(activeUnitPrice)} / unidade
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAsQuote}
                  className="px-4 py-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer text-center"
                >
                  Salvar Orçamento
                </button>

                <button
                  type="button"
                  onClick={handleConvertToProduction}
                  className="px-4 py-3 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  Gerar Pedido (OS)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
