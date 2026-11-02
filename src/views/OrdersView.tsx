import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, PaymentStatus } from '../types';
import {
  formatBRL,
  formatDate,
  formatPrintSides,
  generateWhatsAppLink,
  generateWhatsAppMessage,
} from '../utils/calculator';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Package,
  Pencil,
  PlusCircle,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  onOpenGerarPedido: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePayment: (orderId: string, paymentStatus: PaymentStatus) => void;
  onViewJobTicket: (order: Order) => void;
}

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  orcamento: { label: 'Orçamento', color: 'bg-slate-100 text-slate-700' },
  aprovado: { label: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
  em_producao: { label: 'Em Produção', color: 'bg-amber-100 text-amber-900' },
  pronto: { label: 'Pronto p/ Retirada', color: 'bg-emerald-100 text-emerald-800' },
  entregue: { label: 'Entregue / Concluído', color: 'bg-slate-800 text-white' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onOpenGerarPedido,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus,
  onUpdatePayment,
  onViewJobTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'todos' | 'orcamentos' | 'producao' | 'prontos' | 'concluidos'>('todos');
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Tab filter
      if (filterTab === 'orcamentos' && ord.type !== 'orcamento') return false;
      if (filterTab === 'producao' && !['aprovado', 'em_producao'].includes(ord.status)) return false;
      if (filterTab === 'prontos' && ord.status !== 'pronto') return false;
      if (filterTab === 'concluidos' && ord.status !== 'entregue') return false;

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mCode = ord.code.toLowerCase().includes(q);
        const mClient = ord.clientName.toLowerCase().includes(q);
        const mPhone = ord.clientPhone.toLowerCase().includes(q);
        const mProduct = ord.productName.toLowerCase().includes(q);
        return mCode || mClient || mPhone || mProduct;
      }

      return true;
    });
  }, [orders, filterTab, searchTerm]);

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

  const handleSendWhatsApp = (order: Order) => {
    const text = generateWhatsAppMessage({
      clientName: order.clientName,
      productName: order.productName,
      quantity: order.quantity,
      widthCm: order.widthCm,
      heightCm: order.heightCm,
      printSides: order.printSides,
      materialName: order.materialName,
      totalPrice: order.finalPrice,
      unitPrice: order.unitPrice,
      inkCost: order.inkCost,
      depreciationCost: order.depreciationCost,
      hasDelivery: order.hasDelivery,
      deliveryFee: order.deliveryFee || 7,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
    });
    const link = generateWhatsAppLink(order.clientPhone, text);
    try {
      const opened = window.open(link, '_blank', 'noopener,noreferrer');
      if (!opened) {
        window.location.href = link;
      }
    } catch {
      window.location.href = link;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header with Search and Action */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Gestão de Pedidos & Ordens de Serviço
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Fila de impressão, medidas em centímetros (cm), pagamentos e envio pelo WhatsApp.
            </p>
          </div>

          <button
            onClick={onOpenGerarPedido}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Gerar Pedido</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setFilterTab('todos')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'todos'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({orders.length})
          </button>
          <button
            onClick={() => setFilterTab('producao')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'producao'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Em Produção ({orders.filter((o) => ['aprovado', 'em_producao'].includes(o.status)).length})
          </button>
          <button
            onClick={() => setFilterTab('prontos')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'prontos'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Prontos ({orders.filter((o) => o.status === 'pronto').length})
          </button>
          <button
            onClick={() => setFilterTab('orcamentos')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'orcamentos'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Orçamentos ({orders.filter((o) => o.type === 'orcamento').length})
          </button>
          <button
            onClick={() => setFilterTab('concluidos')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'concluidos'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Entregues ({orders.filter((o) => o.status === 'entregue').length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código (ex: OS-1042), cliente, telefone ou produto..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Nenhum pedido encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Não há registros correspondentes aos filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((ord) => {
            const next = getNextStage(ord.status);
            const statusConfig = STATUS_LABELS[ord.status] || STATUS_LABELS.orcamento;

            return (
              <div
                key={ord.id}
                className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-3 text-xs"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {ord.code}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                    {ord.type === 'orcamento' && (
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Orçamento
                      </span>
                    )}
                    <span className="text-slate-400 font-mono text-[11px]">
                      Criado em {formatDate(ord.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[10px] uppercase">Pagamento:</span>
                    <select
                      value={ord.paymentStatus}
                      onChange={(e) => onUpdatePayment(ord.id, e.target.value as PaymentStatus)}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded border cursor-pointer ${
                        ord.paymentStatus === 'pago'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : ord.paymentStatus === 'parcial'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="parcial">Sinal Pago</option>
                      <option value="pago">Pago Integral</option>
                    </select>
                  </div>
                </div>

                {/* Body row: Client, Product specs in CM and Financials */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-8 space-y-1">
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <span>{ord.clientName}</span>
                      {ord.clientPhone && (
                        <button
                          onClick={() => handleSendWhatsApp(ord)}
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          title="Enviar proposta ou atualizar cliente no WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>{ord.clientPhone}</span>
                        </button>
                      )}
                    </div>

                    <div className="text-slate-700">
                      <span className="font-bold text-slate-900">{ord.quantity.toLocaleString('pt-BR')}x</span>{' '}
                      <span className="font-medium">{ord.productName}</span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-700">Tamanho: {ord.widthCm} x {ord.heightCm} cm</span>
                      <span className="font-medium text-slate-600">({formatPrintSides(ord.printSides)})</span>
                      {ord.sheetType && (
                        <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded font-bold text-[10px]">
                          {ord.sheetType === 'bobina'
                            ? `Bobina ${ord.rollWidthCm || 60} cm`
                            : `Folha ${ord.sheetType.toUpperCase()}`}
                        </span>
                      )}
                      {ord.hasDelivery && (
                        <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-1.5 py-0.2 rounded font-bold text-[10px]">
                          🚚 Entrega (+R$ 7)
                        </span>
                      )}
                      <span>·</span>
                      <span>Material: {ord.materialName}</span>
                      <span>·</span>
                      <span>Máquina: {ord.equipmentName}</span>
                    </div>

                    {ord.notes && (
                      <div className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded">
                        Obs: {ord.notes}
                      </div>
                    )}
                  </div>

                  <div className="sm:col-span-4 flex flex-col sm:items-end justify-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-xs text-slate-400 uppercase">Valor Total</div>
                    <div className="text-xl font-black font-mono text-slate-900 tabular-nums">
                      {formatBRL(ord.finalPrice)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Unitário: {formatBRL(ord.unitPrice)}
                    </div>
                  </div>
                </div>

                {/* Footer Tools and Status Advance */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => onViewJobTicket(ord)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Ver e Imprimir Comanda de Produção com medidas em cm"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-700" />
                      <span>Comanda</span>
                    </button>

                    <button
                      onClick={() => handleSendWhatsApp(ord)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => onEditOrder(ord)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                      title="Editar dados e valores deste pedido"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-700" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => setOrderToDelete(ord)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors cursor-pointer"
                      title="Excluir este pedido"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Excluir</span>
                    </button>
                  </div>

                  {next ? (
                    <button
                      onClick={() => onUpdateStatus(ord.id, next)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>Avançar para {STATUS_LABELS[next]?.label}</span>
                      <ArrowRight className="w-3 h-3 text-amber-400" />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Concluído
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>Excluir {orderToDelete.type === 'pedido' ? 'Pedido' : 'Orçamento'}?</span>
              </div>
              <button
                onClick={() => setOrderToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Tem certeza que deseja excluir permanentemente o registro{' '}
                <strong className="text-slate-900 font-mono">{orderToDelete.code}</strong> de{' '}
                <strong className="text-slate-900">{orderToDelete.clientName}</strong>?
              </p>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium">
                <div>📦 {orderToDelete.productName} ({orderToDelete.quantity.toLocaleString('pt-BR')} un)</div>
                <div className="text-slate-500 mt-0.5">💰 Valor: {formatBRL(orderToDelete.finalPrice)}</div>
              </div>
              <p className="text-[11px] text-red-500 font-medium">
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteOrder(orderToDelete.id);
                  setOrderToDelete(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors cursor-pointer"
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
