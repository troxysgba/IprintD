import React from 'react';
import { ActivePage } from '../types';
import {
  Boxes,
  Calculator,
  Cpu,
  LayoutDashboard,
  PlusCircle,
  Printer,
  ShoppingBag,
} from 'lucide-react';

interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  onOpenGerarPedido: () => void;
  ordersInProductionCount: number;
  lowStockCount: number;
  isCloudConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  onOpenGerarPedido,
  ordersInProductionCount,
  lowStockCount,
  isCloudConnected = true,
}) => {
  const navItems = [
    {
      id: 'visao_geral' as ActivePage,
      label: 'Visão Geral',
      icon: LayoutDashboard,
    },
    {
      id: 'pedidos' as ActivePage,
      label: 'Pedidos',
      icon: ShoppingBag,
      badge: ordersInProductionCount > 0 ? ordersInProductionCount : undefined,
    },
    {
      id: 'calculo_custo' as ActivePage,
      label: 'Cálculo de Custo',
      icon: Calculator,
    },
    {
      id: 'estoque' as ActivePage,
      label: 'Estoque',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'maquinas' as ActivePage,
      label: 'Máquinas',
      icon: Cpu,
    },
  ];

  return (
    <>
      {/* Top Header - Desktop and Mobile */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Wordmark */}
            <button
              onClick={() => setActivePage('visao_geral')}
              className="flex items-center gap-2.5 text-left focus:outline-none cursor-pointer shrink-0"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-xs shrink-0 bg-slate-900">
                <img
                  src="/assets/aistudio/hh1_400541ef.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-baseline">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  IprintDesginer
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links (Windows) */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                          item.badgeColor || 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Live Cloud Status & CTA */}
            <div className="flex items-center gap-2.5">
              <div
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-full"
                title="Banco de Dados Firestore ativo. Pedidos e alterações são sincronizados em tempo real entre todos os usuários."
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Nuvem em Tempo Real</span>
              </div>

              <button
                onClick={onOpenGerarPedido}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Gerar Pedido</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Ultra-practical for smartphones) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer relative min-w-[56px] ${
                isActive ? 'text-amber-600 font-bold' : 'text-slate-500'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                {item.badge && (
                  <span
                    className={`absolute -top-1 -right-2 text-[9px] font-mono font-bold px-1 py-0.2 rounded-full ${
                      item.badgeColor || 'bg-slate-800 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-[62px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
