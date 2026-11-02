import React from 'react';
import { CompanySettings, Order } from '../types';
import { formatBRL, formatDateTime } from '../utils/calculator';
import { CheckSquare, Printer, X } from 'lucide-react';

interface JobTicketModalProps {
  order: Order;
  settings: CompanySettings;
  onClose: () => void;
}

export const JobTicketModal: React.FC<JobTicketModalProps> = ({
  order,
  settings,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-slate-300 max-h-[92vh] overflow-y-auto">
        {/* Actions header (Hidden in print) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              Ficha Técnica de Produção — {order.code}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              Imprimir Ficha
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
        <div className="border-2 border-slate-900 text-slate-900 p-6 font-sans print-page text-xs space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
            <div>
              <div className="text-lg font-black tracking-tight">{settings.tradeName}</div>
              <div className="text-[11px] text-slate-600 font-semibold uppercase">
                COMANDA DE PRODUÇÃO & CONTROLE DE QUALIDADE (JOB TICKET)
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold text-slate-500 uppercase">Ordem de Serviço</div>
              <div className="text-2xl font-black font-mono text-slate-900">{order.code}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Entrada: {formatDateTime(order.createdAt)}
              </div>
            </div>
          </div>

          {/* Client & Production Deadlines Strip */}
          <div className="grid grid-cols-3 gap-3 bg-slate-100 p-3 rounded border border-slate-300">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Cliente / Tomador
              </span>
              <span className="font-bold text-slate-900 text-sm">{order.clientName}</span>
              <div className="text-[11px] text-slate-600">{order.clientPhone}</div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Prazo Impreterível de Entrega
              </span>
              <span className="font-mono font-black text-sm text-amber-800">
                {formatDateTime(order.deadline)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Status Financeiro
              </span>
              <span className="font-bold uppercase text-slate-800">
                {order.paymentStatus === 'pago' ? 'PAGO (LIBERADO)' : 'PENDENTE / SINAL'}
              </span>
            </div>
          </div>

          {/* Technical Specifications per Item */}
          <div className="space-y-4">
            <div className="font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
              ITENS PARA IMPRESSÃO E ACABAMENTO
            </div>

            {order.items.map((item, idx) => (
              <div key={item.id || idx} className="border border-slate-300 rounded p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded mr-2">
                      ITEM #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{item.description}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black font-mono text-slate-900">
                      {item.quantity.toLocaleString('pt-BR')} unidades
                    </span>
                  </div>
                </div>

                {/* Technical Imposition Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-[11px]">
                  <div>
                    <span className="text-[9px] font-sans text-slate-500 uppercase block">
                      Formato de Corte
                    </span>
                    <span className="font-bold text-slate-900">
                      {item.widthMm} × {item.heightMm} mm
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-sans text-slate-500 uppercase block">
                      Impressão (Cores)
                    </span>
                    <span className="font-bold text-slate-900">{item.printSides}</span>
                  </div>

                  <div>
                    <span className="text-[9px] font-sans text-slate-500 uppercase block">
                      Rendimento Imposição
                    </span>
                    <span className="font-bold text-amber-800">
                      {item.itemsPerSheet} unid / folha ({item.sheetFormat})
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-sans text-slate-500 uppercase block">
                      Requisição Estoque
                    </span>
                    <span className="font-bold text-slate-900">
                      {item.sheetsNeeded} + {item.wasteSheets} quebra ={' '}
                      {(item.sheetsNeeded || 0) + (item.wasteSheets || 0)} folhas
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-700">
                  <span className="font-bold">Papel/Substrato:</span> {item.materialName} ·{' '}
                  <span className="font-bold">Equipamento:</span> {item.equipmentName}
                </div>

                {/* Finishing Checklist */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Checklist de Acabamentos Obrigatórios:
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {item.finishings.length > 0 ? (
                      item.finishings.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-center gap-1.5 bg-white border border-slate-300 px-2.5 py-1 rounded font-medium text-xs text-slate-800"
                        >
                          <input type="checkbox" className="w-3.5 h-3.5 rounded" />
                          <span>{f.name}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">
                        Refile padrão na guilhotina conforme esquadro.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Operator Signoff & Quality Assurance */}
          <div className="border border-slate-300 rounded p-3 grid grid-cols-3 gap-4 pt-3 text-[11px]">
            <div className="border-t border-slate-400 pt-2 text-center">
              <span className="text-[10px] text-slate-500 uppercase block">
                Operador Impressão (Visto)
              </span>
              <div className="h-6"></div>
              <span className="font-mono text-slate-400">____/____/________</span>
            </div>

            <div className="border-t border-slate-400 pt-2 text-center">
              <span className="text-[10px] text-slate-500 uppercase block">
                Operador Acabamento / Corte
              </span>
              <div className="h-6"></div>
              <span className="font-mono text-slate-400">____/____/________</span>
            </div>

            <div className="border-t border-slate-400 pt-2 text-center">
              <span className="text-[10px] text-slate-500 uppercase block">
                Controle de Qualidade & Embalagem
              </span>
              <div className="h-6"></div>
              <span className="font-mono text-slate-400">Conferido e Aprovado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
