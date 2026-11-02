import React, { useState } from 'react';
import { Equipment } from '../types';
import { formatBRL } from '../utils/calculator';
import {
  Activity,
  Calculator,
  Cpu,
  Plus,
  Printer,
  Wrench,
} from 'lucide-react';

interface MachinesViewProps {
  equipments: Equipment[];
  onAddEquipment: (equipment: Equipment) => void;
  onUpdateEquipment: (equipment: Equipment) => void;
  onOpenGerarPedido: () => void;
}

export const MachinesView: React.FC<MachinesViewProps> = ({
  equipments,
  onAddEquipment,
  onUpdateEquipment,
  onOpenGerarPedido,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Quick simulation state
  const [simPages, setSimPages] = useState<number>(500);
  const [simIsColor, setSimIsColor] = useState<boolean>(true);
  const [simMachineId, setSimMachineId] = useState<string>(equipments[0]?.id || '');

  // New Equipment Form
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<Equipment['category']>('laser');
  const [clickPB, setClickPB] = useState<number>(0.045);
  const [clickColor, setClickColor] = useState<number>(0.18);
  const [hourlyRate, setHourlyRate] = useState<number>(45.0);
  const [speed, setSpeed] = useState<number>(1800);

  const selectedSim = equipments.find((e) => e.id === simMachineId) || equipments[0];

  const simResult = React.useMemo(() => {
    if (!selectedSim) return { clickCost: 0, timeCost: 0, total: 0 };
    const unitClick = simIsColor ? selectedSim.clickCostColor : selectedSim.clickCostPB;
    const clickCost = simPages * unitClick;
    const hours = simPages / (selectedSim.speedPerHour || 100);
    const timeCost = hours * selectedSim.hourlyRate;
    return {
      clickCost,
      timeCost,
      total: clickCost + timeCost,
    };
  }, [selectedSim, simPages, simIsColor]);

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
      clickCostPB: Number(clickPB) || 0,
      clickCostColor: Number(clickColor) || 0,
      hourlyRate: Number(hourlyRate) || 0,
      speedPerHour: Number(speed) || 0,
      status: 'operacional',
    };

    onAddEquipment(newEq);
    setIsModalOpen(false);
    setName('');
    setCode('');
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
              Simulador Direto de Cliques & Tempo de Máquina
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Calcule o custo instantâneo de rodar uma tiragem específica em qualquer uma de suas impressoras ou plotters.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Selecione a Máquina</label>
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
              <label className="text-slate-400 block mb-1">Tiragem / Cliques</label>
              <input
                type="number"
                min="1"
                value={simPages}
                onChange={(e) => setSimPages(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono font-bold text-xs text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Tipo de Cor</label>
              <select
                value={simIsColor ? 'color' : 'pb'}
                onChange={(e) => setSimIsColor(e.target.value === 'color')}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="color">Colorido (CMYK)</option>
                <option value="pb">Monocromático (PB)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Cliques diretos:</span>
            <span className="text-white font-bold">{formatBRL(simResult.clickCost)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Hora operacional:</span>
            <span className="text-white font-bold">{formatBRL(simResult.timeCost)}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline font-bold">
            <span className="text-amber-400 font-sans text-xs">Custo Total da Máquina:</span>
            <span className="text-lg text-white tabular-nums">
              {formatBRL(simResult.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipments.map((eq) => {
          const isOperational = eq.status === 'operacional';
          return (
            <div
              key={eq.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-800 shrink-0">
                    <Cpu className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{eq.name}</h4>
                    <span className="text-xs font-mono text-slate-400">{eq.code}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleStatus(eq)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
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
                  <span>Taxa Operacional/Hora:</span>
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
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="capitalize">{eq.category}</span>
                <button
                  onClick={onOpenGerarPedido}
                  className="font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
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
                  placeholder="Ex: Konica Minolta AccurioPress C4070"
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
                    placeholder="EQ-05"
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
                    <option value="laser">Laser Digital</option>
                    <option value="plotter">Plotter Comunicação</option>
                    <option value="acabamento">Acabamento / Corte</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Custo Clique Color (R$)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={clickColor}
                    onChange={(e) => setClickColor(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Custo Clique PB (R$)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={clickPB}
                    onChange={(e) => setClickPB(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Hora Operacional (R$/h)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Velocidade (un/h ou m²/h)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={speed}
                    onChange={(e) => setSpeed(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
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
    </div>
  );
};
