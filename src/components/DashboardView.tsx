import React from 'react';
import { Equipment, Material, Order, OrderStatus } from '../types';
import { formatBRL, formatDateTime } from '../utils/calculator';
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  Layers,
  Package,
  PlusCircle,
  Printer,
  Receipt,
  TrendingUp,
} from 'lucide-react';

interface DashboardViewProps {
  orders: Order[];
  materials: Material[];
  equipments: Equipment[];
  onNavigateTab: (tab: any) => void;
  onOpenNewOrder: () => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onViewJobTicket: (order: Order) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  materials,
  equipments,
  onNavigateTab,
  onOpenNewOrder,
  onUpdateOrderStatus,
  onViewJobTicket,
}) => {
  // Financial KPI calculations
  const totalRevenue = orders
    .filter((o) => o.type === 'pedido' && o.status !== 'cancelado')
    .reduce((sum, o) => sum + o.total, 0);

  const totalCost = orders
    .filter((o) => o.type === 'pedido' && o.status !== 'cancelado')
    .reduce((sum, o) => sum + o.totalCost, 0);

  const netProfit = Math.max(0, totalRevenue - totalCost);
  const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const inProductionOrders = orders.filter(
    (o) =>
      o.type === 'pedido' &&
      ['aprovado', 'pre_impressao', 'em_producao', 'acabamento'].includes(o.status)
  );

  const readyOrders = orders.filter((o) => o.status === 'pronto');
  const quotesCount = orders.filter((o) => o.type === 'orcamento').length;

  const lowStockItems = materials.filter((m) => m.currentStock <= m.minStock);

  // Kanban Pipeline stages
  const PIPELINE_COLUMNS: Array<{ status: OrderStatus; title: string; color: string }> = [
    { status: 'aprovado', title: 'Fila / Aprovado', color: 'border-blue-400 bg-blue-50/40' },
    { status: 'pre_impressao', title: 'Pré-Impressão (Arte)', color: 'border-indigo-400 bg-indigo-50/40' },
    { status: 'em_producao', title: 'Em Impressão', color: 'border-amber-400 bg-amber-50/40' },
    { status: 'acabamento', title: 'Acabamento & Corte', color: 'border-orange-400 bg-orange-50/40' },
    { status: 'pronto', title: 'Pronto p/ Retirada', color: 'border-emerald-400 bg-emerald-50/40' },
  ];

  const getNextStage = (status: OrderStatus): OrderStatus | null => {
    switch (status) {
      case 'aprovado':
        return 'pre_impressao';
      case 'pre_impressao':
        return 'em_producao';
      case 'em_producao':
        return 'acabamento';
      case 'acabamento':
        return 'pronto';
      case 'pronto':
        return 'entregue';
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Faturamento Bruto
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
            {formatBRL(totalRevenue)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Pedidos confirmados do mês
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lucro Líquido Estimado
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              +{profitMarginPercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-1 tabular-nums">
            {formatBRL(netProfit)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Custo total de produção: {formatBRL(totalCost)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Em Produção Gráfica
            </span>
            <Printer className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {inProductionOrders.length} ordens
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {readyOrders.length} prontas p/ retirada
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Orçamentos Pendentes
            </span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {quotesCount} abertos
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Aguardando aprovação do cliente
          </div>
        </div>
      </div>

      {/* Low Stock Urgent Alert Banner (if any) */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Atenção: {lowStockItems.length} insumo(s) com estoque abaixo do mínimo
              </h4>
              <p className="text-xs text-amber-800">
                {lowStockItems.map((m) => `${m.name} (${m.currentStock} ${m.unit})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Ver Estoque
          </button>
        </div>
      )}

      {/* Production Kanban Funnel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Funil de Produção Gráfica (Em Tempo Real)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Arraste mental ou avance as etapas de impressão e acabamento com 1 clique.
            </p>
          </div>

          <button
            onClick={onOpenNewOrder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            Novo Pedido
          </button>
        </div>

        {/* 5 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {PIPELINE_COLUMNS.map((col) => {
            const colOrders = orders.filter(
              (o) => o.type === 'pedido' && o.status === col.status
            );

            return (
              <div
                key={col.status}
                className={`rounded-xl border p-3 flex flex-col min-h-[320px] ${col.color}`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {col.title}
                  </span>
                  <span className="text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-white text-slate-800 border border-slate-200">
                    {colOrders.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colOrders.length === 0 ? (
                    <div className="h-28 flex items-center justify-center text-center text-xs text-slate-400 italic">
                      Nenhum item nesta etapa
                    </div>
                  ) : (
                    colOrders.map((ord) => {
                      const next = getNextStage(ord.status);
                      const mainItem = ord.items[0];

                      return (
                        <div
                          key={ord.id}
                          className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2 hover:border-slate-300 transition-all text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-900">
                              {ord.code}
                            </span>
                            <span className="font-mono font-bold text-slate-800 tabular-nums">
                              {formatBRL(ord.total)}
                            </span>
                          </div>

                          <div className="font-semibold text-slate-800 truncate">
                            {ord.clientName}
                          </div>

                          {mainItem && (
                            <div className="text-[11px] text-slate-600 line-clamp-2">
                              {mainItem.quantity}x {mainItem.description}
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            <button
                              onClick={() => onViewJobTicket(ord)}
                              className="text-[10px] text-slate-500 hover:text-slate-900 hover:underline cursor-pointer"
                            >
                              Ficha Técnica
                            </button>

                            {next && (
                              <button
                                onClick={() => onUpdateOrderStatus(ord.id, next)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-900 bg-slate-100 hover:bg-amber-100 px-2 py-1 rounded transition-colors cursor-pointer"
                              >
                                <span>Avançar</span>
                                <ArrowRight className="w-2.5 h-2.5 text-amber-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Equipments & Stock Quick Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Machine Status Widget */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Maquinários da Gráfica
            </h3>
            <button
              onClick={() => onNavigateTab('equipments')}
              className="text-xs text-amber-700 font-semibold hover:underline"
            >
              Gerenciar Máquinas →
            </button>
          </div>

          <div className="space-y-2">
            {equipments.slice(0, 4).map((eq) => (
              <div
                key={eq.id}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">{eq.name}</span>
                  <div className="text-[11px] text-slate-400">
                    Color: {formatBRL(eq.clickCostColor)}/clique · PB:{' '}
                    {formatBRL(eq.clickCostPB)}/clique
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
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

        {/* Quick Inventory Widget */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Insumos & Papéis em Destaque
            </h3>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-amber-700 font-semibold hover:underline"
            >
              Ver Todo o Estoque →
            </button>
          </div>

          <div className="space-y-2">
            {materials.slice(0, 4).map((mat) => (
              <div
                key={mat.id}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">{mat.name}</span>
                  <div className="text-[11px] text-slate-400">
                    Custo: {formatBRL(mat.costPerUnit)}/{mat.unit}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900">
                    {mat.currentStock} {mat.unit}
                  </span>
                  <div className="text-[10px] text-slate-400">
                    Mín: {mat.minStock} {mat.unit}
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
