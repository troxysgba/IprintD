/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ActivePage,
  Equipment,
  Material,
  Order,
  OrderStatus,
  PaymentStatus,
  QuickProductPreset,
  RegisteredProduct,
  StockMovement,
} from './types';
import { StorageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { GerarPedidoModal } from './components/GerarPedidoModal';
import { JobTicketModal } from './components/JobTicketModal';
import { OverviewView } from './views/OverviewView';
import { OrdersView } from './views/OrdersView';
import { ProductsView } from './views/ProductsView';
import { CostCalculatorView } from './views/CostCalculatorView';
import { InventoryView } from './views/InventoryView';
import { MachinesView } from './views/MachinesView';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('visao_geral');

  // Application Data States (Initialized with local cache, updated live from Firestore)
  const [orders, setOrders] = useState<Order[]>(StorageService.getOrders());
  const [products, setProducts] = useState<RegisteredProduct[]>(StorageService.getProducts());
  const [materials, setMaterials] = useState<Material[]>(StorageService.getMaterials());
  const [equipments, setEquipments] = useState<Equipment[]>(StorageService.getEquipments());
  const [movements, setMovements] = useState<StockMovement[]>(StorageService.getStockMovements());
  const [presets, setPresets] = useState<QuickProductPreset[]>(StorageService.getPresets());
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

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

    const [lastModifiedProductId, setLastModifiedProductId] = useState<string | null>(null);
  const [lastProductChange, setLastProductChange] = useState<{
    type: 'added' | 'modified' | 'removed';
    product: RegisteredProduct;
    time: string;
  } | null>(null);

  // Real-time multi-user synchronization with Firebase Firestore
  useEffect(() => {
    StorageService.initConnection();

    const unsubOrders = StorageService.subscribeOrders(
      (liveOrders) => {
        setOrders(liveOrders);
        setIsCloudConnected(true);
      },
      (change) => {
        if (change.type === 'added') {
          showToast(`🔔 [Tempo Real] Pedido ${change.order.code} (${change.order.clientName}) recebido da equipe!`);
        } else if (change.type === 'modified') {
          showToast(`🔄 [Tempo Real] Pedido ${change.order.code} atualizado na nuvem!`);
        } else if (change.type === 'removed') {
          showToast(`🗑️ [Tempo Real] Pedido ${change.order.code} removido da nuvem.`);
        }
      }
    );

    const unsubMaterials = StorageService.subscribeMaterials((liveMaterials) => {
      setMaterials(liveMaterials);
    });

    const unsubEquipments = StorageService.subscribeEquipments((liveEquipments) => {
      setEquipments(liveEquipments);
    });

    const unsubPresets = StorageService.subscribePresets((livePresets) => {
      setPresets(livePresets);
    });

    const unsubProducts = StorageService.subscribeProducts(
      (liveProducts) => {
        setProducts(liveProducts);
      },
      (change) => {
        const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastModifiedProductId(change.product.id);
        setLastProductChange({
          type: change.type,
          product: change.product,
          time: timeStr,
        });

        // Clear highlight ring after 4.5 seconds
        setTimeout(() => {
          setLastModifiedProductId((current) => (current === change.product.id ? null : current));
        }, 4500);

        if (change.type === 'added') {
          showToast(`📦 [Tempo Real] "${change.product.name}" adicionado à lista por outro operador!`);
        } else if (change.type === 'modified') {
          showToast(`⚡ [Tempo Real] "${change.product.name}" foi alterado agora! (Preço: R$ ${change.product.price.toFixed(2)} | Estoque: ${change.product.stockQuantity} un)`);
        } else if (change.type === 'removed') {
          showToast(`🗑️ [Tempo Real] Produto "${change.product.name}" foi removido do catálogo.`);
        }
      }
    );

    const unsubMovements = StorageService.subscribeStockMovements((liveMovements) => {
      setMovements(liveMovements);
    });

    return () => {
      unsubOrders();
      unsubMaterials();
      unsubEquipments();
      unsubPresets();
      unsubProducts();
      unsubMovements();
    };
  }, []);

  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);

  // Save order directly to Firestore (synchronized across all connected users instantly)
  const handleSaveOrder = async (newOrder: Order) => {
    const isEdit = orders.some((o) => o.id === newOrder.id);

    // 1. Immediate optimistic state update for 0ms UI delay
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === newOrder.id);
      return exists ? prev.map((o) => (o.id === newOrder.id ? newOrder : o)) : [newOrder, ...prev];
    });

    // 2. Highlight newly created order on Pedidos view
    setHighlightOrderId(newOrder.id);

    // 3. User requirement: Automatically switch view to "pedidos"
    setActivePage('pedidos');

    // 4. Persist to Firestore and record stock movements
    await StorageService.saveOrder(newOrder);

    if (newOrder.type === 'pedido') {
      await StorageService.deductStockForOrder(newOrder);
    }

    showToast(
      `${newOrder.type === 'pedido' ? 'Pedido' : 'Orçamento'} ${newOrder.code} ${
        isEdit ? 'atualizado e sincronizado na nuvem' : 'gerado com sucesso e sincronizado em tempo real'
      }!`
    );
  };

  const handleDeleteOrder = async (orderId: string) => {
    const orderToDelete = orders.find((o) => o.id === orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    await StorageService.deleteOrder(orderId);
    showToast(`Pedido ${orderToDelete?.code || ''} excluído da nuvem.`);
  };

  const handleEditOrder = (order: Order) => {
    handleOpenGerarPedido(order);
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const updatedOrder: Order = {
      ...order,
      status: nextStatus,
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
    await StorageService.saveOrder(updatedOrder);

    if (['em_producao', 'pronto', 'entregue'].includes(nextStatus)) {
      await StorageService.deductStockForOrder(updatedOrder);
    }

    showToast(`Pedido ${order.code} atualizado para "${nextStatus.replace('_', ' ')}"!`);
  };

  const handleUpdatePayment = async (orderId: string, paymentStatus: PaymentStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const updatedOrder: Order = {
      ...order,
      paymentStatus,
    };
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
    await StorageService.saveOrder(updatedOrder);
    showToast(`Pagamento da OS ${order.code} alterado para "${paymentStatus}".`);
  };

  const handleAddMaterial = async (newMat: Material) => {
    await StorageService.saveMaterial(newMat);
    showToast(`Insumo "${newMat.name}" salvo na nuvem!`);
  };

  const handleUpdateMaterial = async (updatedMat: Material) => {
    await StorageService.saveMaterial(updatedMat);
    showToast(`Insumo "${updatedMat.name}" atualizado na nuvem!`);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    const matToDelete = materials.find((m) => m.id === materialId);
    await StorageService.deleteMaterial(materialId);
    showToast(`Insumo "${matToDelete?.name || ''}" removido.`);
  };

  const handleRecordStockMovement = async (
    materialId: string,
    type: 'entrada' | 'saida_manual' | 'ajuste',
    quantity: number,
    notes: string
  ) => {
    await StorageService.recordStockMovement(materialId, type, quantity, notes);
    showToast(`Movimentação de estoque sincronizada!`);
  };

  const handleAddEquipment = async (newEq: Equipment) => {
    await StorageService.saveEquipment(newEq);
    showToast(`Equipamento "${newEq.name}" salvo na nuvem!`);
  };

  const handleUpdateEquipment = async (updatedEq: Equipment) => {
    await StorageService.saveEquipment(updatedEq);
    showToast(`Equipamento "${updatedEq.name}" atualizado!`);
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    const toDelete = equipments.find((e) => e.id === equipmentId);
    await StorageService.deleteEquipment(equipmentId);
    showToast(`Equipamento "${toDelete?.name || ''}" removido.`);
  };

  const handleAddPreset = async (newPreset: QuickProductPreset) => {
    await StorageService.savePreset(newPreset);
    showToast(`Modelo rápido "${newPreset.label}" salvo na nuvem!`);
  };

  const handleUpdatePreset = async (updatedPreset: QuickProductPreset) => {
    await StorageService.savePreset(updatedPreset);
    showToast(`Modelo rápido "${updatedPreset.label}" atualizado!`);
  };

  const handleDeletePreset = async (presetId: string) => {
    const pToDelete = presets.find((p) => p.id === presetId);
    await StorageService.deletePreset(presetId);
    showToast(`Modelo "${pToDelete?.label || ''}" removido.`);
  };

  // Products handlers (Produtos Cadastrados com sincronização colaborativa em tempo real)
  const handleSaveProduct = async (product: RegisteredProduct) => {
    const isEdit = products.some((p) => p.id === product.id);
    const updatedProd: RegisteredProduct = {
      ...product,
      updatedAt: new Date().toISOString(),
    };

    // Immediate optimistic update
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === updatedProd.id);
      return exists ? prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)) : [updatedProd, ...prev];
    });

    setLastModifiedProductId(updatedProd.id);
    await StorageService.saveProduct(updatedProd);

    showToast(
      isEdit
        ? `Produto "${product.name}" atualizado e propagado em tempo real para toda a equipe!`
        : `Produto "${product.name}" cadastrado e disponível em tempo real!`
    );
  };

  const handleDeleteProduct = async (productId: string) => {
    const pToDelete = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    await StorageService.deleteProduct(productId);
    showToast(`Produto "${pToDelete?.name || ''}" removido da nuvem.`);
  };

  const handleUpdateProductStock = async (productId: string, newQuantity: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newQuantity, updatedAt: new Date().toISOString() } : p))
    );
    setLastModifiedProductId(productId);
    await StorageService.updateProductStock(productId, newQuantity);
    showToast(`Estoque atualizado para ${newQuantity} un e sincronizado com a equipe!`);
  };

  const handleUpdateProductPrice = async (productId: string, newPrice: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, price: newPrice, updatedAt: new Date().toISOString() } : p))
    );
    setLastModifiedProductId(productId);
    await StorageService.updateProductPrice(productId, newPrice);
    showToast(`Preço atualizado para R$ ${newPrice.toFixed(2)} e sincronizado na nuvem!`);
  };

  const handleGenerateOrderForProduct = (product: RegisteredProduct) => {
    handleOpenGerarPedido({
      productName: product.name,
      quantity: 1,
      finalPrice: product.price,
      unitPrice: product.price,
      suggestedPrice: product.price,
      widthCm: product.widthCm || 9,
      heightCm: product.heightCm || 5,
      notes: product.description
        ? `Item do catálogo (${product.code}): ${product.description}`
        : `Item do catálogo (${product.code})`,
    });
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
        onOpenGerarPedido={() => handleOpenGerarPedido()}
        ordersInProductionCount={ordersInProductionCount}
        lowStockCount={lowStockCount}
        productsCount={products.length}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Page Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {activePage === 'visao_geral' && (
          <OverviewView
            orders={orders}
            materials={materials}
            equipments={equipments}
            onOpenGerarPedido={() => handleOpenGerarPedido()}
            onNavigate={setActivePage}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onSelectOrder={(ord) => setSelectedJobTicketOrder(ord)}
          />
        )}

        {activePage === 'pedidos' && (
          <OrdersView
            orders={orders}
            highlightOrderId={highlightOrderId}
            onOpenGerarPedido={() => handleOpenGerarPedido()}
            onEditOrder={handleEditOrder}
            onDeleteOrder={handleDeleteOrder}
            onUpdateStatus={handleUpdateOrderStatus}
            onUpdatePayment={handleUpdatePayment}
            onViewJobTicket={(ord) => setSelectedJobTicketOrder(ord)}
          />
        )}

        {activePage === 'produtos' && (
          <ProductsView
            products={products}
            lastModifiedProductId={lastModifiedProductId}
            lastProductChange={lastProductChange}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateStock={handleUpdateProductStock}
            onUpdatePrice={handleUpdateProductPrice}
            onGenerateOrderForProduct={handleGenerateOrderForProduct}
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
