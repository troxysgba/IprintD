import React, { useState } from 'react';
import { CompanySettings } from '../types';
import { RotateCcw, Save, Settings as SettingsIcon, X } from 'lucide-react';

interface SettingsModalProps {
  settings: CompanySettings;
  onSave: (settings: CompanySettings) => void;
  onResetData: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onResetData,
  onClose,
}) => {
  const [formData, setFormData] = useState<CompanySettings>({ ...settings });

  const handleChange = (
    field: keyof CompanySettings,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              Configurações da Gráfica & Parâmetros Fiscais
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Dados da Empresa */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
              1. Identificação da Gráfica Rápida
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={formData.tradeName}
                  onChange={(e) => handleChange('tradeName', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Razão Social</label>
                <input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => handleChange('legalName', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">CNPJ</label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => handleChange('cnpj', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Inscrição Municipal (IM)
                </label>
                <input
                  type="text"
                  value={formData.im}
                  onChange={(e) => handleChange('im', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">E-mail Comercial</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Parâmetros Fiscais */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
              2. Parâmetros Fiscais & Tributação
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Regime Tributário</label>
                <select
                  value={formData.taxRegime}
                  onChange={(e) => handleChange('taxRegime', e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                >
                  <option value="Simples Nacional">Simples Nacional (ME / EPP)</option>
                  <option value="MEI">MEI - Microempreendedor Individual</option>
                  <option value="Lucro Presumido">Lucro Presumido</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Alíquota ISSQN Padrão (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="2"
                  max="5"
                  value={formData.defaultIssRate}
                  onChange={(e) => handleChange('defaultIssRate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>
            </div>

            {/* Auto issue checkbox */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-xs">
                  Emissão Automática de Notas Fiscais (NFS-e)
                </span>
                <span className="text-[11px] text-slate-500">
                  Emitir e transmitir automaticamente a NFS-e quando a Ordem de Serviço for concluída.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoIssueInvoiceOnFinish}
                onChange={(e) => handleChange('autoIssueInvoiceOnFinish', e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Parâmetros de Custos & Margem */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-1">
              3. Parâmetros de Custo e Engenharia Gráfica
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Markup Padrão de Venda (%)
                </label>
                <input
                  type="number"
                  step="5"
                  min="20"
                  max="300"
                  value={formData.defaultMarkupPercent}
                  onChange={(e) =>
                    handleChange('defaultMarkupPercent', parseInt(e.target.value) || 100)
                  }
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Ex: 120% sobre o custo de produção
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Quebra Técnica de Papel (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="20"
                  value={formData.technicalWastePercent}
                  onChange={(e) =>
                    handleChange('technicalWastePercent', parseInt(e.target.value) || 5)
                  }
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Folhas extras calculadas para teste e acerto
                </span>
              </div>
            </div>
          </div>

          {/* Reset Demo Data & Submit */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (confirm('Deseja restaurar todos os dados para o padrão de demonstração da gráfica?')) {
                  onResetData();
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar Dados Demonstrativos
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                Salvar Configurações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
