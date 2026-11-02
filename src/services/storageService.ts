import {
  CompanySettings,
  Equipment,
  Invoice,
  Material,
  Order,
  StockMovement,
} from '../types';
import {
  INITIAL_EQUIPMENTS,
  INITIAL_INVOICES,
  INITIAL_MATERIALS,
  INITIAL_ORDERS,
  INITIAL_SETTINGS,
  INITIAL_STOCK_MOVEMENTS,
} from '../utils/mockData';

const KEYS = {
  SETTINGS: 'printflow_settings',
  MATERIALS: 'printflow_materials',
  EQUIPMENTS: 'printflow_equipments',
  ORDERS: 'printflow_orders',
  INVOICES: 'printflow_invoices',
  MOVEMENTS: 'printflow_movements',
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
  getSettings(): CompanySettings {
    return load<CompanySettings>(KEYS.SETTINGS, INITIAL_SETTINGS);
  },
  saveSettings(settings: CompanySettings): void {
    save(KEYS.SETTINGS, settings);
  },

  getMaterials(): Material[] {
    return load<Material[]>(KEYS.MATERIALS, INITIAL_MATERIALS);
  },
  saveMaterials(materials: Material[]): void {
    save(KEYS.MATERIALS, materials);
  },

  getEquipments(): Equipment[] {
    return load<Equipment[]>(KEYS.EQUIPMENTS, INITIAL_EQUIPMENTS);
  },
  saveEquipments(equipments: Equipment[]): void {
    save(KEYS.EQUIPMENTS, equipments);
  },

  getOrders(): Order[] {
    return load<Order[]>(KEYS.ORDERS, INITIAL_ORDERS);
  },
  saveOrders(orders: Order[]): void {
    save(KEYS.ORDERS, orders);
  },

  getInvoices(): Invoice[] {
    return load<Invoice[]>(KEYS.INVOICES, INITIAL_INVOICES);
  },
  saveInvoices(invoices: Invoice[]): void {
    save(KEYS.INVOICES, invoices);
  },

  getStockMovements(): StockMovement[] {
    return load<StockMovement[]>(KEYS.MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
  },
  saveStockMovements(movements: StockMovement[]): void {
    save(KEYS.MOVEMENTS, movements);
  },

  /**
   * Registra uma movimentação e ajusta o estoque do material
   */
  recordStockMovement(
    materialId: string,
    type: 'entrada' | 'saida_manual' | 'consumo_os' | 'ajuste',
    quantity: number,
    notes: string,
    orderCode?: string
  ): void {
    const materials = this.getMaterials();
    const matIndex = materials.findIndex((m) => m.id === materialId);
    if (matIndex === -1) return;

    const material = materials[matIndex];
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
    materials[matIndex] = material;
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

  /**
   * Dá baixa automática nos insumos consumidos por um pedido/OS
   */
  deductStockForOrder(order: Order): void {
    if (order.stockDeducted) return;

    for (const item of order.items) {
      if (item.materialId && (item.sheetsNeeded || item.wasteSheets)) {
        const totalSheets = (item.sheetsNeeded || 0) + (item.wasteSheets || 0);
        this.recordStockMovement(
          item.materialId,
          'consumo_os',
          totalSheets,
          `Baixa automática de produção para ${item.description}`,
          order.code
        );
      }
    }

    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.id === order.id);
    if (idx !== -1) {
      orders[idx].stockDeducted = true;
      this.saveOrders(orders);
    }
  },

  /**
   * Emite automaticamente uma NFS-e com layout oficial para o pedido
   */
  issueInvoiceForOrder(order: Order): Invoice {
    const settings = this.getSettings();
    const invoices = this.getInvoices();

    // Próximo número sequencial
    const maxNum = invoices.reduce((max, inv) => Math.max(max, inv.number), 1040);
    const invoiceNumber = maxNum + 1;

    // Gerador de Chave de Acesso no padrão SEFAZ de 44 dígitos
    const yearMonth = new Date().toISOString().slice(2, 7).replace('-', '');
    const cleanCnpj = settings.cnpj.replace(/\D/g, '').padEnd(14, '0');
    const randomCode = Math.floor(10000000 + Math.random() * 90000000);
    const accessKey = `35${yearMonth}${cleanCnpj}55001${String(invoiceNumber).padStart(9, '0')}1${randomCode}1`;

    const randomProtocol = `SP${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(1000000 + Math.random() * 9000000)}`;
    const randomVerifyCode = `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const taxableBase = order.total;
    const issRate = settings.defaultIssRate || 3.5;
    const issAmount = Number(((taxableBase * issRate) / 100).toFixed(2));
    const pisAmount = Number(((taxableBase * 0.65) / 100).toFixed(2));
    const cofinsAmount = Number(((taxableBase * 3.0) / 100).toFixed(2));
    const netAmount = Number((taxableBase - issAmount).toFixed(2));

    const itemsSummary = order.items
      .map((it) => `${it.quantity}x ${it.description}`)
      .join(' | ');

    const fullDescription = `Prestação de Serviços Gráficos conforme ${order.code}: ${itemsSummary}. Sujeito ao ISSQN conforme Lei Complementar 116/03, Subitem 13.05 (Serviços gráficos, composição, fotocomposição e acabamento). Empresa optante pelo ${settings.taxRegime}.`;

    const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<NFSe versao="2.04">
  <InfNFSe Id="NFS${invoiceNumber}">
    <Numero>${invoiceNumber}</Numero>
    <CodigoVerificacao>${randomVerifyCode}</CodigoVerificacao>
    <DataEmissao>${new Date().toISOString()}</DataEmissao>
    <ChaveAcesso>${accessKey}</ChaveAcesso>
    <Protocolo>${randomProtocol}</Protocolo>
    <PrestadorServico>
      <Cnpj>${cleanCnpj}</Cnpj>
      <InscricaoMunicipal>${settings.im}</InscricaoMunicipal>
      <RazaoSocial>${settings.legalName}</RazaoSocial>
      <NomeFantasia>${settings.tradeName}</NomeFantasia>
      <RegimeTributario>${settings.taxRegime}</RegimeTributario>
    </PrestadorServico>
    <TomadorServico>
      <CpfCnpj>${order.clientDoc || 'NÃO INFORMADO'}</CpfCnpj>
      <RazaoSocial>${order.clientName}</RazaoSocial>
      <Email>${order.clientEmail || ''}</Email>
      <Telefone>${order.clientPhone || ''}</Telefone>
    </TomadorServico>
    <Servico>
      <Valores>
        <ValorServicos>${taxableBase.toFixed(2)}</ValorServicos>
        <BaseCalculo>${taxableBase.toFixed(2)}</BaseCalculo>
        <Aliquota>${(issRate / 100).toFixed(4)}</Aliquota>
        <ValorIss>${issAmount.toFixed(2)}</ValorIss>
        <ValorPis>${pisAmount.toFixed(2)}</ValorPis>
        <ValorCofins>${cofinsAmount.toFixed(2)}</ValorCofins>
        <ValorLiquidoNfse>${netAmount.toFixed(2)}</ValorLiquidoNfse>
      </Valores>
      <ItemListaServico>13.05</ItemListaServico>
      <Discriminacao>${fullDescription}</Discriminacao>
    </Servico>
  </InfNFSe>
</NFSe>`;

    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      number: invoiceNumber,
      series: 1,
      type: 'NFS-e',
      accessKey,
      orderId: order.id,
      orderCode: order.code,
      clientName: order.clientName,
      clientDoc: order.clientDoc,
      clientAddress: 'Conforme cadastro comercial do tomador',
      issueDate: new Date().toISOString(),
      servicesDescription: fullDescription,
      totalAmount: taxableBase,
      deductions: 0,
      taxableBase,
      issRate,
      issAmount,
      pisRate: 0.65,
      pisAmount,
      cofinsRate: 3.0,
      cofinsAmount,
      netAmount,
      status: 'autorizada',
      protocol: randomProtocol,
      verificationCode: randomVerifyCode,
      xmlData,
    };

    this.saveInvoices([newInvoice, ...invoices]);

    // Atualiza o pedido com os dados fiscais
    const orders = this.getOrders();
    const oIdx = orders.findIndex((o) => o.id === order.id);
    if (oIdx !== -1) {
      orders[oIdx].hasNfIssued = true;
      orders[oIdx].invoiceId = newInvoice.id;
      orders[oIdx].invoiceNumber = newInvoice.number;
      this.saveOrders(orders);
    }

    return newInvoice;
  },

  /**
   * Converte orçamento em Ordem de Serviço / Pedido
   */
  convertQuoteToOrder(quoteId: string): Order | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.id === quoteId);
    if (idx === -1) return null;

    const currentYear = new Date().getFullYear();
    const randomSerial = Math.floor(100 + Math.random() * 900);
    const newCode = `OS-${currentYear}-0${randomSerial}`;

    const updated: Order = {
      ...orders[idx],
      type: 'pedido',
      code: newCode,
      status: 'aprovado',
    };

    orders[idx] = updated;
    this.saveOrders(orders);
    return updated;
  },

  resetAll(): void {
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.MATERIALS);
    localStorage.removeItem(KEYS.EQUIPMENTS);
    localStorage.removeItem(KEYS.ORDERS);
    localStorage.removeItem(KEYS.INVOICES);
    localStorage.removeItem(KEYS.MOVEMENTS);
  },
};
