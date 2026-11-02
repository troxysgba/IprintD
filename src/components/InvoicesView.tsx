import React, { useState } from 'react';
import { CompanySettings, Invoice, Order } from '../types';
import { formatBRL, formatDateTime } from '../utils/calculator';
import {
  CheckCircle2,
  Download,
  FileCheck2,
  FileCode,
  Filter,
  Plus,
  Printer,
  Receipt,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';

interface InvoicesViewProps {
  invoices: Invoice[];
  orders: Order[];
  settings: CompanySettings;
  onIssueInvoice: (order: Order) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  orders,
  settings,
  onIssueInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Orders without invoice
  const pendingOrders = orders.filter((o) => !o.hasNfIssued && o.type === 'pedido');

  const filteredInvoices = invoices.filter((inv) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        inv.number.toString().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.orderCode.toLowerCase().includes(q) ||
        inv.accessKey.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalIssuedAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalIssTax = invoices.reduce((sum, inv) => sum + inv.issAmount, 0);

  const handleManualIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find((o) => o.id === selectedOrderId);
    if (!order) return;
    onIssueInvoice(order);
    setIsManualModalOpen(false);
  };

  const handleDownloadXml = (invoice: Invoice) => {
    const blob = new Blob([invoice.xmlData], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NFSe_${invoice.number}_${invoice.accessKey.slice(0, 15)}.xml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintDanfe = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Fiscal Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total de Notas Emitidas
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {invoices.length} documentos
          </div>
          <div className="text-xs text-slate-400 mt-0.5">NFS-e autorizadas</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Faturamento Fiscal
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1 tabular-nums">
            {formatBRL(totalIssuedAmount)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Base tributável apurada</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ISSQN Apurado ({settings.defaultIssRate}%)
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-1 tabular-nums">
            {formatBRL(totalIssTax)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">Prefeitura de São Paulo</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Automação Fiscal
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Emissão Automática Ativa</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Gera NFS-e ao finalizar pedido
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Emissor de Documentos Fiscais Eletrônicos (NFS-e / DANFE)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão tributária, geração de chave de acesso SEFAZ, arquivos XML e impressão oficial.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (pendingOrders.length > 0) {
                  setSelectedOrderId(pendingOrders[0].id);
                }
                setIsManualModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              Emitir Nota p/ Pedido
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número da nota (ex: 1042), cliente, código da OS ou chave de acesso..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-4 py-3">Nº Nota</th>
                <th className="px-4 py-3">Emissão</th>
                <th className="px-4 py-3">Pedido / OS</th>
                <th className="px-4 py-3">Tomador (Cliente)</th>
                <th className="px-4 py-3 text-right">Valor Serviços</th>
                <th className="px-4 py-3 text-right">ISSQN ({settings.defaultIssRate}%)</th>
                <th className="px-4 py-3 text-right">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    NFS-e #{inv.number}
                  </td>
                  <td className="px-4 py-3 font-sans text-slate-500 whitespace-nowrap">
                    {formatDateTime(inv.issueDate)}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {inv.orderCode}
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <div className="font-semibold text-slate-800">{inv.clientName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{inv.clientDoc}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">
                    {formatBRL(inv.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-700 font-semibold tabular-nums">
                    {formatBRL(inv.issAmount)}
                  </td>
                  <td className="px-4 py-3 text-right font-sans">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Autorizada
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-sans space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                      title="Visualizar espelho da Nota Fiscal"
                    >
                      Ver DANFE
                    </button>
                    <button
                      onClick={() => handleDownloadXml(inv)}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                      title="Baixar arquivo XML para a contabilidade"
                    >
                      XML
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Manual Invoice Issuance */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Emitir Nota Fiscal (NFS-e)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Selecione uma Ordem de Serviço concluída ou em andamento para gerar o documento fiscal eletrônico imediatamente.
            </p>

            {pendingOrders.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
                Todos os pedidos em aberto já possuem Nota Fiscal emitida!
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-lg"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualIssueSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selecione o Pedido / OS
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => setSelectedOrderId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {pendingOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.code} - {o.clientName} ({formatBRL(o.total)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Regime Tributário:</span>
                    <span className="font-semibold text-slate-800">{settings.taxRegime}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Código de Serviço:</span>
                    <span className="font-semibold text-slate-800">13.05 (Serviços Gráficos)</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Alíquota ISSQN:</span>
                    <span className="font-semibold text-emerald-700">{settings.defaultIssRate}%</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                  >
                    Emitir e Transmitir NFS-e
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Official DANFE / NFS-e Document Viewer */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl border border-slate-300 max-h-[92vh] overflow-y-auto">
            {/* Action Bar (Hidden when printing) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 no-print">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Documento Fiscal: NFS-e #{selectedInvoice.number}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadXml(selectedInvoice)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-slate-600" />
                  Baixar XML
                </button>
                <button
                  onClick={handlePrintDanfe}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  Imprimir DANFE
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Authentic Printable NFS-e / DANFE Layout */}
            <div className="border-2 border-slate-800 text-slate-900 p-5 font-sans print-page text-xs space-y-3">
              {/* Header Box */}
              <div className="grid grid-cols-12 gap-2 border-b-2 border-slate-800 pb-3">
                <div className="col-span-8 space-y-1">
                  <div className="font-black text-sm uppercase tracking-wide">
                    PREFEITURA MUNICIPAL DE SÃO PAULO
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 uppercase">
                    SECRETARIA MUNICIPAL DA FAZENDA - NOTA FISCAL DE SERVIÇOS ELETRÔNICA (NFS-e)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    RPS (Recibo Provisório de Serviços) convertido automaticamente conforme OS {selectedInvoice.orderCode}
                  </div>
                </div>

                <div className="col-span-4 border-l border-slate-300 pl-3 text-right">
                  <div className="text-[10px] uppercase text-slate-500">Número da NFS-e</div>
                  <div className="text-xl font-black font-mono text-slate-900">
                    {selectedInvoice.number}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Data: {formatDateTime(selectedInvoice.issueDate)}
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono font-bold">
                    Cód. Verificação: {selectedInvoice.verificationCode}
                  </div>
                </div>
              </div>

              {/* Prestador de Serviços */}
              <div className="border border-slate-300 rounded p-3 space-y-1 bg-slate-50/50">
                <div className="font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                  PRESTADOR DE SERVIÇOS (GRÁFICA)
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="font-bold">{settings.legalName}</span>
                    <div className="text-slate-600">{settings.tradeName}</div>
                    <div className="text-slate-500">{settings.address}</div>
                  </div>
                  <div className="text-right space-y-0.5 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 font-sans">CNPJ:</span> {settings.cnpj}
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans">Inscrição Municipal:</span>{' '}
                      {settings.im}
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans">Regime:</span> {settings.taxRegime}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tomador de Serviços */}
              <div className="border border-slate-300 rounded p-3 space-y-1 bg-slate-50/50">
                <div className="font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                  TOMADOR DE SERVIÇOS (CLIENTE)
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="font-bold">{selectedInvoice.clientName}</span>
                    <div className="text-slate-500">{selectedInvoice.clientAddress}</div>
                  </div>
                  <div className="text-right font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 font-sans">CPF / CNPJ:</span>{' '}
                      {selectedInvoice.clientDoc}
                    </div>
                  </div>
                </div>
              </div>

              {/* Discriminação dos Serviços */}
              <div className="border border-slate-300 rounded p-3 space-y-1">
                <div className="font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                  DISCRIMINAÇÃO DOS SERVIÇOS
                </div>
                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed pt-1 text-[11px]">
                  {selectedInvoice.servicesDescription}
                </div>
                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                  Subitem LC 116/03: 13.05 - Composição gráfica, fotocomposição, clicheria, fotolitografia e acabamento gráfico.
                </div>
              </div>

              {/* Valores e Impostos */}
              <div className="border border-slate-300 rounded p-3 space-y-2 bg-slate-50/50">
                <div className="font-bold text-[11px] uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                  CÁLCULO DO ISSQN E RETENÇÕES TRIBUTÁRIAS
                </div>

                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="border border-slate-200 p-1.5 bg-white rounded">
                    <div className="text-[10px] font-sans text-slate-500">Valor dos Serviços</div>
                    <div className="font-bold text-slate-900">
                      {formatBRL(selectedInvoice.totalAmount)}
                    </div>
                  </div>
                  <div className="border border-slate-200 p-1.5 bg-white rounded">
                    <div className="text-[10px] font-sans text-slate-500">Base de Cálculo</div>
                    <div className="font-bold text-slate-900">
                      {formatBRL(selectedInvoice.taxableBase)}
                    </div>
                  </div>
                  <div className="border border-slate-200 p-1.5 bg-white rounded">
                    <div className="text-[10px] font-sans text-slate-500">Alíquota ISS</div>
                    <div className="font-bold text-slate-900">{selectedInvoice.issRate}%</div>
                  </div>
                  <div className="border border-slate-200 p-1.5 bg-white rounded">
                    <div className="text-[10px] font-sans text-slate-500">Valor do ISS</div>
                    <div className="font-bold text-emerald-700">
                      {formatBRL(selectedInvoice.issAmount)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] pt-1">
                  <div className="border border-slate-200 p-1 bg-white rounded">
                    <span className="text-[10px] font-sans text-slate-500">PIS (0,65%):</span>{' '}
                    {formatBRL(selectedInvoice.pisAmount)}
                  </div>
                  <div className="border border-slate-200 p-1 bg-white rounded">
                    <span className="text-[10px] font-sans text-slate-500">COFINS (3,0%):</span>{' '}
                    {formatBRL(selectedInvoice.cofinsAmount)}
                  </div>
                  <div className="border border-slate-200 p-1 bg-white rounded font-bold text-slate-900">
                    <span className="text-[10px] font-sans text-slate-500">Valor Líquido:</span>{' '}
                    {formatBRL(selectedInvoice.netAmount)}
                  </div>
                </div>
              </div>

              {/* Chave de Acesso Barcode & Protocol */}
              <div className="border border-slate-300 rounded p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-sans">
                    Chave de Acesso SEFAZ / Prefeitura (44 Dígitos)
                  </div>
                  <div className="font-mono font-bold text-xs tracking-wider text-slate-800">
                    {selectedInvoice.accessKey}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Protocolo de Autorização: {selectedInvoice.protocol}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <div className="w-16 h-16 border border-slate-800 p-1 flex items-center justify-center font-mono text-[9px] text-center bg-slate-100">
                    [QR-CODE FISCAL]
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
