export type OrderStatus =
  | 'orcamento'
  | 'aprovado'
  | 'em_producao'
  | 'pronto'
  | 'entregue'
  | 'cancelado';

export type PaymentStatus = 'pendente' | 'parcial' | 'pago';

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'faturado';

export interface Order {
  id: string;
  code: string; // ex: OS-1042
  type: 'pedido' | 'orcamento';
  clientName: string;
  clientPhone: string;
  createdAt: string;
  deadline: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  
  // Item details
  productName: string;
  quantity: number;
  widthMm: number;
  heightMm: number;
  printSides: '4x0' | '4x4' | '1x0' | '1x1';
  materialId: string;
  materialName: string;
  equipmentId: string;
  equipmentName: string;
  
  // Imposition & Technical
  itemsPerSheet: number;
  sheetsNeeded: number;
  wasteSheets: number;
  
  // Financials
  materialCost: number;
  clickCost: number;
  machineLaborCost: number;
  totalCost: number;
  suggestedPrice: number;
  finalPrice: number;
  unitPrice: number;
  notes?: string;
  stockDeducted?: boolean;
}

export type MaterialCategory = 'papel' | 'adesivo' | 'lona' | 'acabamento' | 'tinta';

export interface Material {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: 'folha' | 'm2' | 'unidade' | 'pct';
  widthMm?: number;
  heightMm?: number;
  grammage?: number;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  supplier: string;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: 'laser' | 'plotter' | 'acabamento';
  clickCostPB: number;
  clickCostColor: number;
  hourlyRate: number;
  speedPerHour: number; // un/h ou m²/h
  status: 'operacional' | 'manutencao';
}

export interface StockMovement {
  id: string;
  materialId: string;
  materialName: string;
  date: string;
  type: 'entrada' | 'saida_manual' | 'consumo_os' | 'ajuste';
  quantity: number;
  previousStock: number;
  newStock: number;
  orderCode?: string;
  notes: string;
}

export type ActivePage = 'visao_geral' | 'pedidos' | 'calculo_custo' | 'estoque' | 'maquinas';
