import { Equipment, Material, Order, QuickProductPreset, StockMovement } from '../types';
import {
  INITIAL_EQUIPMENTS,
  INITIAL_MATERIALS,
  INITIAL_ORDERS,
  INITIAL_PRESETS,
  INITIAL_STOCK_MOVEMENTS,
} from '../utils/mockData';

const KEYS = {
  ORDERS: 'printflow_orders_v2',
  MATERIALS: 'printflow_materials_v2',
  EQUIPMENTS: 'printflow_equipments_v3',
  MOVEMENTS: 'printflow_movements_v2',
  PRESETS: 'printflow_presets_v2',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error loading key ${key}:`, e);
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error saving key ${key}:`, e);
  }
}

export const StorageService = {
  getOrders(): Order[] {
    return load<Order[]>(KEYS.ORDERS, INITIAL_ORDERS);
  },
  saveOrders(orders: Order[]): void {
    save(KEYS.ORDERS, orders);
  },

  getMaterials(): Material[] {
    return load<Material[]>(KEYS.MATERIALS, INITIAL_MATERIALS);
  },
  saveMaterials(materials: Material[]): void {
    save(KEYS.MATERIALS, materials);
  },

  getEquipments(): Equipment[] {
    const loaded = load<Equipment[]>(KEYS.EQUIPMENTS, INITIAL_EQUIPMENTS);
    // Garante que qualquer resquício de máquinas antigas seja substituído pelas novas impressoras jato de tinta
    const hasOld = loaded.some(
      (e) =>
        e.id === 'eq_ricoh_c5300' ||
        e.id === 'eq_bizhub_mono' ||
        e.id === 'eq_plotter_epson' ||
        e.id === 'eq_guilhotina'
    );
    if (hasOld || loaded.length === 0) {
      save(KEYS.EQUIPMENTS, INITIAL_EQUIPMENTS);
      return INITIAL_EQUIPMENTS;
    }
    return loaded.map((e) => ({
      ...e,
      inkPercent: e.inkPercent ?? 3,
      depreciationPercent: e.depreciationPercent ?? 10,
    }));
  },
  saveEquipments(equipments: Equipment[]): void {
    save(KEYS.EQUIPMENTS, equipments);
  },

  getStockMovements(): StockMovement[] {
    return load<StockMovement[]>(KEYS.MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
  },
  saveStockMovements(movements: StockMovement[]): void {
    save(KEYS.MOVEMENTS, movements);
  },

  getPresets(): QuickProductPreset[] {
    const loaded = load<QuickProductPreset[]>(KEYS.PRESETS, INITIAL_PRESETS);
    return loaded.map((p) => {
      if (!p.equipmentId) {
        return {
          ...p,
          equipmentId: p.isPlotter ? 'eq_l3250' : 'eq_l4260',
        };
      }
      return p;
    });
  },
  savePresets(presets: QuickProductPreset[]): void {
    save(KEYS.PRESETS, presets);
  },

  recordStockMovement(
    materialId: string,
    type: 'entrada' | 'saida_manual' | 'consumo_os' | 'ajuste',
    quantity: number,
    notes: string,
    orderCode?: string
  ): void {
    const materials = this.getMaterials();
    const idx = materials.findIndex((m) => m.id === materialId);
    if (idx === -1) return;

    const material = materials[idx];
    const prev = material.currentStock;
    let next = prev;

    if (type === 'entrada') {
      next = prev + quantity;
    } else if (type === 'saida_manual' || type === 'consumo_os') {
      next = Math.max(0, prev - quantity);
    } else if (type === 'ajuste') {
      next = quantity;
    }

    material.currentStock = Number(next.toFixed(2));
    materials[idx] = material;
    this.saveMaterials(materials);

    const movements = this.getStockMovements();
    const newMovement: StockMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      materialId: material.id,
      materialName: material.name,
      date: new Date().toISOString(),
      type,
      quantity,
      previousStock: prev,
      newStock: material.currentStock,
      orderCode,
      notes,
    };
    this.saveStockMovements([newMovement, ...movements]);
  },

  deductStockForOrder(order: Order): void {
    if (order.stockDeducted) return;
    if (order.materialId && (order.sheetsNeeded || order.wasteSheets)) {
      const totalToDeduct = (order.sheetsNeeded || 0) + (order.wasteSheets || 0);
      this.recordStockMovement(
        order.materialId,
        'consumo_os',
        totalToDeduct,
        `Consumo OS ${order.code} (${order.productName})`,
        order.code
      );
    }

    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.id === order.id);
    if (idx !== -1) {
      orders[idx].stockDeducted = true;
      this.saveOrders(orders);
    }
  },

  resetAll(): void {
    localStorage.removeItem(KEYS.ORDERS);
    localStorage.removeItem(KEYS.MATERIALS);
    localStorage.removeItem(KEYS.EQUIPMENTS);
    localStorage.removeItem(KEYS.MOVEMENTS);
  },
};
