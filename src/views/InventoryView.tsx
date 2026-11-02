import React, { useState } from 'react';
import { Material, MaterialCategory, StockMovement } from '../types';
import { formatBRL, formatDate } from '../utils/calculator';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  History,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

interface InventoryViewProps {
  materials: Material[];
  movements: StockMovement[];
  onAddMaterial: (material: Material) => void;
  onUpdateMaterial: (material: Material) => void;
  onDeleteMaterial: (materialId: string) => void;
  onRecordMovement: (
    materialId: string,
    type: 'entrada' | 'saida_manual' | 'ajuste',
    quantity: number,
    notes: string
  ) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  materials,
  movements,
  onAddMaterial,
  onUpdateMaterial,
  onDeleteMaterial,
  onRecordMovement,
}) => {
  const [tab, setTab] = useState<'saldos' | 'historico'>('saldos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isNewMatModalOpen, setIsNewMatModalOpen] = useState(false);

  // Edit material state
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Delete confirmation state
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  // Quick movement state
  const [selectedMatId, setSelectedMatId] = useState<string>(materials[0]?.id || '');
  const [movQty, setMovQty] = useState<number>(100);
  const [movType, setMovType] = useState<'entrada' | 'saida_manual' | 'ajuste'>('entrada');
  const [movNotes, setMovNotes] = useState('Compra de reposição');

  // New Material form state in centimeters
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState<MaterialCategory>('papel');
  const [newUnit, setNewUnit] = useState<Material['unit']>('folha');
  const [newWidthCm, setNewWidthCm] = useState(33);
  const [newHeightCm, setNewHeightCm] = useState(48);
  const [newGrammage, setNewGrammage] = useState(300);
  const [newStock, setNewStock] = useState(250);
  const [newMinStock, setNewMinStock] = useState(100);
  const [newCost, setNewCost] = useState(0.68);
  const [newSupplier, setNewSupplier] = useState('');

  // Edit Material form state in centimeters
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editCategory, setEditCategory] = useState<MaterialCategory>('papel');
  const [editUnit, setEditUnit] = useState<Material['unit']>('folha');
  const [editWidthCm, setEditWidthCm] = useState(33);
  const [editHeightCm, setEditHeightCm] = useState(48);
  const [editGrammage, setEditGrammage] = useState(300);
  const [editStock, setEditStock] = useState(250);
  const [editMinStock, setEditMinStock] = useState(100);
  const [editCost, setEditCost] = useState(0.68);
  const [editSupplier, setEditSupplier] = useState('');

  const filteredMaterials = materials.filter((m) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.supplier.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const lowStockCount = materials.filter((m) => m.currentStock <= m.minStock).length;
  const totalValue = materials.reduce((s, m) => s + m.currentStock * m.costPerUnit, 0);

  const handleQuickEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatId || movQty <= 0) return;
    onRecordMovement(selectedMatId, movType, movQty, movNotes);
    setIsEntryModalOpen(false);
    setMovQty(100);
  };

  const handleNewMatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMat: Material = {
      id: `mat_${Date.now()}`,
      code: newCode.trim() || `MAT-00${materials.length + 1}`,
      name: newName.trim(),
      category: newCategory,
      unit: newUnit,
      widthCm: newCategory === 'papel' ? newWidthCm : undefined,
      heightCm: newCategory === 'papel' ? newHeightCm : undefined,
      grammage: newCategory === 'papel' ? newGrammage : undefined,
      currentStock: Number(newStock) || 0,
      minStock: Number(newMinStock) || 0,
      costPerUnit: Number(newCost) || 0,
      supplier: newSupplier.trim() || 'Distribuidor',
    };

    onAddMaterial(newMat);
    setIsNewMatModalOpen(false);
    setNewName('');
    setNewCode('');
    setNewSupplier('');
  };

  const handleStartEdit = (mat: Material) => {
    setEditingMaterial(mat);
    setEditName(mat.name);
    setEditCode(mat.code);
    setEditCategory(mat.category);
    setEditUnit(mat.unit);
    setEditWidthCm(mat.widthCm ?? 33);
    setEditHeightCm(mat.heightCm ?? 48);
    setEditGrammage(mat.grammage ?? 300);
    setEditStock(mat.currentStock);
    setEditMinStock(mat.minStock);
    setEditCost(mat.costPerUnit);
    setEditSupplier(mat.supplier);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial || !editName.trim()) return;

    const updatedMat: Material = {
      ...editingMaterial,
      name: editName.trim(),
      code: editCode.trim() || editingMaterial.code,
      category: editCategory,
      unit: editUnit,
      widthCm: editCategory === 'papel' ? editWidthCm : undefined,
      heightCm: editCategory === 'papel' ? editHeightCm : undefined,
      grammage: editCategory === 'papel' ? editGrammage : undefined,
      currentStock: Number(editStock) || 0,
      minStock: Number(editMinStock) || 0,
      costPerUnit: Number(editCost) || 0,
      supplier: editSupplier.trim() || 'Distribuidor',
    };

    onUpdateMaterial(updatedMat);
    setEditingMaterial(null);
  };

  const handleConfirmDelete = () => {
    if (materialToDelete) {
      onDeleteMaterial(materialToDelete.id);
      setMaterialToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            Controle de Estoque & Matérias-Primas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Saldos em tempo real com formatos em centímetros (cm), baixa automática e histórico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEntryModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Dar Entrada (+)
          </button>
          <button
            onClick={() => setIsNewMatModalOpen(true)}
            className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Novo Insumo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total de Itens Cadastrados
          </div>
          <div className="text-xl font-black font-mono text-slate-900 mt-1">
            {materials.length} itens
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Papéis, bobinas e acabamentos</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Valor em Almoxarifado
          </div>
          <div className="text-xl font-black font-mono text-slate-900 mt-1 tabular-nums">
            {formatBRL(totalValue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Custo acumulado de matérias-primas</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Alertas de Estoque Baixo
          </div>
          <div className="text-xl font-black font-mono text-amber-600 mt-1">
            {lowStockCount} {lowStockCount === 1 ? 'insumo' : 'insumos'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Abaixo do limite mínimo</div>
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        {/* Tab switch and search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start">
            <button
              onClick={() => setTab('saldos')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                tab === 'saldos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Saldos Atuais ({materials.length})
            </button>
            <button
              onClick={() => setTab('historico')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                tab === 'historico' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Movimentações & Baixas ({movements.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por nome, código ou fornecedor..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {tab === 'saldos' ? (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Matéria-Prima / Papel</th>
                  <th className="p-3">Formato (cm) / Gramatura</th>
                  <th className="p-3 text-right">Custo Unitário</th>
                  <th className="p-3 text-right">Saldo Atual</th>
                  <th className="p-3 text-right">Estoque Mínimo</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaterials.map((mat) => {
                  const isLow = mat.currentStock <= mat.minStock;
                  return (
                    <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">{mat.code}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{mat.name}</div>
                        <div className="text-[11px] text-slate-400">{mat.supplier}</div>
                      </td>
                      <td className="p-3">
                        {mat.widthCm && mat.heightCm ? (
                          <span className="font-mono">
                            {mat.widthCm} x {mat.heightCm} cm {mat.grammage ? `· ${mat.grammage}g` : ''}
                          </span>
                        ) : (
                          <span className="capitalize text-slate-500">{mat.category}</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-800 tabular-nums">
                        {formatBRL(mat.costPerUnit)}/{mat.unit}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        <span className={isLow ? 'text-amber-700' : ''}>
                          {mat.currentStock} {mat.unit}
                        </span>
                        {isLow && (
                          <span className="block text-[10px] text-amber-700 font-bold">
                            Estoque Baixo
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500 tabular-nums">
                        {mat.minStock} {mat.unit}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedMatId(mat.id);
                              setMovType('entrada');
                              setIsEntryModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                            title="Lançar entrada rápida"
                          >
                            + Entrada
                          </button>
                          <button
                            onClick={() => handleStartEdit(mat)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded transition-colors cursor-pointer flex items-center gap-1"
                            title="Editar matéria-prima"
                          >
                            <Pencil className="w-3 h-3 text-amber-600" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => setMaterialToDelete(mat)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded transition-colors cursor-pointer flex items-center gap-1"
                            title="Excluir matéria-prima"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3">Data</th>
                  <th className="p-3">Operação</th>
                  <th className="p-3">Material</th>
                  <th className="p-3 text-right">Qtd</th>
                  <th className="p-3 text-right">Saldo</th>
                  <th className="p-3">OS / Observação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {movements.map((mov) => {
                  const isPositive = mov.type === 'entrada';
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-sans text-slate-500">{formatDate(mov.date)}</td>
                      <td className="p-3 font-sans">
                        {mov.type === 'entrada' && (
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                            Entrada
                          </span>
                        )}
                        {mov.type === 'consumo_os' && (
                          <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                            Baixa OS
                          </span>
                        )}
                        {mov.type === 'saida_manual' && (
                          <span className="font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded text-[10px]">
                            Saída
                          </span>
                        )}
                        {mov.type === 'ajuste' && (
                          <span className="font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded text-[10px]">
                            Ajuste
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-sans font-bold text-slate-800">{mov.materialName}</td>
                      <td
                        className={`p-3 text-right font-bold tabular-nums ${
                          isPositive ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isPositive ? '+' : '-'}
                        {mov.quantity}
                      </td>
                      <td className="p-3 text-right text-slate-500 tabular-nums">
                        {mov.previousStock} → {mov.newStock}
                      </td>
                      <td className="p-3 font-sans text-slate-600">
                        {mov.orderCode && (
                          <span className="font-bold text-slate-900 mr-1.5">{mov.orderCode}:</span>
                        )}
                        {mov.notes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Quick Stock Entry */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Lançamento Manual de Estoque
            </h3>

            <form onSubmit={handleQuickEntrySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Insumo</label>
                <select
                  value={selectedMatId}
                  onChange={(e) => setSelectedMatId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name} (Saldo: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tipo</label>
                  <select
                    value={movType}
                    onChange={(e) => setMovType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="entrada">Entrada (Compra)</option>
                    <option value="saida_manual">Saída Manual</option>
                    <option value="ajuste">Ajuste de Balanço</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={movQty}
                    onChange={(e) => setMovQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Motivo / NF de Compra</label>
                <input
                  type="text"
                  value={movNotes}
                  onChange={(e) => setMovNotes(e.target.value)}
                  placeholder="Ex: Compra NF 4820 Suzano Papéis"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Material in Centimeters */}
      {isNewMatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Cadastrar Nova Matéria-Prima
            </h3>

            <form onSubmit={handleNewMatSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nome do Insumo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Papel Couché 250g Fosco SRA3 (33x48 cm)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Código</label>
                  <input
                    type="text"
                    placeholder="PAP-008"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="papel">Papel em Folha</option>
                    <option value="adesivo">Adesivo Vinil</option>
                    <option value="lona">Lona / Banner</option>
                    <option value="acabamento">Acabamento</option>
                    <option value="tinta">Tinta / Toner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unidade</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="folha">Folha</option>
                    <option value="m2">m² (Metro)</option>
                    <option value="unidade">Unidade</option>
                    <option value="pct">Pacote</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Largura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWidthCm}
                    onChange={(e) => setNewWidthCm(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newHeightCm}
                    onChange={(e) => setNewHeightCm(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Custo Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={newCost}
                    onChange={(e) => setNewCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Fornecedor</label>
                <input
                  type="text"
                  placeholder="Ex: Suzano, Klabin, Imprimax..."
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewMatModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Matéria-Prima */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-500" />
                  <span>Editar Matéria-Prima</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atualize os parâmetros, medidas em centímetros e custos unitários.
                </p>
              </div>
              <button
                onClick={() => setEditingMaterial(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nome do Insumo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Papel Couché 300g Brilho SRA3 (33x48 cm)"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Código do Item</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Categoria</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="papel">Papel em Folha</option>
                    <option value="adesivo">Adesivo Vinil</option>
                    <option value="lona">Lona / Banner</option>
                    <option value="acabamento">Acabamento</option>
                    <option value="tinta">Tinta / Toner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unidade</label>
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="folha">Folha</option>
                    <option value="m2">m² (Metro)</option>
                    <option value="unidade">Unidade</option>
                    <option value="pct">Pacote</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Largura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editWidthCm}
                    onChange={(e) => setEditWidthCm(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Altura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editHeightCm}
                    onChange={(e) => setEditHeightCm(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {editCategory === 'papel' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Gramatura (g/m²)</label>
                  <input
                    type="number"
                    value={editGrammage}
                    onChange={(e) => setEditGrammage(parseInt(e.target.value) || 0)}
                    placeholder="Ex: 300"
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Custo Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={editCost}
                    onChange={(e) => setEditCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Saldo Atual</label>
                  <input
                    type="number"
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Fornecedor</label>
                <input
                  type="text"
                  placeholder="Ex: Suzano, Papirus, Imprimax..."
                  value={editSupplier}
                  onChange={(e) => setEditSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
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

      {/* Modal: Confirmação de Exclusão */}
      {materialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir Matéria-Prima?</h3>
                <p className="text-xs text-slate-500">Esta ação removerá o insumo do sistema.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 my-4 text-xs space-y-1">
              <div className="font-bold text-slate-900">{materialToDelete.name}</div>
              <div className="text-slate-500 flex items-center gap-2">
                <span className="font-mono font-semibold">{materialToDelete.code}</span>
                <span>•</span>
                <span>Saldo atual: {materialToDelete.currentStock} {materialToDelete.unit}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5">
              Tem certeza de que deseja excluir permanentemente este material? Pedidos antigos já salvos manterão seu histórico, mas o insumo não estará mais disponível para novos orçamentos.
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMaterialToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
