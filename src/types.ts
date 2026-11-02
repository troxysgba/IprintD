export type OrderStatus =
  | 'orcamento'
  | 'aprovado'
  | 'em_producao'
  | 'pronto'
  | 'entregue'
  | 'cancelado';

export type PaymentStatus = 'pendente' | 'parcial' | 'pago';

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'faturado';

export type SheetType = 'sra3' | 'a3' | 'a4' | 'bobina';

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

  // Detalhes do item (medidas em Centímetros - cm)
  productName: string;
  quantity: number;
  widthCm: number; // Largura em centímetros (cm)
  heightCm: number; // Altura em centímetros (cm)
  printSides: '4x0' | '4x4' | '1x0' | '1x1';
  materialId: string;
  materialName: string;
  equipmentId: string;
  equipmentName: string;

  // Imposição & Produção
  sheetType?: SheetType;
  rollWidthCm?: number;
  linearMetersNeeded?: number;
  itemsPerSheet: number;
  sheetsNeeded: number;
  wasteSheets: number;

  // Custos e Valores
  materialCost: number;
  clickCost: number;
  machineLaborCost: number;
  inkCost?: number; // Custo com tinta
  inkPercent?: number; // % custo de tinta (padrão 3%)
  depreciationCost?: number; // Depreciação de máquina
  depreciationPercent?: number; // % depreciação da máquina (padrão 10%)
  totalCost: number;
  markupPercent?: number;
  suggestedPrice: number;
  finalPrice: number;
  unitPrice: number;
  hasDelivery?: boolean;
  deliveryFee?: number;
  deliveryAddress?: string;
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
  widthCm?: number; // Largura em centímetros (cm)
  heightCm?: number; // Altura em centímetros (cm)
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
  category: 'laser' | 'jato_de_tinta' | 'plotter' | 'acabamento';
  clickCostPB: number;
  clickCostColor: number;
  hourlyRate: number;
  speedPerHour: number; // un/h ou m²/h
  status: 'operacional' | 'manutencao';
  inkPercent?: number; // % de custo com tinta sobre o pedido (ex: 3)
  depreciationPercent?: number; // % de depreciação da máquina sobre o pedido (ex: 10)
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

export interface QuickProductPreset {
  id: string;
  label: string;
  name: string;
  widthCm: number; // Largura em centímetros (cm)
  heightCm: number; // Altura em centímetros (cm)
  printSides: '4x0' | '4x4' | '1x0' | '1x1';
  quantity: number;
  materialKeyword: string;
  equipmentId?: string;
  isPlotter?: boolean;
  sheetType?: SheetType;
  rollWidthCm?: number;
}

export type ActivePage = 'visao_geral' | 'pedidos' | 'calculo_custo' | 'estoque' | 'maquinas';
