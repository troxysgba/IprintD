import React, { useState } from 'react';
import { Equipment } from '../types';
import { formatBRL } from '../utils/calculator';
import {
  Activity,
  Calculator,
  Cpu,
  Pencil,
  Plus,
  Printer,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';

interface MachinesViewProps {
  equipments: Equipment[];
  onAddEquipment: (equipment: Equipment) => void;
  onUpdateEquipment: (equipment: Equipment) => void;
  onDeleteEquipment?: (equipmentId: string) => void;
  onOpenGerarPedido: () => void;
}

export const MachinesView: React.FC<MachinesViewProps> = ({
  equipments,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  onOpenGerarPedido,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [equipmentToDelete, setEquipmentToDelete] = useState<Equipment | null>(null);

  // Quick simulation state
  const [simPages, setSimPages] = useState<number>(100);
  const [simMachineId, setSimMachineId] = useState<string>(equipments[0]?.id || '');
  const selectedSim = equipments.find((e) => e.id === simMachineId) || equipments[0];

  // New Equipment Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<Equipment['category']>('jato_de_tinta');
  const [inkPercent, setInkPercent] = useState<number>(3);
  const [depreciationPercent, setDepreciationPercent] = useState<number>(10);

  // Edit Equipment Form State
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editCategory, setEditCategory] = useState<Equipment['category']>('jato_de_tinta');
  const [editInkPercent, setEditInkPercent] = useState<number>(3);
  const [editDepreciationPercent, setEditDepreciationPercent] = useState<number>(10);

  const toggleStatus = (eq: Equipment) => {
    const nextStatus = eq.status === 'operacional' ? 'manutencao' : 'operacional';
    onUpdateEquipment({ ...eq, status: nextStatus });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newEq: Equipment = {
      id: `eq_${Date.now()}`,
      code: code.trim() || `EQ-0${equipments.length + 1}`,
      name: name.trim(),
      category,
      clickCostPB: 0,
      clickCostColor: 0,
      hourlyRate: 0,
      speedPerHour: 600,
      status: 'operacional',
      inkPercent: Number(inkPercent) || 0,
      depreciationPercent: Number(depreciationPercent) || 0,
    };

    onAddEquipment(newEq);
    setIsModalOpen(false);
    setName('');
    setCode('');
    setInkPercent(3);
    setDepreciationPercent(10);
  };

  const handleStartEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setEditName(eq.name);
    setEditCode(eq.code);
    setEditCategory(eq.category);
    setEditInkPercent(eq.inkPercent ?? 3);
    setEditDepreciationPercent(eq.depreciationPercent ?? 10);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment || !editName.trim()) return;

    const updated: Equipment = {
      ...editingEquipment,
      name: editName.trim(),
      code: editCode.trim() || editingEquipment.code,
      category: editCategory,
      inkPercent: Number(editInkPercent) || 0,
      depreciationPercent: Number(editDepreciationPercent) || 0,
    };

    onUpdateEquipment(updated);
    setEditingEquipment(null);
  };

  const handleConfirmDelete = () => {
    if (equipmentToDelete && onDeleteEquipment) {
      onDeleteEquipment(equipmentToDelete.id);
      setEquipmentToDelete(null);
    }
  };

  const getCategoryLabel = (cat: Equipment['category']) => {
    switch (cat) {
      case 'jato_de_tinta':
        return 'Jato de Tinta';
      case 'laser':
        return 'Laser Digital';
      case 'plotter':
        return 'Plotter';
      case 'acabamento':
        return 'Acabamento';
      default:
        return cat;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            Máquinas & Parque Gráfico
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Custos de cliques (Color/PB), velocidade operacional e taxa de depreciação por hora.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Cadastrar Máquina</span>
        </button>
      </div>

      {/* Simulator Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-2xs grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        <div className="md:col-span-7 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Simulador de Depreciação (10%) & Tinta (3%)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Simule instantaneamente o valor adicionado de depreciação de máquina e consumo de tinta para qualquer valor base de pedido.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Máquina Selecionada</label>
              <select
                value={simMachineId}
                onChange={(e) => setSimMachineId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                {equipments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Valor Base do Pedido (R$)</label>
              <input
                type="number"
                min="1"
                step="5"
                value={simPages}
                onChange={(e) => setSimPages(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs text-white"
                placeholder="100.00"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Custo com Tinta ({selectedSim?.inkPercent ?? 3}%):</span>
            <span className="text-sky-400 font-bold">+{formatBRL(simPages * ((selectedSim?.inkPercent ?? 3) / 100))}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Depreciação de Máquina ({selectedSim?.depreciationPercent ?? 10}%):</span>
            <span className="text-indigo-400 font-bold">+{formatBRL(simPages * ((selectedSim?.depreciationPercent ?? 10) / 100))}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline font-bold">
            <span className="text-amber-400 font-sans text-xs">Total com Acréscimos:</span>
            <span className="text-lg text-white tabular-nums">
              {formatBRL(simPages * (1 + ((selectedSim?.inkPercent ?? 3) + (selectedSim?.depreciationPercent ?? 10)) / 100))}
            </span>
          </div>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipments.map((eq) => {
          const isOperational = eq.status === 'operacional';
          const isInkjet = eq.category === 'jato_de_tinta';

          return (
            <div
              key={eq.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        isInkjet ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{eq.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono font-semibold text-slate-400">{eq.code}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            isInkjet
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {getCategoryLabel(eq.category)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleStatus(eq)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors shrink-0 ${
                      isOperational
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                    title="Clique para alternar status operacional"
                  >
                    {isOperational ? 'Operacional' : 'Em Manutenção'}
                  </button>
                </div>

                <div className="space-y-2 text-xs border-t border-b border-slate-100 py-3">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Depreciação de Máquina:
                    </span>
                    <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {eq.depreciationPercent ?? 10}% do pedido
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      Custo com Tinta:
                    </span>
                    <span className="font-mono font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {eq.inkPercent ?? 3}% do pedido
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Acréscimo Total:</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      +{(eq.depreciationPercent ?? 10) + (eq.inkPercent ?? 3)}% sobre o pedido
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Editar, Excluir & Usar em Pedido */}
              <div className="flex items-center justify-between pt-1 gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleStartEdit(eq)}
                    className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    title="Editar parâmetros desta impressora"
                  >
                    <Pencil className="w-3 h-3 text-amber-600" />
                    <span>Editar</span>
                  </button>

                  {onDeleteEquipment && (
                    <button
                      onClick={() => setEquipmentToDelete(eq)}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      title="Excluir equipamento"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={onOpenGerarPedido}
                  className="font-bold text-xs text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                >
                  Usar em Pedido →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Cadastrar Máquina */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Cadastrar Novo Equipamento
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nome do Equipamento / Modelo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Impressora l4260 jato de tinta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Código</label>
                  <input
                    type="text"
                    placeholder="EQ-03"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="jato_de_tinta">Jato de Tinta (Tanque)</option>
                    <option value="laser">Laser Digital</option>
                    <option value="plotter">Plotter</option>
                    <option value="acabamento">Acabamento</option>
                  </select>
                </div>
              </div>

              {/* Configuração de Percentuais de Tinta e Depreciação */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Custo Tinta (%)</span>
                    <span className="text-[10px] text-sky-600 font-mono">Padrão 3%</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={inkPercent}
                      onChange={(e) => setInkPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 pr-7 font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                      placeholder="3"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Depreciação (%)</span>
                    <span className="text-[10px] text-indigo-600 font-mono">Padrão 10%</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={depreciationPercent}
                      onChange={(e) => setDepreciationPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 pr-7 font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                      placeholder="10"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Salvar Máquina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Máquina */}
      {editingEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-500" />
                  <span>Editar Equipamento</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atualize custos por página/tinta, hora e velocidade.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEquipment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nome do Equipamento / Modelo
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Código</label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Categoria</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                  >
                    <option value="jato_de_tinta">Jato de Tinta (Tanque)</option>
                    <option value="laser">Laser Digital</option>
                    <option value="plotter">Plotter</option>
                    <option value="acabamento">Acabamento</option>
                  </select>
                </div>
              </div>

              {/* Configuração de Percentuais de Tinta e Depreciação no Editar */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Custo Tinta (%)</span>
                    <span className="text-[10px] text-sky-600 font-mono">% pedido</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={editInkPercent}
                      onChange={(e) => setEditInkPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 pr-7 font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Depreciação (%)</span>
                    <span className="text-[10px] text-indigo-600 font-mono">% pedido</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={editDepreciationPercent}
                      onChange={(e) => setEditDepreciationPercent(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 pr-7 font-mono font-bold bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                    <span className="absolute right-2.5 top-2 text-xs font-bold text-slate-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingEquipment(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão de Máquina */}
      {equipmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Excluir Máquina?</h3>
                <p className="text-xs text-slate-500">Remover equipamento do parque gráfico</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 my-4 text-xs space-y-1">
              <div className="font-bold text-slate-900">{equipmentToDelete.name}</div>
              <div className="text-slate-500 font-mono">
                {equipmentToDelete.code} · {getCategoryLabel(equipmentToDelete.category)}
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5">
              Tem certeza de que deseja excluir a máquina "{equipmentToDelete.name}"?
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEquipmentToDelete(null)}
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
