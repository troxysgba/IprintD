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
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Error loading key ${key}:`, e);
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error saving key ${key}:`, e);
  }
}

/**
 * Recursively removes any undefined values from an object before saving to Firestore,
 * ensuring Firestore never rejects documents with 'Unsupported field value: undefined'.
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        result[key] = sanitizeForFirestore(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result as T;
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
    const cleanOrder = sanitizeForFirestore(order);

    // 1. Immediately persist to localStorage so changes never disappear on page refresh
    try {
      const current = this.getOrders();
      const exists = current.some((o) => o.id === cleanOrder.id);
      const updated = exists
        ? current.map((o) => (o.id === cleanOrder.id ? cleanOrder : o))
        : [cleanOrder, ...current];
      save(KEYS.ORDERS, updated);
    } catch (err) {
      console.warn('[LocalStorage saveOrder error]:', err);
    }

    // 2. Persist to Firestore cloud database
    try {
      await setDoc(doc(db, path, cleanOrder.id), cleanOrder);
    } catch (error) {
      console.error('[Firestore saveOrder error]:', error);
      handleFirestoreError(error, OperationType.WRITE, `${path}/${cleanOrder.id}`);
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
    // 1. Immediately persist deletion locally so it never reappears on refresh
    try {
      const filtered = this.getOrders().filter((o) => o.id !== orderId);
      save(KEYS.ORDERS, filtered);
    } catch (err) {
      console.warn('[LocalStorage deleteOrder error]:', err);
    }

    // 2. Persist deletion in Firestore
    try {
      await deleteDoc(doc(db, path, orderId));
    } catch (error) {
      console.error('[Firestore deleteOrder error]:', error);
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
              const cleanM = sanitizeForFirestore(m);
              await setDoc(doc(db, path, cleanM.id), cleanM);
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
    const clean = sanitizeForFirestore(material);

    try {
      const current = this.getMaterials();
      const exists = current.some((m) => m.id === clean.id);
      const updated = exists
        ? current.map((m) => (m.id === clean.id ? clean : m))
        : [...current, clean];
      save(KEYS.MATERIALS, updated);
    } catch (err) {
      console.warn('[LocalStorage saveMaterial error]:', err);
    }

    try {
      await setDoc(doc(db, path, clean.id), clean);
    } catch (error) {
      console.error('[Firestore saveMaterial error]:', error);
      handleFirestoreError(error, OperationType.WRITE, `${path}/${clean.id}`);
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
      const filtered = this.getMaterials().filter((m) => m.id !== materialId);
      save(KEYS.MATERIALS, filtered);
    } catch (err) {
      console.warn('[LocalStorage deleteMaterial error]:', err);
    }

    try {
      await deleteDoc(doc(db, path, materialId));
    } catch (error) {
      console.error('[Firestore deleteMaterial error]:', error);
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
              const cleanEq = sanitizeForFirestore(eq);
              await setDoc(doc(db, path, cleanEq.id), cleanEq);
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
    const clean = sanitizeForFirestore(equipment);

    try {
      const current = this.getEquipments();
      const exists = current.some((e) => e.id === clean.id);
      const updated = exists
        ? current.map((e) => (e.id === clean.id ? clean : e))
        : [...current, clean];
      save(KEYS.EQUIPMENTS, updated);
    } catch (err) {
      console.warn('[LocalStorage saveEquipment error]:', err);
    }

    try {
      await setDoc(doc(db, path, clean.id), clean);
    } catch (error) {
      console.error('[Firestore saveEquipment error]:', error);
      handleFirestoreError(error, OperationType.WRITE, `${path}/${clean.id}`);
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
      const filtered = this.getEquipments().filter((e) => e.id !== equipmentId);
      save(KEYS.EQUIPMENTS, filtered);
    } catch (err) {
      console.warn('[LocalStorage deleteEquipment error]:', err);
    }

    try {
      await deleteDoc(doc(db, path, equipmentId));
    } catch (error) {
      console.error('[Firestore deleteEquipment error]:', error);
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
              const cleanP = sanitizeForFirestore(p);
              await setDoc(doc(db, path, cleanP.id), cleanP);
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
    const clean = sanitizeForFirestore(preset);

    try {
      const current = this.getPresets();
      const exists = current.some((p) => p.id === clean.id);
      const updated = exists
        ? current.map((p) => (p.id === clean.id ? clean : p))
        : [...current, clean];
      save(KEYS.PRESETS, updated);
    } catch (err) {
      console.warn('[LocalStorage savePreset error]:', err);
    }

    try {
      await setDoc(doc(db, path, clean.id), clean);
    } catch (error) {
      console.error('[Firestore savePreset error]:', error);
      handleFirestoreError(error, OperationType.WRITE, `${path}/${clean.id}`);
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
      const filtered = this.getPresets().filter((p) => p.id !== presetId);
      save(KEYS.PRESETS, filtered);
    } catch (err) {
      console.warn('[LocalStorage deletePreset error]:', err);
    }

    try {
      await deleteDoc(doc(db, path, presetId));
    } catch (error) {
      console.error('[Firestore deletePreset error]:', error);
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
              const cleanM = sanitizeForFirestore(m);
              await setDoc(doc(db, path, cleanM.id), cleanM);
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

    const newMovement: StockMovement = sanitizeForFirestore({
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      materialId: material.id,
      materialName: material.name,
      date: new Date().toISOString(),
      type,
      quantity,
      previousStock: prev,
      newStock: material.currentStock,
      orderCode: orderCode || '',
      notes: notes || '',
    });

    try {
      const movements = this.getStockMovements();
      save(KEYS.MOVEMENTS, [newMovement, ...movements]);
    } catch (err) {
      console.warn('[LocalStorage recordStockMovement error]:', err);
    }

    try {
      await setDoc(doc(db, 'stockMovements', newMovement.id), newMovement);
    } catch (error) {
      console.error('[Firestore recordStockMovement error]:', error);
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
      // Mark as deducted and save order state
      const updatedOrder: Order = { ...order, stockDeducted: true };
      await this.saveOrder(updatedOrder);
    }
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
