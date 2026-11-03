import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { Equipment, Material, Order, QuickProductPreset, StockMovement } from '../types';
import {
  INITIAL_EQUIPMENTS,
  INITIAL_MATERIALS,
  INITIAL_ORDERS,
  INITIAL_PRESETS,
  INITIAL_STOCK_MOVEMENTS,
} from '../utils/mockData';
import { db, handleFirestoreError, OperationType, testConnection } from './firebase';

const KEYS = {
  ORDERS: 'iprint_orders_v3',
  MATERIALS: 'iprint_materials_v3',
  EQUIPMENTS: 'iprint_equipments_v3',
  MOVEMENTS: 'iprint_movements_v3',
  PRESETS: 'iprint_presets_v3',
  SEEDED: 'iprint_firestore_seeded_v1',
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
  // Test connection
  initConnection(): void {
    testConnection();
  },

  // Synchronous cache access (used for instant initial React state)
  getOrders(): Order[] {
    return load<Order[]>(KEYS.ORDERS, INITIAL_ORDERS);
  },
  getMaterials(): Material[] {
    return load<Material[]>(KEYS.MATERIALS, INITIAL_MATERIALS);
  },
  getEquipments(): Equipment[] {
    return load<Equipment[]>(KEYS.EQUIPMENTS, INITIAL_EQUIPMENTS);
  },
  getStockMovements(): StockMovement[] {
    return load<StockMovement[]>(KEYS.MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
  },
  getPresets(): QuickProductPreset[] {
    return load<QuickProductPreset[]>(KEYS.PRESETS, INITIAL_PRESETS);
  },

  // 1. ORDERS - REAL-TIME FIRESTORE MULTI-USER SYNC
  subscribeOrders(
    callback: (orders: Order[]) => void,
    onRemoteChange?: (change: {
      type: 'added' | 'modified' | 'removed';
      order: Order;
    }) => void
  ): Unsubscribe {
    const path = 'orders';
    let isInitial = true;

    return onSnapshot(
      collection(db, path),
      async (snapshot) => {
        if (snapshot.empty && !localStorage.getItem(KEYS.SEEDED + '_orders')) {
          localStorage.setItem(KEYS.SEEDED + '_orders', 'true');
          // Seed initial orders into Firestore so database is ready for everyone
          for (const ord of INITIAL_ORDERS) {
            try {
              await setDoc(doc(db, path, ord.id), ord);
            } catch (err) {
              console.warn('Seeding order failed:', err);
            }
          }
          callback(INITIAL_ORDERS);
          isInitial = false;
          return;
        }

        const items: Order[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as Order);
        });

        // Ordenar pelos mais recentes
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        save(KEYS.ORDERS, items);
        callback(items);

        // Notify on subsequent real-time changes made by other team members/devices
        if (!isInitial && onRemoteChange) {
          snapshot.docChanges().forEach((change) => {
            const orderData = change.doc.data() as Order;
            onRemoteChange({
              type: change.type,
              order: orderData,
            });
          });
        }
        isInitial = false;
      },
      (error) => {
        console.warn('[Firestore subscribeOrders error]:', error);
      }
    );
  },

  async saveOrder(order: Order): Promise<void> {
    const path = 'orders';
    try {
      await setDoc(doc(db, path, order.id), order);
      const current = this.getOrders();
      const exists = current.some((o) => o.id === order.id);
      const updated = exists
        ? current.map((o) => (o.id === order.id ? order : o))
        : [order, ...current];
      save(KEYS.ORDERS, updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${order.id}`);
    }
  },

  async saveOrders(orders: Order[]): Promise<void> {
    save(KEYS.ORDERS, orders);
    for (const ord of orders) {
      await this.saveOrder(ord);
    }
  },

  async deleteOrder(orderId: string): Promise<void> {
    const path = 'orders';
    try {
      await deleteDoc(doc(db, path, orderId));
      const filtered = this.getOrders().filter((o) => o.id !== orderId);
      save(KEYS.ORDERS, filtered);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${orderId}`);
    }
  },

  // 2. MATERIALS - REAL-TIME FIRESTORE SYNC
  subscribeMaterials(callback: (materials: Material[]) => void): Unsubscribe {
    const path = 'materials';
    return onSnapshot(
      collection(db, path),
      async (snapshot) => {
        if (snapshot.empty && !localStorage.getItem(KEYS.SEEDED + '_materials')) {
          localStorage.setItem(KEYS.SEEDED + '_materials', 'true');
          for (const m of INITIAL_MATERIALS) {
            try {
              await setDoc(doc(db, path, m.id), m);
            } catch (err) {
              console.warn('Seeding material failed:', err);
            }
          }
          callback(INITIAL_MATERIALS);
          return;
        }

        const items: Material[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as Material);
        });
        save(KEYS.MATERIALS, items);
        callback(items);
      },
      (error) => {
        console.warn('[Firestore subscribeMaterials error]:', error);
      }
    );
  },

  async saveMaterial(material: Material): Promise<void> {
    const path = 'materials';
    try {
      await setDoc(doc(db, path, material.id), material);
      const current = this.getMaterials();
      const exists = current.some((m) => m.id === material.id);
      const updated = exists
        ? current.map((m) => (m.id === material.id ? material : m))
        : [...current, material];
      save(KEYS.MATERIALS, updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${material.id}`);
    }
  },

  async saveMaterials(materials: Material[]): Promise<void> {
    save(KEYS.MATERIALS, materials);
    for (const m of materials) {
      await this.saveMaterial(m);
    }
  },

  async deleteMaterial(materialId: string): Promise<void> {
    const path = 'materials';
    try {
      await deleteDoc(doc(db, path, materialId));
      const filtered = this.getMaterials().filter((m) => m.id !== materialId);
      save(KEYS.MATERIALS, filtered);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${materialId}`);
    }
  },

  // 3. EQUIPMENTS - REAL-TIME FIRESTORE SYNC
  subscribeEquipments(callback: (equipments: Equipment[]) => void): Unsubscribe {
    const path = 'equipments';
    return onSnapshot(
      collection(db, path),
      async (snapshot) => {
        if (snapshot.empty && !localStorage.getItem(KEYS.SEEDED + '_equipments')) {
          localStorage.setItem(KEYS.SEEDED + '_equipments', 'true');
          for (const eq of INITIAL_EQUIPMENTS) {
            try {
              await setDoc(doc(db, path, eq.id), eq);
            } catch (err) {
              console.warn('Seeding equipment failed:', err);
            }
          }
          callback(INITIAL_EQUIPMENTS);
          return;
        }

        const items: Equipment[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as Equipment);
        });
        save(KEYS.EQUIPMENTS, items);
        callback(items);
      },
      (error) => {
        console.warn('[Firestore subscribeEquipments error]:', error);
      }
    );
  },

  async saveEquipment(equipment: Equipment): Promise<void> {
    const path = 'equipments';
    try {
      await setDoc(doc(db, path, equipment.id), equipment);
      const current = this.getEquipments();
      const exists = current.some((e) => e.id === equipment.id);
      const updated = exists
        ? current.map((e) => (e.id === equipment.id ? equipment : e))
        : [...current, equipment];
      save(KEYS.EQUIPMENTS, updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${equipment.id}`);
    }
  },

  async saveEquipments(equipments: Equipment[]): Promise<void> {
    save(KEYS.EQUIPMENTS, equipments);
    for (const eq of equipments) {
      await this.saveEquipment(eq);
    }
  },

  async deleteEquipment(equipmentId: string): Promise<void> {
    const path = 'equipments';
    try {
      await deleteDoc(doc(db, path, equipmentId));
      const filtered = this.getEquipments().filter((e) => e.id !== equipmentId);
      save(KEYS.EQUIPMENTS, filtered);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${equipmentId}`);
    }
  },

  // 4. PRESETS - REAL-TIME FIRESTORE SYNC
  subscribePresets(callback: (presets: QuickProductPreset[]) => void): Unsubscribe {
    const path = 'presets';
    return onSnapshot(
      collection(db, path),
      async (snapshot) => {
        if (snapshot.empty && !localStorage.getItem(KEYS.SEEDED + '_presets')) {
          localStorage.setItem(KEYS.SEEDED + '_presets', 'true');
          for (const p of INITIAL_PRESETS) {
            try {
              await setDoc(doc(db, path, p.id), p);
            } catch (err) {
              console.warn('Seeding preset failed:', err);
            }
          }
          callback(INITIAL_PRESETS);
          return;
        }

        const items: QuickProductPreset[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as QuickProductPreset);
        });
        save(KEYS.PRESETS, items);
        callback(items);
      },
      (error) => {
        console.warn('[Firestore subscribePresets error]:', error);
      }
    );
  },

  async savePreset(preset: QuickProductPreset): Promise<void> {
    const path = 'presets';
    try {
      await setDoc(doc(db, path, preset.id), preset);
      const current = this.getPresets();
      const exists = current.some((p) => p.id === preset.id);
      const updated = exists
        ? current.map((p) => (p.id === preset.id ? preset : p))
        : [...current, preset];
      save(KEYS.PRESETS, updated);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${preset.id}`);
    }
  },

  async savePresets(presets: QuickProductPreset[]): Promise<void> {
    save(KEYS.PRESETS, presets);
    for (const p of presets) {
      await this.savePreset(p);
    }
  },

  async deletePreset(presetId: string): Promise<void> {
    const path = 'presets';
    try {
      await deleteDoc(doc(db, path, presetId));
      const filtered = this.getPresets().filter((p) => p.id !== presetId);
      save(KEYS.PRESETS, filtered);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${presetId}`);
    }
  },

  // 5. MOVEMENTS - REAL-TIME FIRESTORE SYNC
  subscribeStockMovements(callback: (movements: StockMovement[]) => void): Unsubscribe {
    const path = 'stockMovements';
    return onSnapshot(
      collection(db, path),
      async (snapshot) => {
        if (snapshot.empty && !localStorage.getItem(KEYS.SEEDED + '_movements')) {
          localStorage.setItem(KEYS.SEEDED + '_movements', 'true');
          for (const m of INITIAL_STOCK_MOVEMENTS) {
            try {
              await setDoc(doc(db, path, m.id), m);
            } catch (err) {
              console.warn('Seeding movement failed:', err);
            }
          }
          callback(INITIAL_STOCK_MOVEMENTS);
          return;
        }

        const items: StockMovement[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as StockMovement);
        });
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        save(KEYS.MOVEMENTS, items);
        callback(items);
      },
      (error) => {
        console.warn('[Firestore subscribeMovements error]:', error);
      }
    );
  },

  async recordStockMovement(
    materialId: string,
    type: 'entrada' | 'saida_manual' | 'consumo_os' | 'ajuste',
    quantity: number,
    notes: string,
    orderCode?: string
  ): Promise<void> {
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
    await this.saveMaterial(material);

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

    try {
      await setDoc(doc(db, 'stockMovements', newMovement.id), newMovement);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `stockMovements/${newMovement.id}`);
    }
  },

  async deductStockForOrder(order: Order): Promise<void> {
    if (order.stockDeducted) return;
    const totalToDeduct =
      (order.sheetsNeeded || 0) + (order.wasteSheets || 0) ||
      (order.linearMetersNeeded ? Math.ceil(order.linearMetersNeeded) : 0);

    if (order.materialId && totalToDeduct > 0) {
      await this.recordStockMovement(
        order.materialId,
        'consumo_os',
        totalToDeduct,
        `Consumo OS ${order.code} (${order.productName})`,
        order.code
      );
    }

    const updatedOrder: Order = {
      ...order,
      stockDeducted: true,
    };
    await this.saveOrder(updatedOrder);
  },

  resetAll(): void {
    localStorage.removeItem(KEYS.ORDERS);
    localStorage.removeItem(KEYS.MATERIALS);
    localStorage.removeItem(KEYS.EQUIPMENTS);
    localStorage.removeItem(KEYS.MOVEMENTS);
    localStorage.removeItem(KEYS.PRESETS);
    localStorage.removeItem(KEYS.SEEDED + '_orders');
    localStorage.removeItem(KEYS.SEEDED + '_materials');
    localStorage.removeItem(KEYS.SEEDED + '_equipments');
    localStorage.removeItem(KEYS.SEEDED + '_presets');
    localStorage.removeItem(KEYS.SEEDED + '_movements');
  },
};
