/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CompanySettings,
  Equipment,
  Invoice,
  Material,
  Order,
  OrderStatus,
  PaymentStatus,
  StockMovement,
} from './types';
import { StorageService } from './services/storageService';
import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { QuotationView } from './components/QuotationView';
import { InventoryView } from './components/InventoryView';
import { EquipmentsView } from './components/EquipmentsView';
import { InvoicesView } from './components/InvoicesView';
import { JobTicketModal } from './components/JobTicketModal';
import { ProposalPrintModal } from './components/ProposalPrintModal';
import { SettingsModal } from './components/SettingsModal';
import { CheckCircle2, Info } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Application Data States
  const [settings, setSettings] = useState<CompanySettings>(StorageService.getSettings());
  const [materials, setMaterials] = useState<Material[]>(StorageService.getMaterials());
  const [equipments, setEquipments] = useState<Equipment[]>(StorageService.getEquipments());
  const [orders, setOrders] = useState<Order[]>(StorageService.getOrders());
  const [invoices, setInvoices] = useState<Invoice[]>(StorageService.getInvoices());
  const [movements, setMovements] = useState<StockMovement[]>(
    StorageService.getStockMovements()
  );

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [jobTicketOrder, setJobTicketOrder] = useState<Order | null>(null);
  const [proposalPrintOrder, setProposalPrintOrder] = useState<Order | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Sync state helpers
  const refreshData = () => {
    setSettings(StorageService.getSettings());
    setMaterials(StorageService.getMaterials());
    setEquipments(StorageService.getEquipments());
    setOrders(StorageService.getOrders());
    setInvoices(StorageService.getInvoices());
    setMovements(StorageService.getStockMovements());
  };

  const handleSaveOrder = (newOrder: Order) => {
    const existing = StorageService.getOrders();
    const updated = [newOrder, ...existing.filter((o) => o.id !== newOrder.id)];
    StorageService.saveOrders(updated);

    // If order was created in production state, deduct stock
    if (newOrder.type === 'pedido' && newOrder.status !== 'orcamento') {
      StorageService.deductStockForOrder(newOrder);
    }

    refreshData();
    showNotification(
      `${newOrder.type === 'pedido' ? 'Pedido' : 'Orçamento'} ${newOrder.code} salvo com sucesso!`
    );
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    const allOrders = StorageService.getOrders();
    const idx = allOrders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;

    const order = allOrders[idx];
    const updatedOrder: Order = {
      ...order,
      status: nextStatus,
    };

    allOrders[idx] = updatedOrder;
    StorageService.saveOrders(allOrders);

    // If order entered production, deduct stock automatically
    if (['em_producao', 'acabamento', 'pronto', 'entregue'].includes(nextStatus)) {
      StorageService.deductStockForOrder(updatedOrder);
    }

    // If order reached finished state and auto-invoicing is enabled, generate NFS-e automatically!
    if (
      (nextStatus === 'pronto' || nextStatus === 'entregue') &&
      settings.autoIssueInvoiceOnFinish &&
      !order.hasNfIssued
    ) {
      const inv = StorageService.issueInvoiceForOrder(updatedOrder);
      showNotification(
        `Pedido ${order.code} concluído! Nota Fiscal NFS-e #${inv.number} gerada automaticamente.`
      );
    } else {
      showNotification(`Pedido ${order.code} atualizado para "${nextStatus.replace('_', ' ')}".`);
    }

    refreshData();
  };

  const handleUpdatePayment = (orderId: string, paymentStatus: PaymentStatus) => {
    const allOrders = StorageService.getOrders();
    const idx = allOrders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;

    allOrders[idx].paymentStatus = paymentStatus;
    if (paymentStatus === 'pago') {
      allOrders[idx].amountPaid = allOrders[idx].total;
    }
    StorageService.saveOrders(allOrders);
    refreshData();
    showNotification(`Status de pagamento da OS ${allOrders[idx].code} alterado para "${paymentStatus}".`);
  };

  const handleIssueInvoice = (order: Order) => {
    const inv = StorageService.issueInvoiceForOrder(order);
    refreshData();
    showNotification(`Nota Fiscal NFS-e #${inv.number} autorizada e vinculada à OS ${order.code}!`);
  };

  const handleConvertToOrder = (quoteId: string) => {
    const updated = StorageService.convertQuoteToOrder(quoteId);
    if (updated) {
      // Deduct stock for new production order
      StorageService.deductStockForOrder(updated);
      refreshData();
      showNotification(`Orçamento aprovado e convertido na Ordem de Serviço ${updated.code}!`);
    }
  };

  const handleRecordStockMovement = (
    materialId: string,
    type: 'entrada' | 'saida_manual' | 'ajuste',
    quantity: number,
    notes: string
  ) => {
    StorageService.recordStockMovement(materialId, type, quantity, notes);
    refreshData();
    showNotification(`Movimentação de estoque registrada com sucesso!`);
  };

  const handleAddMaterial = (newMat: Material) => {
    const all = StorageService.getMaterials();
    const updated = [...all, newMat];
    StorageService.saveMaterials(updated);
    refreshData();
    showNotification(`Insumo "${newMat.name}" cadastrado com sucesso!`);
  };

  const handleAddEquipment = (newEq: Equipment) => {
    const all = StorageService.getEquipments();
    const updated = [...all, newEq];
    StorageService.saveEquipments(updated);
    refreshData();
    showNotification(`Equipamento "${newEq.name}" cadastrado com sucesso!`);
  };

  const handleUpdateEquipment = (updatedEq: Equipment) => {
    const all = StorageService.getEquipments();
    const idx = all.findIndex((e) => e.id === updatedEq.id);
    if (idx !== -1) {
      all[idx] = updatedEq;
      StorageService.saveEquipments(all);
      refreshData();
    }
  };

  const handleSaveSettings = (newSettings: CompanySettings) => {
    StorageService.saveSettings(newSettings);
    refreshData();
    showNotification(`Configurações da gráfica e fiscais salvas com sucesso!`);
  };

  const handleResetData = () => {
    StorageService.resetAll();
    refreshData();
    showNotification(`Dados restaurados para o padrão de demonstração.`);
  };

  const lowStockCount = materials.filter((m) => m.currentStock <= m.minStock).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* Main Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewOrder={() => setActiveTab('quotation')}
        onOpenSettings={() => setIsSettingsOpen(true)}
        lowStockCount={lowStockCount}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            orders={orders}
            materials={materials}
            equipments={equipments}
            onNavigateTab={setActiveTab}
            onOpenNewOrder={() => setActiveTab('quotation')}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onViewJobTicket={(ord) => setJobTicketOrder(ord)}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            onUpdateStatus={handleUpdateOrderStatus}
            onUpdatePayment={handleUpdatePayment}
            onIssueInvoice={handleIssueInvoice}
            onViewJobTicket={(ord) => setJobTicketOrder(ord)}
            onPrintProposal={(ord) => setProposalPrintOrder(ord)}
            onConvertToOrder={handleConvertToOrder}
          />
        )}

        {activeTab === 'quotation' && (
          <QuotationView
            materials={materials}
            equipments={equipments}
            onSaveOrder={handleSaveOrder}
            onPrintProposal={(ord) => setProposalPrintOrder(ord)}
            defaultMarkup={settings.defaultMarkupPercent}
            wastePercent={settings.technicalWastePercent}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            materials={materials}
            movements={movements}
            onAddMaterial={handleAddMaterial}
            onRecordMovement={handleRecordStockMovement}
          />
        )}

        {activeTab === 'equipments' && (
          <EquipmentsView
            equipments={equipments}
            onAddEquipment={handleAddEquipment}
            onUpdateEquipment={handleUpdateEquipment}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesView
            invoices={invoices}
            orders={orders}
            settings={settings}
            onIssueInvoice={handleIssueInvoice}
          />
        )}
      </main>

      {/* Modals */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onResetData={handleResetData}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {jobTicketOrder && (
        <JobTicketModal
          order={jobTicketOrder}
          settings={settings}
          onClose={() => setJobTicketOrder(null)}
        />
      )}

      {proposalPrintOrder && (
        <ProposalPrintModal
          order={proposalPrintOrder}
          settings={settings}
          onClose={() => setProposalPrintOrder(null)}
        />
      )}
    </div>
  );
}
