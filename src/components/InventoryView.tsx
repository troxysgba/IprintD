import React, { useState } from 'react';
import { Material, MaterialCategory, StockMovement } from '../types';
import { formatBRL, formatDateTime } from '../utils/calculator';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Clock,
  History,
  Plus,
  Search,
} from 'lucide-react';

interface InventoryViewProps {
  materials: Material[];
  movements: StockMovement[];
  onAddMaterial: (material: Material) => void;
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
  onRecordMovement,
}) => {
  const [tab, setTab] = useState<'estoque' | 'historico'>('estoque');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isNewMatModalOpen, setIsNewMatModalOpen] = useState(false);

  // Quick Entry state
  const [selectedMatId, setSelectedMatId] = useState<string>(materials[0]?.id || '');
  const [entryQty, setEntryQty] = useState<number>(100);
  const [entryNotes, setEntryNotes] = useState('Compra de reposição de estoque');
  const [entryType, setEntryType] = useState<'entrada' | 'saida_manual' | 'ajuste'>('entrada');

  // New Material form state
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState<MaterialCategory>('papel_folha');
  const [newUnit, setNewUnit] = useState<Material['unit']>('folha');
  const [newWidth, setNewWidth] = useState(330);
  const [newHeight, setNewHeight] = useState(480);
  const [newGrammage, setNewGrammage] = useState(300);
  const [newStock, setNewStock] = useState(250);
  const [newMinStock, setNewMinStock] = useState(100);
  const [newCost, setNewCost] = useState(0.65);
  const [newSupplier, setNewSupplier] = useState('');

  // Filtering materials
  const filteredMaterials = materials.filter((m) => {
    if (categoryFilter !== 'todos' && m.category !== categoryFilter) return false;
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

  const lowStockMaterials = materials.filter((m) => m.currentStock <= m.minStock);

  const totalInventoryValue = materials.reduce(
    (sum, m) => sum + m.currentStock * m.costPerUnit,
    0
  );

  const handleQuickEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatId || entryQty <= 0) return;
    onRecordMovement(selectedMatId, entryType, entryQty, entryNotes);
    setIsEntryModalOpen(false);
    setEntryQty(100);
  };

  const handleNewMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newMaterial: Material = {
      id: `mat_${Date.now()}`,
      code: newCode.trim() || `MAT-00${materials.length + 1}`,
      name: newName.trim(),
      category: newCategory,
      unit: newUnit,
      widthMm: newCategory === 'papel_folha' ? newWidth : undefined,
      heightMm: newCategory === 'papel_folha' ? newHeight : undefined,
      grammage: newCategory === 'papel_folha' ? newGrammage : undefined,
      currentStock: Number(newStock) || 0,
      minStock: Number(newMinStock) || 0,
      costPerUnit: Number(newCost) || 0,
      supplier: newSupplier.trim() || 'Distribuidor Padrão',
      lastPurchaseDate: new Date().toISOString().slice(0, 10),
    };

    onAddMaterial(newMaterial);
    setIsNewMatModalOpen(false);

    // Reset form
    setNewName('');
    setNewCode('');
    setNewSupplier('');
  };

  return (
    <div className="space-y-6">
      {/* Top Inventory Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total de Itens Cadastrados
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {materials.length} insumos
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Papéis, bobinas, acabamentos e tintas
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Valor Total em Estoque
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
            {formatBRL(totalInventoryValue)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Custo acumulado de matérias-primas
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Alertas de Estoque Baixo
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 mt-1 flex items-center gap-2">
            {lowStockMaterials.length}
            {lowStockMaterials.length > 0 && (
              <span className="text-xs font-sans font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                Necessita Reposição
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Itens abaixo ou no limite mínimo
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setTab('estoque')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                tab === 'estoque'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              Saldos de Insumos ({materials.length})
            </button>
            <button
              onClick={() => setTab('historico')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                tab === 'historico'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Histórico de Movimentações ({movements.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEntryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
              Dar Entrada / Movimentar
            </button>

            <button
              onClick={() => setIsNewMatModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              Cadastrar Insumo
            </button>
          </div>
        </div>

        {tab === 'estoque' ? (
          <div className="space-y-4">
            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por nome do papel, código, fornecedor..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
              >
                <option value="todos">Todas as Categorias</option>
                <option value="papel_folha">Papéis em Folha (SRA3/A3/A4)</option>
                <option value="bobina_plotter">Bobinas para Plotter</option>
                <option value="acabamento">Acabamentos (BOPP, Wire-o)</option>
                <option value="tinta_toner">Tintas e Toners</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Insumo / Matéria-Prima</th>
                    <th className="px-4 py-3">Formato / Gramatura</th>
                    <th className="px-4 py-3 text-right">Custo Unitário</th>
                    <th className="px-4 py-3 text-right">Estoque Atual</th>
                    <th className="px-4 py-3 text-right">Estoque Mínimo</th>
                    <th className="px-4 py-3 text-right">Status</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.map((mat) => {
                    const isLow = mat.currentStock <= mat.minStock;
                    return (
                      <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-slate-800">
                          {mat.code}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{mat.name}</div>
                          <div className="text-[11px] text-slate-400">{mat.supplier}</div>
                        </td>
                        <td className="px-4 py-3">
                          {mat.widthMm && mat.heightMm ? (
                            <span>
                              {mat.widthMm}x{mat.heightMm} mm
                              {mat.grammage ? ` · ${mat.grammage}g/m²` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 capitalize">{mat.category.replace('_', ' ')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800 tabular-nums">
                          {formatBRL(mat.costPerUnit)} / {mat.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {mat.currentStock} {mat.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500 tabular-nums">
                          {mat.minStock} {mat.unit}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                              <AlertTriangle className="w-3 h-3 text-amber-600" /> Baixo
                            </span>
                          ) : (
                            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedMatId(mat.id);
                              setEntryType('entrada');
                              setIsEntryModalOpen(true);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                          >
                            + Entrada
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Movement History */
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Data/Hora</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3 text-right">Qtd Movimentada</th>
                    <th className="px-4 py-3 text-right">Saldo Anterior → Novo</th>
                    <th className="px-4 py-3">OS / Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {movements.map((mov) => {
                    const isPositive = mov.type === 'entrada';
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-sans text-slate-500 whitespace-nowrap">
                          {formatDateTime(mov.date)}
                        </td>
                        <td className="px-4 py-3 font-sans">
                          {mov.type === 'entrada' && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                              <ArrowDownRight className="w-3 h-3" /> Entrada
                            </span>
                          )}
                          {mov.type === 'consumo_os' && (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                              <ArrowUpRight className="w-3 h-3" /> Baixa OS
                            </span>
                          )}
                          {mov.type === 'saida_manual' && (
                            <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                              <ArrowUpRight className="w-3 h-3" /> Saída Manual
                            </span>
                          )}
                          {mov.type === 'ajuste' && (
                            <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                              Ajuste Balanço
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-sans font-semibold text-slate-800">
                          {mov.materialName}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold tabular-nums ${
                            isPositive ? 'text-emerald-600' : 'text-amber-700'
                          }`}
                        >
                          {isPositive ? '+' : '-'}
                          {mov.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 tabular-nums">
                          {mov.previousStock} → {mov.newStock}
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-600">
                          {mov.orderCode && (
                            <span className="font-bold text-slate-900 mr-2">
                              {mov.orderCode}:
                            </span>
                          )}
                          {mov.notes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Quick Stock Entry */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Movimentação Manual de Estoque
            </h3>

            <form onSubmit={handleQuickEntrySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selecione o Insumo
                </label>
                <select
                  value={selectedMatId}
                  onChange={(e) => setSelectedMatId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name} (Atual: {m.currentStock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Operação
                  </label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="entrada">Entrada (Compra)</option>
                    <option value="saida_manual">Saída Manual / Descarte</option>
                    <option value="ajuste">Ajuste de Balanço</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={entryQty}
                    onChange={(e) => setEntryQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo / Nota Fiscal de Compra
                </label>
                <input
                  type="text"
                  value={entryNotes}
                  onChange={(e) => setEntryNotes(e.target.value)}
                  placeholder="Ex: Compra NF-e 4492 do fornecedor Suzano"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Material Registration */}
      {isNewMatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Cadastrar Nova Matéria-Prima / Insumo
            </h3>

            <form onSubmit={handleNewMaterialSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Insumo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Papel Couché 250g Fosco SRA3"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código Interno
                  </label>
                  <input
                    type="text"
                    placeholder="PAP-006"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as MaterialCategory)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="papel_folha">Papel em Folha</option>
                    <option value="bobina_plotter">Bobina Plotter</option>
                    <option value="acabamento">Acabamento</option>
                    <option value="tinta_toner">Tinta / Toner</option>
                    <option value="embalagem">Embalagem</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidade
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="folha">Folha</option>
                    <option value="m2">m² (Metro)</option>
                    <option value="unidade">Unidade</option>
                    <option value="pct">Pacote</option>
                    <option value="bobina">Bobina</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Largura (mm)
                  </label>
                  <input
                    type="number"
                    value={newWidth}
                    onChange={(e) => setNewWidth(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Altura (mm)
                  </label>
                  <input
                    type="number"
                    value={newHeight}
                    onChange={(e) => setNewHeight(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custo Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={newCost}
                    onChange={(e) => setNewCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fornecedor Principal
                </label>
                <input
                  type="text"
                  placeholder="Ex: Suzano, Klabin, Imprimax..."
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewMatModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
