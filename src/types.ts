export type OrderStatus =
  | 'orcamento'
  | 'aprovado'
  | 'pre_impressao'
  | 'em_producao'
  | 'acabamento'
  | 'pronto'
  | 'entregue'
  | 'cancelado';

export type PaymentStatus = 'pendente' | 'parcial' | 'pago';

export type PaymentMethod =
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'dinheiro'
  | 'boleto'
  | 'faturado';

export interface FinishingOption {
  id: string;
  name: string;
  cost: number;
  price: number;
}

export interface OrderItem {
  id: string;
  description: string;
  productType: 'cartao' | 'panfleto' | 'folder' | 'banner' | 'adesivo' | 'livro_apostila' | 'outro';
  quantity: number;
  widthMm: number;
  heightMm: number;
  printSides: '4x0' | '4x4' | '1x0' | '1x1';
  materialId: string;
  materialName: string;
  equipmentId: string;
  equipmentName: string;
  sheetFormat: 'SRA3' | 'A3' | 'A4' | 'Bobina_m2';
  itemsPerSheet: number;
  sheetsNeeded: number;
  wasteSheets: number;
  materialCost: number;
  printClickCost: number;
  finishingsCost: number;
  laborAndDepreciationCost: number;
  totalProductionCost: number;
  suggestedMarginPercent: number;
  unitPrice: number;
  totalPrice: number;
  finishings: FinishingOption[];
  fileNotes?: string;
}

export interface Order {
  id: string;
  code: string; // e.g. OS-2026-0142
  type: 'pedido' | 'orcamento';
  clientName: string;
  clientDoc: string; // CPF or CNPJ
  clientPhone: string;
  clientEmail: string;
  createdAt: string;
  deadline: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;
  profitEstimate: number;
  notes: string;
  hasNfIssued: boolean;
  invoiceId?: string;
  invoiceNumber?: number;
  stockDeducted: boolean;
}

export type MaterialCategory =
  | 'papel_folha'
  | 'bobina_plotter'
  | 'tinta_toner'
  | 'acabamento'
  | 'embalagem';

export interface Material {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: 'folha' | 'm2' | 'unidade' | 'pct' | 'bobina' | 'litro';
  widthMm?: number;
  heightMm?: number;
  grammage?: number;
  currentStock: number;
  minStock: number;
  costPerUnit: number;
  supplier: string;
  lastPurchaseDate: string;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: 'impressora_laser' | 'plotter_comunicacao' | 'guilhotina' | 'laminadora' | 'encadernadora' | 'corte_digital';
  clickCostPB: number; // R$ por clique PB
  clickCostColor: number; // R$ por clique Color
  hourlyRate: number; // Custo hora operacional (R$/h)
  speedPerHour: number; // Folhas/h ou m²/h
  maxSheetWidthMm: number;
  maxSheetHeightMm: number;
  status: 'operacional' | 'manutencao' | 'ocioso';
  maintenanceCostMonthly: number;
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

export interface Invoice {
  id: string;
  number: number;
  series: number;
  type: 'NFS-e' | 'NF-e' | 'NFC-e';
  accessKey: string;
  orderId: string;
  orderCode: string;
  clientName: string;
  clientDoc: string;
  clientAddress: string;
  issueDate: string;
  servicesDescription: string;
  totalAmount: number;
  deductions: number;
  taxableBase: number;
  issRate: number;
  issAmount: number;
  pisRate: number;
  pisAmount: number;
  cofinsRate: number;
  cofinsAmount: number;
  netAmount: number;
  status: 'autorizada' | 'cancelada' | 'processando';
  protocol: string;
  verificationCode: string;
  xmlData: string;
}

export interface CompanySettings {
  tradeName: string;
  legalName: string;
  cnpj: string;
  ie: string;
  im: string;
  phone: string;
  email: string;
  address: string;
  taxRegime: 'Simples Nacional' | 'MEI' | 'Lucro Presumido';
  defaultIssRate: number;
  defaultMarkupPercent: number;
  technicalWastePercent: number; // % perda de papel (quebra)
  autoIssueInvoiceOnFinish: boolean;
  currency: string;
}
