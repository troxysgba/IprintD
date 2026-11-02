import React, { useState, useMemo } from 'react';
import { Equipment, Material, Order, QuickProductPreset, SheetType } from '../types';
import {
  calculateOrderCost,
  formatBRL,
  formatPrintSides,
  generateWhatsAppLink,
  generateWhatsAppMessage,
} from '../utils/calculator';
import {
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  ExternalLink,
  Layers,
  MessageSquare,
  Pencil,
  Plus,
  Printer,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react';

interface GerarPedidoModalProps {
  materials: Material[];
  equipments: Equipment[];
  presets: QuickProductPreset[];
  initialOrderData?: Partial<Order> | null;
  onAddPreset: (preset: QuickProductPreset) => void;
  onUpdatePreset: (preset: QuickProductPreset) => void;
  onDeletePreset: (presetId: string) => void;
  onSaveOrder: (order: Order) => void;
  onClose: () => void;
}

export const GerarPedidoModal: React.FC<GerarPedidoModalProps> = ({
  materials,
  equipments,
  presets,
  initialOrderData,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset,
  onSaveOrder,
  onClose,
}) => {
  // 1. Dados do Cliente e Entrega
  const [clientName, setClientName] = useState(initialOrderData?.clientName || '');
  const [clientPhone, setClientPhone] = useState(initialOrderData?.clientPhone || '');
  const [hasDelivery, setHasDelivery] = useState<boolean>(
    initialOrderData?.hasDelivery || false
  );
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    initialOrderData?.deliveryAddress || ''
  );

  // 2. Produto e Especificações em Centímetros (cm)
  const [productName, setProductName] = useState(
    initialOrderData?.productName || 'Cartão de Visita 9x5 cm Couché 300g'
  );
  const [quantity, setQuantity] = useState<number>(initialOrderData?.quantity || 1000);
  const [widthCm, setWidthCm] = useState<number>(initialOrderData?.widthCm || 9);
  const [heightCm, setHeightCm] = useState<number>(initialOrderData?.heightCm || 5);
  const [printSides, setPrintSides] = useState<'4x0' | '4x4' | '1x0' | '1x1'>(
    initialOrderData?.printSides || '4x4'
  );
  const [notes, setNotes] = useState(initialOrderData?.notes || '');

  // Aproveitamento de folha / mídia
  const [sheetType, setSheetType] = useState<SheetType>(
    initialOrderData?.sheetType || 'a4'
  );
  const [rollWidthCm, setRollWidthCm] = useState<number>(
    initialOrderData?.rollWidthCm || 60
  );

  // 3. Material e Máquina
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    initialOrderData?.materialId || materials[0]?.id || ''
  );
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(
    initialOrderData?.equipmentId || equipments[0]?.id || ''
  );

  // 4. Preço e Margem
  const [markupPercent, setMarkupPercent] = useState<number>(120);
  const [customFinalPrice, setCustomFinalPrice] = useState<number | null>(
    initialOrderData?.finalPrice ?? null
  );

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // State for Managing Quick Presets Modals
  const [isNewPresetOpen, setIsNewPresetOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<QuickProductPreset | null>(null);
  const [presetToDelete, setPresetToDelete] = useState<QuickProductPreset | null>(null);
  const [isManagePresetsOpen, setIsManagePresetsOpen] = useState(false);

  // Form state for New Preset
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetWidthCm, setNewPresetWidthCm] = useState<number>(9);
  const [newPresetHeightCm, setNewPresetHeightCm] = useState<number>(5);
  const [newPresetSides, setNewPresetSides] = useState<'4x0' | '4x4' | '1x0' | '1x1'>('4x4');
  const [newPresetQty, setNewPresetQty] = useState<number>(1000);
  const [newPresetMaterialKeyword, setNewPresetMaterialKeyword] = useState('300g');
  const [newPresetEquipmentId, setNewPresetEquipmentId] = useState<string>(
    equipments[0]?.id || ''
  );

  // Form state for Editing Preset
  const [editPresetLabel, setEditPresetLabel] = useState('');
  const [editPresetName, setEditPresetName] = useState('');
  const [editPresetWidthCm, setEditPresetWidthCm] = useState<number>(9);
  const [editPresetHeightCm, setEditPresetHeightCm] = useState<number>(5);
  const [editPresetSides, setEditPresetSides] = useState<'4x0' | '4x4' | '1x0' | '1x1'>('4x4');
  const [editPresetQty, setEditPresetQty] = useState<number>(1000);
  const [editPresetMaterialKeyword, setEditPresetMaterialKeyword] = useState('300g');
  const [editPresetEquipmentId, setEditPresetEquipmentId] = useState<string>(
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

  // Sincroniza com dados enviados pelo cálculo de custo
  React.useEffect(() => {
    if (initialOrderData) {
      if (initialOrderData.clientName) setClientName(initialOrderData.clientName);
      if (initialOrderData.clientPhone) setClientPhone(initialOrderData.clientPhone);
      if (initialOrderData.productName) setProductName(initialOrderData.productName);
      if (initialOrderData.quantity) setQuantity(initialOrderData.quantity);
      if (initialOrderData.widthCm) setWidthCm(initialOrderData.widthCm);
      if (initialOrderData.heightCm) setHeightCm(initialOrderData.heightCm);
      if (initialOrderData.printSides) setPrintSides(initialOrderData.printSides);
      if (initialOrderData.sheetType) setSheetType(initialOrderData.sheetType);
      if (initialOrderData.rollWidthCm) setRollWidthCm(initialOrderData.rollWidthCm);
      if (initialOrderData.materialId) setSelectedMaterialId(initialOrderData.materialId);
      if (initialOrderData.equipmentId) setSelectedEquipmentId(initialOrderData.equipmentId);
      if (initialOrderData.hasDelivery !== undefined) setHasDelivery(initialOrderData.hasDelivery);
      if (initialOrderData.deliveryAddress) setDeliveryAddress(initialOrderData.deliveryAddress);
      if (initialOrderData.markupPercent) setMarkupPercent(initialOrderData.markupPercent);
      if (initialOrderData.finalPrice) setCustomFinalPrice(initialOrderData.finalPrice);
    }
  }, [initialOrderData]);

  // Cost and Suggested Price Calculation in Real Time with Centimeters
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

  const basePrice = useMemo(() => {
    if (customFinalPrice !== null) return customFinalPrice;
    return (
      costResult?.suggestedPrices.recommended.basePrice ??
      costResult?.suggestedPrices.recommended.price ??
      0
    );
  }, [customFinalPrice, costResult]);

  // Se for para entregar, acrescenta R$ 7 reais no preço final do produto
  const activeTotalPrice = useMemo(() => {
    return Number((basePrice + (hasDelivery ? 7 : 0)).toFixed(2));
  }, [basePrice, hasDelivery]);

  const activeUnitPrice = useMemo(() => {
    return quantity > 0 ? Number((activeTotalPrice / quantity).toFixed(3)) : 0;
  }, [activeTotalPrice, quantity]);

  // Apply preset to current order
  const applyPreset = (preset: QuickProductPreset) => {
    setProductName(preset.name);
    setWidthCm(preset.widthCm);
    setHeightCm(preset.heightCm);
    setPrintSides(preset.printSides);
    setQuantity(preset.quantity);
    setCustomFinalPrice(null);

    // Auto-select material based on keyword
    const matchedMat = materials.find((m) =>
      m.name.toLowerCase().includes(preset.materialKeyword.toLowerCase())
    );
    if (matchedMat) setSelectedMaterialId(matchedMat.id);

    // Auto-select equipment based on preset equipmentId or fallback
    if (preset.equipmentId && equipments.some((e) => e.id === preset.equipmentId)) {
      setSelectedEquipmentId(preset.equipmentId);
    } else if (preset.isPlotter) {
      const plotter = equipments.find((e) => e.category === 'plotter');
      if (plotter) setSelectedEquipmentId(plotter.id);
    } else if (equipments[0]) {
      setSelectedEquipmentId(equipments[0].id);
    }
  };

  // WhatsApp text representation
  const whatsAppText = useMemo(() => {
    return generateWhatsAppMessage({
      clientName,
      productName,
      quantity,
      widthCm,
      heightCm,
      printSides,
      materialName: selectedMaterial?.name || 'Padrão',
      totalPrice: activeTotalPrice,
      unitPrice: activeUnitPrice,
      basePrice,
      hasDelivery,
      deliveryFee: 7,
      deliveryAddress,
      notes,
    });
  }, [
    clientName,
    productName,
    quantity,
    widthCm,
    heightCm,
    printSides,
    selectedMaterial,
    activeTotalPrice,
    activeUnitPrice,
    basePrice,
    hasDelivery,
    deliveryAddress,
    notes,
  ]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openWhatsAppDirect = () => {
    const link = generateWhatsAppLink(clientPhone, whatsAppText);
    try {
      const opened = window.open(link, '_blank', 'noopener,noreferrer');
      if (!opened) {
        window.location.href = link;
      }
    } catch {
      window.location.href = link;
    }
  };

  // Preset Handlers
  const handleStartEditPreset = (preset: QuickProductPreset) => {
    setEditingPreset(preset);
    setEditPresetLabel(preset.label);
    setEditPresetName(preset.name);
    setEditPresetWidthCm(preset.widthCm);
    setEditPresetHeightCm(preset.heightCm);
    setEditPresetSides(preset.printSides);
    setEditPresetQty(preset.quantity);
    setEditPresetMaterialKeyword(preset.materialKeyword);
    setEditPresetEquipmentId(preset.equipmentId || equipments[0]?.id || '');
  };

  const handleSaveNewPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetLabel.trim() || !newPresetName.trim()) return;

    const chosenEqId = newPresetEquipmentId || equipments[0]?.id || '';
    const selectedEq = equipments.find((eq) => eq.id === chosenEqId);

    const newPreset: QuickProductPreset = {
      id: `preset_${Date.now()}`,
      label: newPresetLabel.trim(),
      name: newPresetName.trim(),
      widthCm: Number(newPresetWidthCm) || 9,
      heightCm: Number(newPresetHeightCm) || 5,
      printSides: newPresetSides,
      quantity: Number(newPresetQty) || 1000,
      materialKeyword: newPresetMaterialKeyword.trim() || 'Couché',
      equipmentId: chosenEqId,
      isPlotter: selectedEq?.category === 'plotter',
    };

    onAddPreset(newPreset);
    setIsNewPresetOpen(false);
    setNewPresetLabel('');
    setNewPresetName('');
  };

  const handleSaveEditPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset || !editPresetLabel.trim() || !editPresetName.trim()) return;

    const chosenEqId = editPresetEquipmentId || equipments[0]?.id || '';
    const selectedEq = equipments.find((eq) => eq.id === chosenEqId);

    const updated: QuickProductPreset = {
      ...editingPreset,
      label: editPresetLabel.trim(),
      name: editPresetName.trim(),
      widthCm: Number(editPresetWidthCm) || 9,
      heightCm: Number(editPresetHeightCm) || 5,
      printSides: editPresetSides,
      quantity: Number(editPresetQty) || 1000,
      materialKeyword: editPresetMaterialKeyword.trim() || 'Couché',
      equipmentId: chosenEqId,
      isPlotter: selectedEq?.category === 'plotter',
    };

    onUpdatePreset(updated);
    setEditingPreset(null);
  };

  const handleConfirmDeletePreset = () => {
    if (presetToDelete) {
      onDeletePreset(presetToDelete.id);
      setPresetToDelete(null);
    }
  };

  // Save handler for Order / Budget
  const handleSave = (type: 'pedido' | 'orcamento') => {
    const isEditing = Boolean(initialOrderData?.id);
    const prefix = type === 'pedido' ? 'OS' : 'ORC';
    const code = initialOrderData?.code || `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: initialOrderData?.id || `ord_${Date.now()}`,
      code,
      type,
      clientName: clientName.trim() || 'Cliente Balcão',
      clientPhone: clientPhone.trim() || '',
      createdAt: initialOrderData?.createdAt || new Date().toISOString(),
      deadline: initialOrderData?.deadline || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      status: initialOrderData?.status || (type === 'pedido' ? 'em_producao' : 'orcamento'),
      paymentStatus: initialOrderData?.paymentStatus || 'pendente',
      paymentMethod: initialOrderData?.paymentMethod || 'pix',
      productName: productName.trim() || 'Serviço Gráfico',
      quantity,
      widthCm,
      heightCm,
      printSides,
      materialId: selectedMaterial?.id || '',
      materialName: selectedMaterial?.name || '',
      equipmentId: selectedEquipment?.id || '',
      equipmentName: selectedEquipment?.name || '',
      sheetType,
      rollWidthCm: sheetType === 'bobina' ? rollWidthCm : undefined,
      linearMetersNeeded: costResult?.linearMetersNeeded,
      itemsPerSheet: costResult?.itemsPerSheet || 1,
      sheetsNeeded: costResult?.sheetsNeeded || 0,
      wasteSheets: costResult?.wasteSheets || 0,
      materialCost: costResult?.materialCost || 0,
      clickCost: costResult?.clickCost || 0,
      machineLaborCost: costResult?.machineLaborCost || 0,
      inkCost: costResult?.inkCost || 0,
      inkPercent: costResult?.inkPercent ?? selectedEquipment?.inkPercent ?? 3,
      depreciationCost: costResult?.depreciationCost || 0,
      depreciationPercent: costResult?.depreciationPercent ?? selectedEquipment?.depreciationPercent ?? 10,
      totalCost: costResult?.totalCost || 0,
      suggestedPrice: costResult?.suggestedPrices.recommended.price || activeTotalPrice,
      finalPrice: activeTotalPrice,
      unitPrice: activeUnitPrice,
      hasDelivery,
      deliveryFee: hasDelivery ? 7 : 0,
      deliveryAddress: hasDelivery ? deliveryAddress.trim() : undefined,
      notes: notes.trim(),
      stockDeducted: initialOrderData?.stockDeducted || false,
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
                {initialOrderData?.id
                  ? `Editar ${initialOrderData.type === 'pedido' ? 'Pedido' : 'Orçamento'} (${initialOrderData.code})`
                  : 'Gerar Pedido / Orçamento'}
              </h2>
              <p className="text-xs text-slate-400">
                {initialOrderData?.id
                  ? 'Atualize dados, dimensões em cm, materiais ou valores.'
                  : 'Cadastro rápido, cálculo em centímetros (cm) e envio para o WhatsApp'}
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
          {/* Quick Presets Section in CM with Add, Edit and Delete */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Modelos Rápidos (1-Clique)
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                  {presets.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsManagePresetsOpen(true)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="Gerenciar lista de modelos rápidos"
                >
                  <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                  <span>Gerenciar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewPresetOpen(true)}
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                  title="Cadastrar novo modelo rápido"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Novo Modelo</span>
                </button>
              </div>
            </div>

            {/* Presets Badges with 1-Click apply, inline Edit and Delete */}
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <div
                  key={p.id}
                  className="group inline-flex items-center bg-white border border-slate-200 hover:border-amber-400 rounded-lg overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-amber-950 hover:bg-amber-50/80 transition-colors cursor-pointer text-left flex items-center gap-1"
                    title={`Aplicar ${p.name} (${p.widthCm}x${p.heightCm} cm)`}
                  >
                    <span>{p.label}</span>
                  </button>
                  <div className="flex items-center border-l border-slate-100 bg-slate-50/70 px-1 py-1 gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditPreset(p);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-100/60 rounded cursor-pointer transition-colors"
                      title={`Editar modelo "${p.label}"`}
                    >
                      <Pencil className="w-2.5 h-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPresetToDelete(p);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 rounded cursor-pointer transition-colors"
                      title={`Excluir modelo "${p.label}"`}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
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

                {/* Opção: Fazer entrega ou não (+ R$ 7,00 se for para entregar) */}
                <div className="pt-2.5 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-amber-600" />
                      <span>É para fazer entrega?</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {hasDelivery ? 'Taxa: + R$ 7,00 no preço final' : 'Retirada no balcão (grátis)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Opção Não (Retirada Balcão) */}
                    <button
                      type="button"
                      onClick={() => setHasDelivery(false)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        !hasDelivery
                          ? 'bg-white border-slate-900 ring-2 ring-slate-900/10 text-slate-900 shadow-2xs font-semibold'
                          : 'bg-white/60 hover:bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          🏪 Não (Retirada Balcão)
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Cliente retira na loja</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Grátis
                      </span>
                    </button>

                    {/* Opção Sim (Fazer Entrega) */}
                    <button
                      type="button"
                      onClick={() => setHasDelivery(true)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        hasDelivery
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/30 text-slate-900 shadow-2xs font-semibold'
                          : 'bg-white/60 hover:bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          🚚 Sim (Fazer Entrega)
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Motoboy / Envio</p>
                      </div>
                      <span className="text-[10px] font-mono font-black text-amber-950 bg-amber-200/90 px-2 py-0.5 rounded border border-amber-300">
                        + R$ 7,00
                      </span>
                    </button>
                  </div>

                  {/* Endereço de Entrega */}
                  {hasDelivery && (
                    <div className="pt-1.5 animate-in fade-in duration-150">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Endereço para Entrega:
                      </label>
                      <input
                        type="text"
                        placeholder="Rua, número, bairro, complemento ou ponto de referência..."
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Especificação do Produto em Centímetros (cm) */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      2. Especificações do Trabalho
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Medidas em cm
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Descrição do Item
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {/* Seletor de Aproveitamento de Folha / Bobina */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Formato de Aproveitamento da Folha / Mídia:
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">
                      {sheetType === 'bobina' ? `Rolo ${rollWidthCm} cm` : sheetType.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'a4', label: 'A4', desc: '21×29,7 cm' },
                      { id: 'a3', label: 'A3', desc: '29,7×42 cm' },
                      { id: 'bobina', label: 'Bobina', desc: 'Rolo cm' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSheetType(f.id as SheetType)}
                        className={`px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                          sheetType === f.id
                            ? 'bg-amber-100 border-amber-400 text-slate-900 font-bold ring-1 ring-amber-400/50'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold">{f.label}</span>
                          <span className="text-[9px] font-mono opacity-80">{f.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {sheetType === 'bobina' && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-300 rounded-lg flex flex-wrap items-center justify-between gap-2 mt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">Largura da Bobina:</span>
                        <input
                          type="number"
                          min="10"
                          max="320"
                          value={rollWidthCm}
                          onChange={(e) =>
                            setRollWidthCm(
                              Math.max(10, Math.min(320, parseFloat(e.target.value) || 10))
                            )
                          }
                          className="w-16 px-2 py-0.5 text-xs font-mono font-bold bg-white border border-amber-400 rounded text-center"
                        />
                        <span className="text-xs font-bold text-slate-600">cm</span>
                      </div>

                      <div className="flex gap-1">
                        {[30, 60, 90, 100, 120, 160].map((w) => (
                          <button
                            key={w}
                            type="button"
                            onClick={() => setRollWidthCm(w)}
                            className={`px-1.5 py-0.5 text-[10px] font-mono rounded border cursor-pointer ${
                              rollWidthCm === w
                                ? 'bg-amber-400 text-slate-950 font-bold border-amber-500'
                                : 'bg-white text-slate-600 border-amber-200'
                            }`}
                          >
                            {w}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 text-sm font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Largura (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={widthCm}
                      onChange={(e) => setWidthCm(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 text-sm font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={heightCm}
                      onChange={(e) => setHeightCm(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 text-sm font-mono bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Cores / Lados
                    </label>
                    <select
                      value={printSides}
                      onChange={(e) => setPrintSides(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="4x0">FRENTE, COLORIDA</option>
                      <option value="4x4">FRENTE & VERSO, COLORIDA</option>
                      <option value="1x0">FRENTE, PRETO & BRANCO</option>
                      <option value="1x1">FRENTE & VERSO, PRETO & BRANCO</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Observações de Acabamento / Produção
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Laminação fosca frente e verso, refile e cantos arredondados..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* 3. Matéria-Prima e Equipamento */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    3. Matéria-Prima & Equipamento
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Papel / Substrato
                    </label>
                    <select
                      value={selectedMaterialId}
                      onChange={(e) => setSelectedMaterialId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.widthCm && m.heightCm ? `${m.widthCm}x${m.heightCm} cm - ` : ''}
                          {formatBRL(m.costPerUnit)}/{m.unit})
                        </option>
                      ))}
                    </select>
                    {selectedMaterial && (
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>
                          Saldo em estoque: {selectedMaterial.currentStock} {selectedMaterial.unit}s
                        </span>
                        {selectedMaterial.currentStock <= selectedMaterial.minStock && (
                          <span className="text-amber-700 font-bold">Estoque Baixo!</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Equipamento de Impressão
                    </label>
                    <select
                      value={selectedEquipmentId}
                      onChange={(e) => setSelectedEquipmentId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      {equipments.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.name}
                        </option>
                      ))}
                    </select>
                    {selectedEquipment && (
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-2">
                        <span>Clique color: {formatBRL(selectedEquipment.clickCostColor)}</span>
                        <span>· Vel: {selectedEquipment.speedPerHour} un/h</span>
                        <span className="text-sky-700 font-semibold">· Tinta: {selectedEquipment.inkPercent ?? 3}%</span>
                        <span className="text-indigo-700 font-semibold">· Depr: {selectedEquipment.depreciationPercent ?? 10}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Aproveitamento em Centímetros */}
                {costResult && (
                  <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-amber-900">
                        {sheetType === 'bobina'
                          ? `${costResult.itemsPerSheet} peças por fila (Bobina ${rollWidthCm}cm)`
                          : `${costResult.itemsPerSheet} peças por folha ${sheetType.toUpperCase()}`}
                      </span>
                      <span className="text-amber-700 ml-1">
                        ({costResult.nestingOrientation})
                      </span>
                    </div>
                    <div className="text-amber-900 font-mono font-bold">
                      {sheetType === 'bobina'
                        ? `${costResult.linearMetersNeeded} m lineares (${costResult.totalRollM2} m²)`
                        : `${costResult.totalSheetsToConsume} folhas necessárias`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Preços Sugeridos & WhatsApp (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Preços Sugeridos em Tempo Real */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Preços Sugeridos</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Custo Total: {formatBRL(costResult?.totalCost || 0)}
                  </span>
                </div>

                {costResult && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {/* Econômico */}
                      <button
                        type="button"
                        onClick={() => {
                          setMarkupPercent(costResult.suggestedPrices.min.markup);
                          setCustomFinalPrice(null);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          markupPercent === costResult.suggestedPrices.min.markup && customFinalPrice === null
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                          Econômico
                        </div>
                        <div className="text-sm font-black font-mono mt-0.5">
                          {formatBRL(costResult.suggestedPrices.min.price)}
                        </div>
                        <div className="text-[10px] opacity-75 mt-0.5">
                          +{costResult.suggestedPrices.min.markup}% margem
                        </div>
                      </button>

                      {/* Recomendado */}
                      <button
                        type="button"
                        onClick={() => {
                          setMarkupPercent(costResult.suggestedPrices.recommended.markup);
                          setCustomFinalPrice(null);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                          markupPercent === costResult.suggestedPrices.recommended.markup && customFinalPrice === null
                            ? 'border-amber-500 bg-amber-500 text-slate-950 font-bold'
                            : 'border-amber-200 hover:border-amber-400 bg-amber-50/50'
                        }`}
                      >
                        <div className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                          Recomendado
                        </div>
                        <div className="text-sm font-black font-mono mt-0.5">
                          {formatBRL(costResult.suggestedPrices.recommended.price)}
                        </div>
                        <div className="text-[10px] opacity-80 mt-0.5">
                          +{costResult.suggestedPrices.recommended.markup}% margem
                        </div>
                      </button>

                      {/* Alta Margem */}
                      <button
                        type="button"
                        onClick={() => {
                          setMarkupPercent(costResult.suggestedPrices.premium.markup);
                          setCustomFinalPrice(null);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          markupPercent === costResult.suggestedPrices.premium.markup && customFinalPrice === null
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                        }`}
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                          Alta Margem
                        </div>
                        <div className="text-sm font-black font-mono mt-0.5">
                          {formatBRL(costResult.suggestedPrices.premium.price)}
                        </div>
                        <div className="text-[10px] opacity-75 mt-0.5">
                          +{costResult.suggestedPrices.premium.markup}% margem
                        </div>
                      </button>
                    </div>

                    {/* Atalhos Rápidos de Margem no Modal */}
                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Margem:</span>
                      {[30, 50, 70, 100, 120, 150, 200].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setMarkupPercent(m);
                            setCustomFinalPrice(null);
                          }}
                          className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded transition-all cursor-pointer ${
                            markupPercent === m && customFinalPrice === null
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {m}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Indicador de Entrega na Composição do Preço */}
                {hasDelivery && (
                  <div className="flex items-center justify-between text-xs text-amber-900 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Truck className="w-3.5 h-3.5 text-amber-600" />
                      Taxa de Entrega Adicional:
                    </span>
                    <span className="font-mono font-black text-amber-900">+ R$ 7,00</span>
                  </div>
                )}

                {/* Preço de Venda Final Customizável */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block">
                        Valor do Pedido:
                      </label>
                      <span className="text-[10px] text-slate-400">
                        Preço baseado na margem de lucro ou valor personalizado
                      </span>
                    </div>

                    <div className="relative w-36">
                      <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={basePrice > 0 ? basePrice.toFixed(2) : ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setCustomFinalPrice(isNaN(val) ? 0 : val);
                        }}
                        className="w-full pl-8 pr-2 py-1.5 text-sm font-mono font-bold text-right bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-900"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-xl shadow-xs">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Total Final a Cobrar:
                      </div>
                      <div className="text-[10px] text-slate-300 font-mono">
                        Base ({formatBRL(basePrice)}){hasDelivery ? ' + Entrega (R$ 7)' : ''}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-black font-mono text-white tabular-nums">
                        {formatBRL(activeTotalPrice)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Unitário: {formatBRL(activeUnitPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gerador de Orçamento para Copiar e Mandar pelo WhatsApp */}
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>Orçamento para WhatsApp</span>
                  </div>
                  {copied && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copiado!
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
              {initialOrderData?.id
                ? initialOrderData.type === 'orcamento'
                  ? 'Salvar Alterações'
                  : 'Salvar como Orçamento'
                : 'Salvar como Orçamento'}
            </button>

            <button
              type="button"
              onClick={() => handleSave('pedido')}
              className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>
                {initialOrderData?.id
                  ? initialOrderData.type === 'pedido'
                    ? 'Salvar Alterações do Pedido'
                    : 'Converter em Pedido (OS)'
                  : 'Gerar Pedido (OS)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-MODAL 1: Adicionar Novo Modelo Rápido */}
      {isNewPresetOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-500" />
                  <span>Novo Modelo Rápido</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Crie um botão de 1-clique com medidas em centímetros (cm).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPresetOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPreset} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Rótulo do Botão *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cartão 9x5 cm, Crachá 6x9 cm, Banner 80x120 cm"
                  value={newPresetLabel}
                  onChange={(e) => setNewPresetLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nome Completo do Produto (OS / Orçamento) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cartão de Visita 9x5 cm Couché 300g 4x4"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Largura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={newPresetWidthCm}
                    onChange={(e) => setNewPresetWidthCm(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={newPresetHeightCm}
                    onChange={(e) => setNewPresetHeightCm(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cores / Lados</label>
                  <select
                    value={newPresetSides}
                    onChange={(e) => setNewPresetSides(e.target.value as any)}
                    className="w-full px-3 py-2 font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="4x0">FRENTE, COLORIDA</option>
                    <option value="4x4">FRENTE & VERSO, COLORIDA</option>
                    <option value="1x0">FRENTE, PRETO & BRANCO</option>
                    <option value="1x1">FRENTE & VERSO, PRETO & BRANCO</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tiragem Padrão</label>
                  <input
                    type="number"
                    min="1"
                    value={newPresetQty}
                    onChange={(e) => setNewPresetQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Palavra-Chave do Material
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 300g, 150g, Lona, Vinil, Offset"
                    value={newPresetMaterialKeyword}
                    onChange={(e) => setNewPresetMaterialKeyword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Impressora / Equipamento *
                  </label>
                  <select
                    value={newPresetEquipmentId}
                    onChange={(e) => setNewPresetEquipmentId(e.target.value)}
                    className="w-full px-3 py-2 font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {equipments.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewPresetOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Salvar Modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: Editar Modelo Rápido */}
      {editingPreset && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-500" />
                  <span>Editar Modelo Rápido</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atualize as medidas em centímetros (cm), tiragem e vínculo de material.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPreset(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPreset} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Rótulo do Botão *
                </label>
                <input
                  type="text"
                  required
                  value={editPresetLabel}
                  onChange={(e) => setEditPresetLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nome Completo do Produto (OS / Orçamento) *
                </label>
                <input
                  type="text"
                  required
                  value={editPresetName}
                  onChange={(e) => setEditPresetName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Largura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={editPresetWidthCm}
                    onChange={(e) => setEditPresetWidthCm(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    required
                    value={editPresetHeightCm}
                    onChange={(e) => setEditPresetHeightCm(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Cores / Lados</label>
                  <select
                    value={editPresetSides}
                    onChange={(e) => setEditPresetSides(e.target.value as any)}
                    className="w-full px-3 py-2 font-semibold bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="4x0">FRENTE, COLORIDA</option>
                    <option value="4x4">FRENTE & VERSO, COLORIDA</option>
                    <option value="1x0">FRENTE, PRETO & BRANCO</option>
                    <option value="1x1">FRENTE & VERSO, PRETO & BRANCO</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tiragem Padrão</label>
                  <input
                    type="number"
                    min="1"
                    value={editPresetQty}
                    onChange={(e) => setEditPresetQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Palavra-Chave do Material
                  </label>
                  <input
                    type="text"
                    value={editPresetMaterialKeyword}
                    onChange={(e) => setEditPresetMaterialKeyword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Impressora / Equipamento *
                  </label>
                  <select
                    value={editPresetEquipmentId}
                    onChange={(e) => setEditPresetEquipmentId(e.target.value)}
                    className="w-full px-3 py-2 font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    {equipments.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPreset(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: Confirmação de Exclusão de Modelo Rápido */}
      {presetToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir Modelo?</h3>
                <p className="text-xs text-slate-500">Remover botão de acesso rápido</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 my-4 text-xs space-y-1">
              <div className="font-bold text-slate-900">{presetToDelete.label}</div>
              <div className="text-slate-500 font-mono">
                {presetToDelete.widthCm}x{presetToDelete.heightCm} cm · {formatPrintSides(presetToDelete.printSides)} · {presetToDelete.quantity} un
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5">
              Tem certeza de que deseja excluir o modelo "{presetToDelete.label}"? Ele não aparecerá mais nos atalhos de 1-clique.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPresetToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePreset}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 4: Gerenciar Todos os Modelos Rápidos */}
      {isManagePresetsOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                  <span>Gerenciar Modelos Rápidos</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adicione novos produtos, altere medidas em centímetros (cm) ou exclua modelos existentes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPresetOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Novo Modelo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsManagePresetsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {presets.map((p) => {
                const assignedEq = equipments.find((e) => e.id === p.equipmentId);
                return (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">{p.label}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                          {p.widthCm} x {p.heightCm} cm
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                          {formatPrintSides(p.printSides)}
                        </span>
                        <span className="text-[10px] font-medium text-sky-800 bg-sky-50 border border-sky-200/60 px-2 py-0.5 rounded">
                          🖨️ {assignedEq ? assignedEq.name : 'Impressora Padrão'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {p.name} · Tiragem padrão: <span className="font-mono font-semibold">{p.quantity} un</span> · Material: {p.materialKeyword}
                      </div>
                    </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEditPreset(p)}
                      className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3 text-amber-600" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetToDelete(p)}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              );
            })}
            </div>

            <div className="pt-3 border-t border-slate-100 mt-4 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsManagePresetsOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
