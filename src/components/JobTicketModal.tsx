import React from 'react';
import { Order } from '../types';
import { formatDate } from '../utils/calculator';
import { Printer, X } from 'lucide-react';

interface JobTicketModalProps {
  order: Order;
  onClose: () => void;
}

export const JobTicketModal: React.FC<JobTicketModalProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-300 max-h-[92vh] overflow-y-auto">
        {/* Actions header (Hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              Comanda de Produção — {order.code}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Imprimir Ficha</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Production Job Ticket Layout */}
        <div className="border-2 border-slate-900 text-slate-900 p-5 font-sans print-page text-xs space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
            <div>
              <div className="text-lg font-black tracking-tight">PrintFlow Gráfica Rápida</div>
              <div className="text-[11px] text-slate-600 font-semibold uppercase">
                FICHA TÉCNICA DE PRODUÇÃO / BANCADA (JOB TICKET)
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Ordem de Serviço</div>
              <div className="text-2xl font-black font-mono text-slate-900">{order.code}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Data: {formatDate(order.createdAt)}
              </div>
            </div>
          </div>

          {/* Client & Production Deadlines Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-100 p-3 rounded-lg border border-slate-300">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Cliente / Solicitante
              </span>
              <span className="font-bold text-slate-900 text-sm">{order.clientName}</span>
              <div className="text-[11px] font-mono text-slate-600">{order.clientPhone}</div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Prazo de Entrega
              </span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {formatDate(order.deadline)}
              </span>
            </div>

            <div className="sm:text-right col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Pagamento
              </span>
              <span className="font-bold uppercase text-slate-800">
                {order.paymentStatus === 'pago' ? 'PAGO (LIBERADO)' : 'PENDENTE / SINAL'}
              </span>
            </div>
          </div>

          {/* Technical Specifications in Centimeters */}
          <div className="border border-slate-300 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-slate-900 text-sm">{order.productName}</span>
                <div className="text-slate-600">
                  <span className="font-bold">Papel:</span> {order.materialName} ·{' '}
                  <span className="font-bold">Máquina:</span> {order.equipmentName}
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono text-slate-900">
                  {order.quantity.toLocaleString('pt-BR')} unidades
                </span>
              </div>
            </div>

            {/* Imposition Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-[11px]">
              <div>
                <span className="text-[9px] font-sans text-slate-500 uppercase block">
                  Tamanho de Corte
                </span>
                <span className="font-bold text-slate-900">
                  {order.widthCm} × {order.heightCm} cm
                </span>
              </div>

              <div>
                <span className="text-[9px] font-sans text-slate-500 uppercase block">
                  Cores / Lados
                </span>
                <span className="font-bold text-slate-900">{order.printSides}</span>
              </div>

              <div>
                <span className="text-[9px] font-sans text-slate-500 uppercase block">
                  Rendimento Imposição
                </span>
                <span className="font-bold text-amber-800">
                  {order.itemsPerSheet} unid / folha
                </span>
              </div>

              <div>
                <span className="text-[9px] font-sans text-slate-500 uppercase block">
                  Requisição de Papel
                </span>
                <span className="font-bold text-slate-900">
                  {order.sheetsNeeded} + {order.wasteSheets} quebra ={' '}
                  {(order.sheetsNeeded || 0) + (order.wasteSheets || 0)} folhas
                </span>
              </div>
            </div>

            {order.notes && (
              <div className="text-xs text-slate-700 bg-amber-50/70 p-2 rounded border border-amber-200">
                <span className="font-bold">Instruções Técnicas:</span> {order.notes}
              </div>
            )}
          </div>

          {/* Operator Signoff & Quality Assurance */}
          <div className="border border-slate-300 rounded-lg p-3 grid grid-cols-3 gap-4 pt-4 text-[11px]">
            <div className="border-t border-slate-400 pt-2 text-center">
              <span className="text-[10px] text-slate-500 uppercase block">
                Impressão (Operador)
              </span>
              <div className="h-6"></div>
              <span className="font-mono text-slate-400">____/____/________</span>
            </div>

            <div className="border-t border-slate-400 pt-2 text-center">
              <span className="text-[10px] text-slate-500 uppercase block">
                Corte / Acabamento
              </span>
              <div className="h-6"></div>
              <span className="font-mono text-slate-400">____/____/________</span>
            </div>

            <div className="border-t border-slate-400 pt-2 text-center">
              <span className="text-[10px] text-slate-500 uppercase block">
                Conferência de Qualidade
              </span>
              <div className="h-6"></div>
              <span className="font-mono text-slate-400">Aprovado p/ Entrega</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
