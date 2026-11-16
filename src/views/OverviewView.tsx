import React, { useMemo, useState } from 'react';
import { Equipment, Material, Order, OrderStatus } from '../types';
import { formatBRL, formatDate } from '../utils/calculator';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  PlusCircle,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';

interface OverviewViewProps {
  orders: Order[];
  materials: Material[];
  equipments: Equipment[];
  onOpenGerarPedido: () => void;
  onNavigate: (page: any) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onSelectOrder: (order: Order) => void;
}

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  orcamento: { label: 'Orçamento', color: 'bg-slate-100 text-slate-700' },
  aprovado: { label: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
  em_producao: { label: 'Em Produção', color: 'bg-amber-100 text-amber-900' },
  pronto: { label: 'Pronto p/ Retirada', color: 'bg-emerald-100 text-emerald-800' },
  entregue: { label: 'Entregue', color: 'bg-slate-800 text-white' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

const MONTH_NAMES_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const MONTH_NAMES_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function getOrderYearMonth(createdAt: string): { year: number; month: number } | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1, // 1..12
  };
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  orders,
  materials,
  equipments,
  onOpenGerarPedido,
  onNavigate,
  onUpdateOrderStatus,
  onSelectOrder,
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 'all' or specific month (1..12)
  const [selectedMonth, setSelectedMonth] = useState<'all' | number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Available years dynamically collected from orders + currentYear
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([currentYear]);
    orders.forEach((o) => {
      const ym = getOrderYearMonth(o.createdAt);
      if (ym) yearsSet.add(ym.year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [orders, currentYear]);

  // Orders filtered by selected period (either all-time or specific month+year)
  const periodOrders = useMemo(() => {
    if (selectedMonth === 'all') {
      return orders;
    }
    return orders.filter((o) => {
      const ym = getOrderYearMonth(o.createdAt);
      return ym && ym.year === selectedYear && ym.month === selectedMonth;
    });
  }, [orders, selectedMonth, selectedYear]);

  // KPIs calculated for the selected period
  const confirmedOrders = useMemo(
    () => periodOrders.filter((o) => o.type === 'pedido' && o.status !== 'cancelado'),
    [periodOrders]
  );
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.finalPrice, 0);
  const totalCost = confirmedOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const netProfit = Math.max(0, totalRevenue - totalCost);
  const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const averageTicket = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;

  const inProductionOrders = periodOrders.filter(
    (o) => o.type === 'pedido' && ['aprovado', 'em_producao'].includes(o.status)
  );
  const readyOrders = periodOrders.filter((o) => o.status === 'pronto');
  const deliveredOrders = periodOrders.filter((o) => o.status === 'entregue');
  const quotes = periodOrders.filter((o) => o.type === 'orcamento');
  const quotesCount = quotes.length;
  const quotesTotalValue = quotes.reduce((sum, o) => sum + o.finalPrice, 0);

  const lowStockItems = materials.filter((m) => m.currentStock <= m.minStock);

  // Monthly breakdown for all 12 months of selectedYear
  const monthlyStats = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const monthNumber = idx + 1;
      const monthOrders = orders.filter((o) => {
        const ym = getOrderYearMonth(o.createdAt);
        return ym && ym.year === selectedYear && ym.month === monthNumber;
      });
      const monthConfirmed = monthOrders.filter(
        (o) => o.type === 'pedido' && o.status !== 'cancelado'
      );
      const revenue = monthConfirmed.reduce((sum, o) => sum + o.finalPrice, 0);
      const cost = monthConfirmed.reduce((sum, o) => sum + o.totalCost, 0);
      const profit = Math.max(0, revenue - cost);
      const monthQuotes = monthOrders.filter((o) => o.type === 'orcamento').length;

      return {
        month: monthNumber,
        shortName: MONTH_NAMES_SHORT[idx],
        fullName: MONTH_NAMES_FULL[idx],
        ordersCount: monthConfirmed.length,
        quotesCount: monthQuotes,
        revenue,
        profit,
      };
    });
  }, [orders, selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 'all') {
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
      return;
    }
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 'all') {
      setSelectedMonth(currentMonth);
      setSelectedYear(currentYear);
      return;
    }
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const activePeriodLabel =
    selectedMonth === 'all'
      ? 'Todo o Histórico'
      : `${MONTH_NAMES_FULL[selectedMonth - 1]} de ${selectedYear}`;

  const getNextStage = (status: OrderStatus): OrderStatus | null => {
    switch (status) {
      case 'orcamento':
        return 'em_producao';
      case 'aprovado':
        return 'em_producao';
      case 'em_producao':
        return 'pronto';
      case 'pronto':
        return 'entregue';
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Banner with Quick CTA */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 uppercase">
            Sistema Gráfica Rápida
          </span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1.5">
            Visão Geral da Gráfica.
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhe pedidos ativos, faturamento, maquinários e controle de estoque em tempo real.
          </p>
        </div>

        <button
          onClick={onOpenGerarPedido}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer shrink-0"
        >
          <PlusCircle className="w-5 h-5 text-slate-950" />
          <span>Gerar Pedido</span>
        </button>
      </div>

      {/* Month & Year Filter Bar */}
      <div className="bg-white px-3.5 py-3 sm:px-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
              Período:
            </span>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-900 text-amber-400 truncate">
              {activePeriodLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/70">
              <button
                type="button"
                onClick={() => setSelectedMonth('all')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  selectedMonth === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedYear(currentYear);
                  setSelectedMonth(currentMonth);
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  selectedMonth === currentMonth && selectedYear === currentYear
                    ? 'bg-amber-400 text-slate-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mês Atual
              </button>
            </div>

            <div className="inline-flex items-center gap-0.5 bg-slate-50 px-1 py-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Mês anterior"
                className="p-1 rounded-md hover:bg-white hover:shadow-2xs text-slate-600 hover:text-slate-900 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <select
                value={selectedMonth}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedMonth(v === 'all' ? 'all' : Number(v));
                }}
                aria-label="Selecionar mês"
                className="bg-transparent text-[11px] font-bold text-slate-800 px-1 py-0.5 focus:outline-none cursor-pointer"
              >
                <option value="all">Todos os meses</option>
                {MONTH_NAMES_FULL.map((name, index) => (
                  <option key={name} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>

              <span className="text-slate-300 text-xs">/</span>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label="Selecionar ano"
                className="bg-transparent text-[11px] font-mono font-bold text-slate-800 px-1 py-0.5 focus:outline-none cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                title="Próximo mês"
                className="p-1 rounded-md hover:bg-white hover:shadow-2xs text-slate-600 hover:text-slate-900 cursor-pointer transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Compact 12-Month Comparative Strip */}
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1 pt-2 border-t border-slate-100">
          {monthlyStats.map((m) => {
            const isSelected = selectedMonth === m.month;
            const hasData = m.ordersCount > 0 || m.quotesCount > 0;
            return (
              <button
                key={m.month}
                type="button"
                onClick={() => setSelectedMonth(m.month)}
                title={`${m.fullName} ${selectedYear}: ${m.ordersCount} pedidos • ${formatBRL(m.revenue)}`}
                className={`px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : hasData
                    ? 'bg-white hover:bg-amber-50/40 text-slate-900 border-slate-200 hover:border-amber-300'
                    : 'bg-slate-50/70 hover:bg-slate-100 text-slate-400 border-transparent hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide ${
                      isSelected ? 'text-amber-400' : hasData ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    {m.shortName}
                  </span>
                  {hasData && (
                    <span
                      className={`text-[9px] font-mono font-bold px-1 rounded leading-tight ${
                        isSelected
                          ? 'bg-amber-400/20 text-amber-300'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {m.ordersCount}
                    </span>
                  )}
                </div>
                <div
                  className={`text-[10px] font-mono font-bold truncate mt-0.5 tabular-nums ${
                    isSelected ? 'text-white' : hasData ? 'text-slate-900' : 'text-slate-300'
                  }`}
                >
                  {hasData ? formatBRL(m.revenue) : '—'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Faturamento</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
            {formatBRL(totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {confirmedOrders.length} pedidos · Ticket: {formatBRL(averageTicket)}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Lucro Líquido</span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
              +{marginPercent.toFixed(0)}%
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 mt-1 tabular-nums">
            {formatBRL(netProfit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Custo produção: {formatBRL(totalCost)}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Em Produção</span>
            <ShoppingBag className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
            {inProductionOrders.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {readyOrders.length} prontas · {deliveredOrders.length} entregues
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Orçamentos</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
            {quotesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Total orçado: {formatBRL(quotesTotalValue)}
          </div>
        </div>
      </div>

      {/* Low Stock Banner if any */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Alerta de Reposição: {lowStockItems.length} insumo(s) abaixo do estoque mínimo
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {lowStockItems.map((m) => `${m.name} (${m.currentStock} ${m.unit})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('estoque')}
            className="px-3 py-1.5 text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            Ver Estoque
          </button>
        </div>
      )}

      {/* Recent Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Ordens do Período ({activePeriodLabel})
            </h2>
            <p className="text-xs text-slate-500">
              Acompanhe e avance o status dos trabalhos registrados no período selecionado.
            </p>
          </div>

          <button
            onClick={() => onNavigate('pedidos')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
          >
            Ver todos os pedidos →
          </button>
        </div>

        <div className="space-y-2.5">
          {periodOrders.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
              <p>Nenhum pedido ou orçamento encontrado em {activePeriodLabel}.</p>
              {selectedMonth !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedMonth('all')}
                  className="text-amber-700 font-bold hover:underline cursor-pointer"
                >
                  Mostrar todo o histórico
                </button>
              )}
            </div>
          ) : (
            periodOrders.slice(0, 5).map((ord) => {
              const next = getNextStage(ord.status);
              const statusConfig = STATUS_LABELS[ord.status] || STATUS_LABELS.orcamento;

              return (
                <div
                  key={ord.id}
                  className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {ord.code}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {formatDate(ord.createdAt)}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900 text-sm">
                      {ord.clientName}
                      {ord.clientPhone && (
                        <span className="font-mono text-slate-500 text-xs font-normal ml-2">
                          {ord.clientPhone}
                        </span>
                      )}
                    </div>

                    <div className="text-slate-600 text-xs">
                      <span className="font-bold text-slate-800">{ord.quantity.toLocaleString('pt-BR')}x</span>{' '}
                      {ord.productName} ({ord.materialName})
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <div className="text-left sm:text-right">
                      <div className="text-base font-black font-mono text-slate-900 tabular-nums">
                        {formatBRL(ord.finalPrice)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatBRL(ord.unitPrice)}/un
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectOrder(ord)}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Detalhes
                      </button>

                      {next && (
                        <button
                          onClick={() => onUpdateOrderStatus(ord.id, next)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
                          title={`Avançar para: ${next}`}
                        >
                          <span>Avançar</span>
                          <ArrowRight className="w-3 h-3 text-amber-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Machines and Stock Quick Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Machines */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Parque de Máquinas</h3>
            </div>
            <button
              onClick={() => onNavigate('maquinas')}
              className="text-xs text-amber-700 font-bold hover:underline cursor-pointer"
            >
              Ver todas →
            </button>
          </div>

          <div className="space-y-2">
            {equipments.map((eq) => (
              <div
                key={eq.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">{eq.name}</span>
                  <div className="text-[11px] text-slate-400">
                    Clique Color: {formatBRL(eq.clickCostColor)} · PB: {formatBRL(eq.clickCostPB)}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    eq.status === 'operacional'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {eq.status === 'operacional' ? 'Ativa' : 'Manutenção'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stock */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">Saldos de Insumos</h3>
            </div>
            <button
              onClick={() => onNavigate('estoque')}
              className="text-xs text-amber-700 font-bold hover:underline cursor-pointer"
            >
              Ver estoque →
            </button>
          </div>

          <div className="space-y-2">
            {materials.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">{m.name}</span>
                  <div className="text-[11px] text-slate-400">
                    Custo: {formatBRL(m.costPerUnit)}/{m.unit}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">
                    {m.currentStock} {m.unit}
                  </span>
                  <div className="text-[10px] text-slate-400">
                    Mín: {m.minStock} {m.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
