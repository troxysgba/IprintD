import React, { useState } from 'react';
import { Equipment } from '../types';
import { formatBRL } from '../utils/calculator';
import {
  Activity,
  Calculator,
  CheckCircle,
  Cpu,
  Layers,
  Plus,
  Wrench,
} from 'lucide-react';

interface EquipmentsViewProps {
  equipments: Equipment[];
  onAddEquipment: (equipment: Equipment) => void;
  onUpdateEquipment: (equipment: Equipment) => void;
}

export const EquipmentsView: React.FC<EquipmentsViewProps> = ({
  equipments,
  onAddEquipment,
  onUpdateEquipment,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Simulation state
  const [simPages, setSimPages] = useState<number>(500);
  const [simIsColor, setSimIsColor] = useState<boolean>(true);
  const [simEquipmentId, setSimEquipmentId] = useState<string>(
    equipments[0]?.id || ''
  );

  // New Equipment state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<Equipment['category']>('impressora_laser');
  const [clickPB, setClickPB] = useState<number>(0.045);
  const [clickColor, setClickColor] = useState<number>(0.18);
  const [hourlyRate, setHourlyRate] = useState<number>(45.0);
  const [speed, setSpeed] = useState<number>(1800);
  const [maxWidth, setMaxWidth] = useState<number>(330);
  const [maxHeight, setMaxHeight] = useState<number>(487);
  const [maintCost, setMaintCost] = useState<number>(500);

  const selectedSimEquipment =
    equipments.find((e) => e.id === simEquipmentId) || equipments[0];

  const handleSimulate = () => {
    if (!selectedSimEquipment) return { clickCost: 0, timeCost: 0, total: 0 };
    const clickUnit = simIsColor
      ? selectedSimEquipment.clickCostColor
      : selectedSimEquipment.clickCostPB;
    const clickCost = simPages * clickUnit;
    const hours = simPages / (selectedSimEquipment.speedPerHour || 100);
    const timeCost = hours * selectedSimEquipment.hourlyRate;
    return {
      clickCost,
      timeCost,
      total: clickCost + timeCost,
      hours,
    };
  };

  const simResult = handleSimulate();

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newEq: Equipment = {
      id: `eq_${Date.now()}`,
      code: code.trim() || `EQ-0${equipments.length + 1}`,
      name: name.trim(),
      category,
      clickCostPB: Number(clickPB) || 0,
      clickCostColor: Number(clickColor) || 0,
      hourlyRate: Number(hourlyRate) || 0,
      speedPerHour: Number(speed) || 0,
      maxSheetWidthMm: Number(maxWidth) || 0,
      maxSheetHeightMm: Number(maxHeight) || 0,
      status: 'operacional',
      maintenanceCostMonthly: Number(maintCost) || 0,
    };

    onAddEquipment(newEq);
    setIsModalOpen(false);

    setName('');
    setCode('');
  };

  const toggleEquipmentStatus = (eq: Equipment) => {
    const nextStatus = eq.status === 'operacional' ? 'manutencao' : 'operacional';
    onUpdateEquipment({ ...eq, status: nextStatus });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Machinery Overview (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Parque Gráfico & Equipamentos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle de custos de clique (PB/Color), depreciação e manutenção das máquinas.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              Novo Equipamento
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Máquinas Cadastradas
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                {equipments.length} ativas
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Status Operacional
              </div>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
                {equipments.filter((e) => e.status === 'operacional').length} operando
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Custo Mensal Manutenção
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
                {formatBRL(equipments.reduce((sum, e) => sum + e.maintenanceCostMonthly, 0))}
              </div>
            </div>
          </div>
        </div>

        {/* Machine Cost Simulator (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Simulador de Custo de Tiragem
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Equipamento</label>
              <select
                value={simEquipmentId}
                onChange={(e) => setSimEquipmentId(e.target.value)}
                className="w-full bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-700 font-medium"
              >
                {equipments.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Tiragem / Cliques</label>
                <input
                  type="number"
                  min="1"
                  value={simPages}
                  onChange={(e) => setSimPages(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tipo de Impressão</label>
                <select
                  value={simIsColor ? 'color' : 'pb'}
                  onChange={(e) => setSimIsColor(e.target.value === 'color')}
                  className="w-full bg-slate-800 text-white px-3 py-1.5 rounded-lg border border-slate-700 font-medium"
                >
                  <option value="color">Colorida (CMYK)</option>
                  <option value="pb">Monocromática (PB)</option>
                </select>
              </div>
            </div>

            {/* Sim Result Card */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Custo Direto de Cliques:</span>
                <span className="text-white">{formatBRL(simResult.clickCost)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Depreciação/Hora Máquina:</span>
                <span className="text-white">{formatBRL(simResult.timeCost)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                <span className="text-amber-400 font-sans">Custo Máquina Total:</span>
                <span className="text-white tabular-nums">
                  {formatBRL(simResult.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {equipments.map((eq) => {
          const isOperational = eq.status === 'operacional';
          return (
            <div
              key={eq.id}
              className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 font-bold shrink-0">
                    <Cpu className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {eq.name}
                    </h4>
                    <span className="text-xs font-mono text-slate-400">{eq.code}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleEquipmentStatus(eq)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    isOperational
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                  title="Clique para alternar status operacional"
                >
                  {isOperational ? 'Operacional' : 'Em Manutenção'}
                </button>
              </div>

              {/* Technical Specifications Matrix */}
              <div className="space-y-2 text-xs border-t border-b border-slate-100 py-3">
                <div className="flex justify-between text-slate-600">
                  <span>Custo Clique Color:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatBRL(eq.clickCostColor)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Custo Clique PB:</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatBRL(eq.clickCostPB)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Hora Operacional (Deprec.+Op.):</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {formatBRL(eq.hourlyRate)}/h
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Velocidade de Trabalho:</span>
                  <span className="font-mono text-slate-800 tabular-nums">
                    {eq.speedPerHour} un/h
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Formato Máximo Suportado:</span>
                  <span className="font-mono text-slate-800">
                    {eq.maxSheetWidthMm} × {eq.maxSheetHeightMm} mm
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Manutenção: {formatBRL(eq.maintenanceCostMonthly)}/mês</span>
                <span className="text-slate-400 capitalize">
                  {eq.category.replace('_', ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Equipment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Cadastrar Novo Equipamento
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Equipamento / Modelo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Konica Minolta AccurioPress C4070"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código do Ativo
                  </label>
                  <input
                    type="text"
                    placeholder="EQ-07"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="impressora_laser">Impressora Digital Laser</option>
                    <option value="plotter_comunicacao">Plotter de Comunicação Visual</option>
                    <option value="guilhotina">Guilhotina / Refiladora</option>
                    <option value="laminadora">Laminadora / Plastificadora</option>
                    <option value="corte_digital">Mesa de Corte Digital</option>
                    <option value="encadernadora">Encadernadora</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custo Clique Color (R$)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={clickColor}
                    onChange={(e) => setClickColor(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custo Clique PB (R$)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={clickPB}
                    onChange={(e) => setClickPB(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custo Hora Operacional (R$/h)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Velocidade (un/h ou m²/h)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={speed}
                    onChange={(e) => setSpeed(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Largura Máxima (mm)
                  </label>
                  <input
                    type="number"
                    value={maxWidth}
                    onChange={(e) => setMaxWidth(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Altura Máxima (mm)
                  </label>
                  <input
                    type="number"
                    value={maxHeight}
                    onChange={(e) => setMaxHeight(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custo Médio Manutenção Mensal (R$)
                </label>
                <input
                  type="number"
                  step="10"
                  min="0"
                  value={maintCost}
                  onChange={(e) => setMaintCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  Salvar Equipamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
