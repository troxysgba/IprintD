import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, PaymentStatus } from '../types';
import { formatBRL, formatDateTime } from '../utils/calculator';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Filter,
  Package,
  Printer,
  Receipt,
  Search,
} from 'lucide-react';

interface OrdersViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePayment: (orderId: string, paymentStatus: PaymentStatus) => void;
  onIssueInvoice: (order: Order) => void;
  onViewJobTicket: (order: Order) => void;
  onPrintProposal: (order: Order) => void;
  onConvertToOrder: (quoteId: string) => void;
}

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  orcamento: { label: 'Orçamento Aberto', color: 'bg-slate-100 text-slate-700' },
  aprovado: { label: 'Aprovado / Fila', color: 'bg-blue-100 text-blue-800' },
  pre_impressao: { label: 'Pré-Impressão (Arte)', color: 'bg-indigo-100 text-indigo-800' },
  em_producao: { label: 'Em Impressão', color: 'bg-amber-100 text-amber-900' },
  acabamento: { label: 'Acabamento / Corte', color: 'bg-orange-100 text-orange-900' },
  pronto: { label: 'Pronto p/ Retirada', color: 'bg-emerald-100 text-emerald-800' },
  entregue: { label: 'Entregue / Concluído', color: 'bg-slate-800 text-white' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onUpdateStatus,
  onUpdatePayment,
  onIssueInvoice,
  onViewJobTicket,
  onPrintProposal,
  onConvertToOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'pedidos' | 'orcamentos'>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Type match
      if (typeFilter === 'pedidos' && ord.type !== 'pedido') return false;
      if (typeFilter === 'orcamentos' && ord.type !== 'orcamento') return false;

      // Status match
      if (statusFilter !== 'todos' && ord.status !== statusFilter) return false;

      // Search match
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = ord.code.toLowerCase().includes(q);
        const matchClient = ord.clientName.toLowerCase().includes(q);
        const matchDoc = ord.clientDoc.toLowerCase().includes(q);
        const matchItems = ord.items.some((it) => it.description.toLowerCase().includes(q));
        return matchCode || matchClient || matchDoc || matchItems;
      }

      return true;
    });
  }, [orders, typeFilter, statusFilter, searchTerm]);

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'orcamento':
        return 'aprovado';
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
      {/* Header & Search Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Gestão de Pedidos & Ordens de Serviço (OS)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhe a fila de produção gráfica, status de pagamentos e emissão fiscal.
            </p>
          </div>

          {/* Interactive filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              onClick={() => setTypeFilter('todos')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === 'todos'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              onClick={() => setTypeFilter('pedidos')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === 'pedidos'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pedidos em Produção ({orders.filter((o) => o.type === 'pedido').length})
            </button>
            <button
              onClick={() => setTypeFilter('orcamentos')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                typeFilter === 'orcamentos'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Orçamentos ({orders.filter((o) => o.type === 'orcamento').length})
            </button>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, CPF/CNPJ, código (ex: OS-2026-0140) ou produto..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="todos">Todos os Status</option>
              <option value="orcamento">Orçamento Aberto</option>
              <option value="aprovado">Aprovado / Fila</option>
              <option value="pre_impressao">Pré-Impressão</option>
              <option value="em_producao">Em Impressão</option>
              <option value="acabamento">Acabamento</option>
              <option value="pronto">Pronto p/ Retirada</option>
              <option value="entregue">Concluído</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-700">
            Nenhum pedido ou orçamento encontrado
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Não encontramos nenhum registro correspondente ao filtro aplicado. Tente buscar por outro termo ou gere um novo orçamento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            const statusConfig = STATUS_LABELS[order.status] || STATUS_LABELS.orcamento;

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  {/* Left: Code, Client & Metadata */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-base text-slate-900">
                        {order.code}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                      {order.type === 'orcamento' && (
                        <span className="text-xs font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
                          Orçamento
                        </span>
                      )}
                      {order.hasNfIssued && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                          <Receipt className="w-3 h-3" /> NFS-e #{order.invoiceNumber}
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-semibold text-slate-800">
                      {order.clientName}
                      <span className="font-normal text-xs text-slate-500 ml-2">
                        {order.clientDoc} · {order.clientPhone || 'Sem telefone'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Criado em: {formatDateTime(order.createdAt)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3 h-3 text-amber-500" /> Entrega prevista:{' '}
                        {formatDateTime(order.deadline)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Values, Payment & Next Workflow Stage */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-500 uppercase tracking-wider">
                        Valor Total
                      </div>
                      <div className="text-xl font-black font-mono text-slate-900 tabular-nums">
                        {formatBRL(order.total)}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-mono font-medium">
                        Margem est.: {formatBRL(order.profitEstimate)}
                      </div>
                    </div>

                    {/* Payment Status Dropdown */}
                    <div className="text-xs">
                      <span className="block text-slate-400 mb-1 text-[10px] uppercase">
                        Pagamento:
                      </span>
                      <select
                        value={order.paymentStatus}
                        onChange={(e) =>
                          onUpdatePayment(order.id, e.target.value as PaymentStatus)
                        }
                        className={`px-2.5 py-1 rounded font-semibold text-xs border ${
                          order.paymentStatus === 'pago'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : order.paymentStatus === 'parcial'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="parcial">Parcial (Sinal)</option>
                        <option value="pago">Pago Integral</option>
                      </select>
                    </div>

                    {/* Next Workflow Action Button */}
                    {order.type === 'orcamento' ? (
                      <button
                        onClick={() => onConvertToOrder(order.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <FileCheck className="w-4 h-4" /> Aprovar Orçamento
                      </button>
                    ) : nextStatus ? (
                      <button
                        onClick={() => onUpdateStatus(order.id, nextStatus)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                        title={`Avançar para: ${STATUS_LABELS[nextStatus]?.label}`}
                      >
                        <span>Avançar Etapa</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Concluído
                      </span>
                    )}
                  </div>
                </div>

                {/* Items Summary in this Order */}
                <div className="pt-3 space-y-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800">
                          {item.quantity.toLocaleString('pt-BR')}x {item.description}
                        </div>
                        <div className="text-slate-500 flex items-center gap-2">
                          <span>
                            {item.widthMm}x{item.heightMm} mm ({item.printSides})
                          </span>
                          <span>·</span>
                          <span>{item.materialName}</span>
                          <span>·</span>
                          <span className="font-mono text-amber-800 font-medium">
                            {item.sheetsNeeded || 0} folhas (+ {item.wasteSheets || 0}{' '}
                            quebra)
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-800 tabular-nums">
                          {formatBRL(item.totalPrice)}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {formatBRL(item.unitPrice)}/un
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Tools Bar */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-slate-500 italic max-w-md truncate">
                    {order.notes ? `Obs: ${order.notes}` : 'Sem observações técnicas.'}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Job Ticket (Comanda de Produção) */}
                    <button
                      onClick={() => onViewJobTicket(order)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer font-medium"
                      title="Ver Ficha Técnica para o operador de produção"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      Comanda de Produção
                    </button>

                    {/* Print Commercial Proposal / Quote */}
                    <button
                      onClick={() => onPrintProposal(order)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer font-medium"
                      title="Imprimir ou exportar Orçamento em PDF"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      Proposta Comercial
                    </button>

                    {/* Automatic Invoice Issuance Button */}
                    {!order.hasNfIssued ? (
                      <button
                        onClick={() => onIssueInvoice(order)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer font-semibold"
                        title="Emitir Nota Fiscal (NFS-e) Eletrônica para este pedido"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                        Emitir NFS-e
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> NF #{order.invoiceNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
