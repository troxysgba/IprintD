/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ActivePage,
  Equipment,
  Material,
  Order,
  OrderStatus,
  PaymentStatus,
  QuickProductPreset,
  StockMovement,
} from './types';
import { StorageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { GerarPedidoModal } from './components/GerarPedidoModal';
import { JobTicketModal } from './components/JobTicketModal';
import { OverviewView } from './views/OverviewView';
import { OrdersView } from './views/OrdersView';
import { CostCalculatorView } from './views/CostCalculatorView';
import { InventoryView } from './views/InventoryView';
import { MachinesView } from './views/MachinesView';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('visao_geral');

  // Application Data States
  const [orders, setOrders] = useState<Order[]>(StorageService.getOrders());
  const [materials, setMaterials] = useState<Material[]>(StorageService.getMaterials());
  const [equipments, setEquipments] = useState<Equipment[]>(StorageService.getEquipments());
  const [movements, setMovements] = useState<StockMovement[]>(StorageService.getStockMovements());
  const [presets, setPresets] = useState<QuickProductPreset[]>(StorageService.getPresets());

  // Modals state
  const [isGerarPedidoOpen, setIsGerarPedidoOpen] = useState(false);
  const [orderPrefill, setOrderPrefill] = useState<Partial<Order> | null>(null);
  const [selectedJobTicketOrder, setSelectedJobTicketOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenGerarPedido = (prefill?: Partial<Order>) => {
    setOrderPrefill(prefill || null);
    setIsGerarPedidoOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync state helpers
  const refreshData = () => {
    setOrders(StorageService.getOrders());
    setMaterials(StorageService.getMaterials());
    setEquipments(StorageService.getEquipments());
    setMovements(StorageService.getStockMovements());
    setPresets(StorageService.getPresets());
  };

  const handleSaveOrder = (newOrder: Order) => {
    const existing = StorageService.getOrders();
    const updated = [newOrder, ...existing.filter((o) => o.id !== newOrder.id)];
    StorageService.saveOrders(updated);

    if (newOrder.type === 'pedido') {
      StorageService.deductStockForOrder(newOrder);
    }

    refreshData();
    showToast(
      `${newOrder.type === 'pedido' ? 'Pedido' : 'Orçamento'} ${newOrder.code} gerado com sucesso!`
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

    if (['em_producao', 'pronto', 'entregue'].includes(nextStatus)) {
      StorageService.deductStockForOrder(updatedOrder);
    }

    refreshData();
    showToast(`Pedido ${order.code} atualizado para "${nextStatus.replace('_', ' ')}"!`);
  };

  const handleUpdatePayment = (orderId: string, paymentStatus: PaymentStatus) => {
    const allOrders = StorageService.getOrders();
    const idx = allOrders.findIndex((o) => o.id === orderId);
    if (idx === -1) return;

    allOrders[idx].paymentStatus = paymentStatus;
    StorageService.saveOrders(allOrders);
    refreshData();
    showToast(`Pagamento da OS ${allOrders[idx].code} alterado para "${paymentStatus}".`);
  };

  const handleAddMaterial = (newMat: Material) => {
    const all = StorageService.getMaterials();
    const updated = [...all, newMat];
    StorageService.saveMaterials(updated);
    refreshData();
    showToast(`Insumo "${newMat.name}" cadastrado com sucesso!`);
  };

  const handleUpdateMaterial = (updatedMat: Material) => {
    const all = StorageService.getMaterials();
    const idx = all.findIndex((m) => m.id === updatedMat.id);
    if (idx !== -1) {
      all[idx] = updatedMat;
      StorageService.saveMaterials(all);
      refreshData();
      showToast(`Insumo "${updatedMat.name}" atualizado com sucesso!`);
    }
  };

  const handleDeleteMaterial = (materialId: string) => {
    const all = StorageService.getMaterials();
    const matToDelete = all.find((m) => m.id === materialId);
    const updated = all.filter((m) => m.id !== materialId);
    StorageService.saveMaterials(updated);
    refreshData();
    showToast(`Insumo "${matToDelete?.name || ''}" excluído com sucesso.`);
  };

  const handleRecordStockMovement = (
    materialId: string,
    type: 'entrada' | 'saida_manual' | 'ajuste',
    quantity: number,
    notes: string
  ) => {
    StorageService.recordStockMovement(materialId, type, quantity, notes);
    refreshData();
    showToast(`Movimentação de estoque lançada!`);
  };

  const handleAddEquipment = (newEq: Equipment) => {
    const all = StorageService.getEquipments();
    const updated = [...all, newEq];
    StorageService.saveEquipments(updated);
    refreshData();
    showToast(`Equipamento "${newEq.name}" cadastrado com sucesso!`);
  };

  const handleUpdateEquipment = (updatedEq: Equipment) => {
    const all = StorageService.getEquipments();
    const idx = all.findIndex((e) => e.id === updatedEq.id);
    if (idx !== -1) {
      all[idx] = updatedEq;
      StorageService.saveEquipments(all);
      refreshData();
      showToast(`Equipamento "${updatedEq.name}" atualizado!`);
    }
  };

  const handleDeleteEquipment = (equipmentId: string) => {
    const all = StorageService.getEquipments();
    const toDelete = all.find((e) => e.id === equipmentId);
    const updated = all.filter((e) => e.id !== equipmentId);
    StorageService.saveEquipments(updated);
    refreshData();
    showToast(`Equipamento "${toDelete?.name || ''}" removido com sucesso.`);
  };

  const handleAddPreset = (newPreset: QuickProductPreset) => {
    const all = StorageService.getPresets();
    const updated = [...all, newPreset];
    StorageService.savePresets(updated);
    refreshData();
    showToast(`Modelo rápido "${newPreset.label}" criado com sucesso!`);
  };

  const handleUpdatePreset = (updatedPreset: QuickProductPreset) => {
    const all = StorageService.getPresets();
    const idx = all.findIndex((p) => p.id === updatedPreset.id);
    if (idx !== -1) {
      all[idx] = updatedPreset;
      StorageService.savePresets(all);
      refreshData();
      showToast(`Modelo rápido "${updatedPreset.label}" atualizado!`);
    }
  };

  const handleDeletePreset = (presetId: string) => {
    const all = StorageService.getPresets();
    const pToDelete = all.find((p) => p.id === presetId);
    const updated = all.filter((p) => p.id !== presetId);
    StorageService.savePresets(updated);
    refreshData();
    showToast(`Modelo rápido "${pToDelete?.label || ''}" excluído.`);
  };

  const ordersInProductionCount = orders.filter(
    (o) => o.type === 'pedido' && ['aprovado', 'em_producao'].includes(o.status)
  ).length;

  const lowStockCount = materials.filter((m) => m.currentStock <= m.minStock).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Responsive Navbar for Windows and Mobile */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        onOpenGerarPedido={() => setIsGerarPedidoOpen(true)}
        ordersInProductionCount={ordersInProductionCount}
        lowStockCount={lowStockCount}
      />

      {/* Main Page Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {activePage === 'visao_geral' && (
          <OverviewView
            orders={orders}
            materials={materials}
            equipments={equipments}
            onOpenGerarPedido={() => setIsGerarPedidoOpen(true)}
            onNavigate={setActivePage}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onSelectOrder={(ord) => setSelectedJobTicketOrder(ord)}
          />
        )}

        {activePage === 'pedidos' && (
          <OrdersView
            orders={orders}
            onOpenGerarPedido={() => setIsGerarPedidoOpen(true)}
            onUpdateStatus={handleUpdateOrderStatus}
            onUpdatePayment={handleUpdatePayment}
            onViewJobTicket={(ord) => setSelectedJobTicketOrder(ord)}
          />
        )}

        {activePage === 'calculo_custo' && (
          <CostCalculatorView
            materials={materials}
            equipments={equipments}
            presets={presets}
            onOpenGerarPedido={handleOpenGerarPedido}
          />
        )}

        {activePage === 'estoque' && (
          <InventoryView
            materials={materials}
            movements={movements}
            onAddMaterial={handleAddMaterial}
            onUpdateMaterial={handleUpdateMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            onRecordMovement={handleRecordStockMovement}
          />
        )}

        {activePage === 'maquinas' && (
          <MachinesView
            equipments={equipments}
            onAddEquipment={handleAddEquipment}
            onUpdateEquipment={handleUpdateEquipment}
            onDeleteEquipment={handleDeleteEquipment}
            onOpenGerarPedido={() => handleOpenGerarPedido()}
          />
        )}
      </main>

      {/* Central "Gerar Pedido" Modal */}
      {isGerarPedidoOpen && (
        <GerarPedidoModal
          materials={materials}
          equipments={equipments}
          presets={presets}
          initialOrderData={orderPrefill}
          onAddPreset={handleAddPreset}
          onUpdatePreset={handleUpdatePreset}
          onDeletePreset={handleDeletePreset}
          onSaveOrder={handleSaveOrder}
          onClose={() => {
            setIsGerarPedidoOpen(false);
            setOrderPrefill(null);
          }}
        />
      )}

      {/* Job Ticket (Comanda de Produção) Modal */}
      {selectedJobTicketOrder && (
        <JobTicketModal
          order={selectedJobTicketOrder}
          onClose={() => setSelectedJobTicketOrder(null)}
        />
      )}
    </div>
  );
}
