import React from 'react';
import { Equipment, Material, Order, OrderStatus } from '../types';
import { formatBRL, formatDate } from '../utils/calculator';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  PlusCircle,
  Printer,
  ShoppingBag,
  TrendingUp,
  User,
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

export const OverviewView: React.FC<OverviewViewProps> = ({
  orders,
  materials,
  equipments,
  onOpenGerarPedido,
  onNavigate,
  onUpdateOrderStatus,
  onSelectOrder,
}) => {
  const confirmedOrders = orders.filter((o) => o.type === 'pedido' && o.status !== 'cancelado');
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.finalPrice, 0);
  const totalCost = confirmedOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const netProfit = Math.max(0, totalRevenue - totalCost);
  const marginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const inProductionOrders = orders.filter(
    (o) => o.type === 'pedido' && ['aprovado', 'em_producao'].includes(o.status)
  );
  const readyOrders = orders.filter((o) => o.status === 'pronto');
  const quotesCount = orders.filter((o) => o.type === 'orcamento').length;
  const lowStockItems = materials.filter((m) => m.currentStock <= m.minStock);

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
            Visão Geral da Oficina
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
            {confirmedOrders.length} pedidos confirmados
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
            {readyOrders.length} prontas p/ entrega
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
            Aguardando aprovação
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
              Ordens Recentes na Oficina
            </h2>
            <p className="text-xs text-slate-500">
              Acompanhe e avance o status dos trabalhos em impressão e acabamento.
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
          {orders.slice(0, 5).map((ord) => {
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
          })}
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
