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
  itemsPerSheet: number;
  sheetsNeeded: number;
  wasteSheets: number;

  // Custos e Valores
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
