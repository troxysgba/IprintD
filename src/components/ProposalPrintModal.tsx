import React from 'react';
import { CompanySettings, Order } from '../types';
import { formatBRL, formatDateTime } from '../utils/calculator';
import { FileText, Printer, X } from 'lucide-react';

interface ProposalPrintModalProps {
  order: Order;
  settings: CompanySettings;
  onClose: () => void;
}

export const ProposalPrintModal: React.FC<ProposalPrintModalProps> = ({
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
            <FileText className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              Proposta Comercial de Serviços Gráficos — {order.code}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              Imprimir Proposta / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Commercial Proposal Layout */}
        <div className="border border-slate-300 text-slate-900 p-8 font-sans print-page text-xs space-y-6">
          {/* Company Branding & Identification */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <div className="text-xl font-black tracking-tight text-slate-900">
                {settings.tradeName}
              </div>
              <div className="text-xs text-slate-600 font-semibold">{settings.legalName}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                CNPJ: {settings.cnpj} · Inscrição Municipal: {settings.im}
              </div>
              <div className="text-[11px] text-slate-500">{settings.address}</div>
              <div className="text-[11px] text-slate-500">
                WhatsApp: {settings.phone} · E-mail: {settings.email}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Proposta Comercial
              </span>
              <div className="text-2xl font-black font-mono text-slate-900">{order.code}</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Emissão: {formatDateTime(order.createdAt)}
              </div>
              <div className="text-[11px] text-amber-800 font-bold mt-1">
                Validade: 7 dias corridos
              </div>
            </div>
          </div>

          {/* Client Details Box */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Dados do Cliente / Solicitante
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Razão Social / Nome:</span>{' '}
                <span className="font-bold text-slate-900">{order.clientName}</span>
              </div>
              <div>
                <span className="text-slate-500">CPF / CNPJ:</span>{' '}
                <span className="font-mono font-semibold text-slate-900">{order.clientDoc}</span>
              </div>
              <div>
                <span className="text-slate-500">Telefone / Celular:</span>{' '}
                <span className="font-medium text-slate-900">{order.clientPhone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500">E-mail:</span>{' '}
                <span className="font-medium text-slate-900">{order.clientEmail || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
              Especificações e Valores dos Materiais
            </span>

            <table className="w-full text-left text-xs border border-slate-200 rounded">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Item & Descrição Técnica</th>
                  <th className="p-2.5 text-center">Formato</th>
                  <th className="p-2.5 text-center">Cores</th>
                  <th className="p-2.5 text-right">Qtd</th>
                  <th className="p-2.5 text-right">Unitário</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="p-2.5">
                      <div className="font-bold text-slate-900">{item.description}</div>
                      <div className="text-[11px] text-slate-500">
                        Papel: {item.materialName}
                        {item.finishings.length > 0 &&
                          ` | Acabamentos: ${item.finishings.map((f) => f.name).join(', ')}`}
                      </div>
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      {item.widthMm}x{item.heightMm} mm
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold">{item.printSides}</td>
                    <td className="p-2.5 text-right font-mono font-bold">
                      {item.quantity.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-2.5 text-right font-mono tabular-nums">
                      {formatBRL(item.unitPrice)}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatBRL(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-64 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-1.5 font-mono">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal:</span>
                <span>{formatBRL(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Desconto Especial:</span>
                  <span>- {formatBRL(order.discount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-300 flex justify-between text-base font-black text-slate-900">
                <span className="font-sans">VALOR TOTAL:</span>
                <span className="tabular-nums">{formatBRL(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Notes */}
          <div className="border border-slate-200 p-4 rounded-lg space-y-2 text-[11px] text-slate-600">
            <div className="font-bold uppercase text-slate-800">
              Condições Comerciais e Prazos:
            </div>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Prazo de Produção:</strong> 2 a 3 dias úteis a contar da aprovação formal
                do layout/arte e confirmação do pagamento.
              </li>
              <li>
                <strong>Formas de Pagamento:</strong> PIX, Cartão de Crédito/Débito, ou Sinal de 50%
                no ato da aprovação e 50% no momento da retirada.
              </li>
              <li>
                <strong>Emissão Fiscal:</strong> Nota Fiscal Eletrônica de Serviços (NFS-e) emitida
                automaticamente após a finalização do lote.
              </li>
              <li>
                <strong>Aprovação de Prova Digital:</strong> A conferência de textos, telefones,
                ortografia e fidelidade de cores da arte é de responsabilidade do contratante.
              </li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[11px]">
            <div className="border-t border-slate-400 pt-2">
              <span className="font-bold text-slate-800 block">{settings.legalName}</span>
              <span className="text-slate-500">Depto. Comercial / Atendimento</span>
            </div>

            <div className="border-t border-slate-400 pt-2">
              <span className="font-bold text-slate-800 block">{order.clientName}</span>
              <span className="text-slate-500">De Acordo / Assinatura do Cliente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
