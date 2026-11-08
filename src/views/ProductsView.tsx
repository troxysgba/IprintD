import React, { useState, useMemo, useRef } from 'react';
import { RegisteredProduct } from '../types';
import { formatBRL } from '../utils/calculator';
import {
  AlertTriangle,
  Boxes,
  Camera,
  Check,
  ChevronDown,
  Cloud,
  Edit2,
  Image as ImageIcon,
  Minus,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  PlusCircle,
  Search,
  ShoppingCart,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';

interface ProductsViewProps {
  products: RegisteredProduct[];
  onSaveProduct: (product: RegisteredProduct) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onUpdateStock: (productId: string, newQuantity: number) => Promise<void>;
  onGenerateOrderForProduct: (product: RegisteredProduct) => void;
}

const CATEGORIES_LIST = [
  'Todos',
  'Papelaria',
  'Comunicação Visual',
  'Adesivos & Rótulos',
  'Brindes',
  'Crachás & Identificação',
  'Impressão Digital',
  'Outros',
];

const UNIT_OPTIONS = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'cento', label: 'Cento (100 un)' },
  { value: 'milheiro', label: 'Milheiro (1.000 un)' },
  { value: 'pct', label: 'Pacote (pct)' },
  { value: 'm²', label: 'Metro Quadrado (m²)' },
  { value: 'bloco', label: 'Bloco / Talão' },
];

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
  onUpdateStock,
  onGenerateOrderForProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<RegisteredProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<RegisteredProduct | null>(null);

  // Quick inline stock editing feedback
  const [updatingStockId, setUpdatingStockId] = useState<string | null>(null);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'Todos' && p.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = p.name.toLowerCase().includes(q);
        const mCode = p.code.toLowerCase().includes(q);
        const mCat = p.category.toLowerCase().includes(q);
        const mDesc = (p.description || '').toLowerCase().includes(q);
        return mName || mCode || mCat || mDesc;
      }

      return true;
    });
  }, [products, selectedCategory, searchTerm]);

  // Statistics
  const totalProducts = products.length;
  const lowStockProducts = products.filter(
    (p) => p.stockQuantity <= (p.minStock ?? 5)
  ).length;
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.price * p.stockQuantity,
    0
  );

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: RegisteredProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleStockQuickChange = async (productId: string, currentStock: number, delta: number) => {
    const next = Math.max(0, currentStock + delta);
    setUpdatingStockId(productId);
    await onUpdateStock(productId, next);
    setTimeout(() => setUpdatingStockId(null), 600);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase">
                Catálogo Geral
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sincronizado na Nuvem
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-1">
              Produtos Cadastrados
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gerencie seus produtos com fotos, tabela de preços de venda e controle de quantidade em estoque em tempo real.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all hover:scale-102 active:scale-98 cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Adicionar Novo Produto</span>
          </button>
        </div>

        {/* Real-time sync explanation banner */}
        <div className="bg-gradient-to-r from-amber-50/70 via-slate-50 to-emerald-50/60 border border-slate-200/90 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4 text-amber-600 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                <span>Catálogo de Produtos em Tempo Real</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Qualquer operador pode adicionar fotos, alterar preços e atualizar estoques. As alterações aparecem imediatamente em todos os computadores e celulares conectados.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
              <Package className="w-3.5 h-3.5 text-amber-600" />
              <span>{totalProducts} produtos</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <span>{formatBRL(totalInventoryValue)} em estoque</span>
            </span>
          </div>
        </div>

        {/* Search and Category Filters */}
        <div className="space-y-3 pt-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome do produto, código (ex: PROD-001) ou categoria..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {CATEGORIES_LIST.map((cat) => {
              const isActive = selectedCategory === cat;
              const count =
                cat === 'Todos'
                  ? products.length
                  : products.filter((p) => p.category === cat).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Nenhum produto encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'Todos'
              ? 'Nenhum produto corresponde aos filtros pesquisados. Tente limpar os filtros.'
              : 'Você ainda não cadastrou produtos. Clique no botão acima para cadastrar seu primeiro produto com foto e preço!'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Cadastrar Produto Agora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((prod) => {
            const isLowStock = prod.stockQuantity <= (prod.minStock ?? 5);
            const isOutOfStock = prod.stockQuantity === 0;

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition-all duration-200 overflow-hidden flex flex-col group"
              >
                {/* Product Image Box */}
                <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
                  {prod.imageUrl ? (
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback on broken image link
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-1 p-4 text-center">
                      <ImageIcon className="w-10 h-10 stroke-[1.5] text-slate-300" />
                      <span className="text-[11px] font-medium">Sem imagem</span>
                    </div>
                  )}

                  {/* Category Pill Tag */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs shadow-xs">
                      <Tag className="w-2.5 h-2.5 text-amber-400" />
                      <span>{prod.category}</span>
                    </span>
                  </div>

                  {/* Stock Status Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    {isOutOfStock ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white shadow-xs">
                        Esgotado
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                        Estoque Baixo
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                        Disponível
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-1 text-slate-400 font-mono text-[10px]">
                      <span>{prod.code}</span>
                      <span>{prod.unit}</span>
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-2 mt-0.5">
                      {prod.name}
                    </h3>

                    {prod.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {prod.description}
                      </p>
                    )}

                    {/* Width and Height if available */}
                    {(prod.widthCm || prod.heightCm) && (
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Dimensões: {prod.widthCm || 0} x {prod.heightCm || 0} cm
                      </div>
                    )}
                  </div>

                  {/* Price & Stock Section */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Preço de Venda
                        </span>
                        <div className="text-lg font-black font-mono text-slate-900">
                          {formatBRL(prod.price)}
                        </div>
                      </div>

                      {prod.costPrice && prod.costPrice > 0 && (
                        <div className="text-right">
                          <span className="text-[9px] uppercase text-slate-400">Custo Est.</span>
                          <div className="text-xs font-mono font-medium text-slate-500">
                            {formatBRL(prod.costPrice)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Interactive Stock Quantity Editor */}
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[11px] font-bold text-slate-700">Qtd Estoque:</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStockQuickChange(prod.id, prod.stockQuantity, -1)}
                          disabled={prod.stockQuantity <= 0}
                          title="Diminuir 1 unidade"
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>

                        <input
                          type="number"
                          min="0"
                          value={prod.stockQuantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            onUpdateStock(prod.id, isNaN(val) ? 0 : Math.max(0, val));
                          }}
                          className="w-14 text-center font-mono font-bold text-xs py-0.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />

                        <button
                          type="button"
                          onClick={() => handleStockQuickChange(prod.id, prod.stockQuantity, 1)}
                          title="Aumentar 1 unidade"
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => onGenerateOrderForProduct(prod)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                      title="Gerar Ordem de Serviço ou Pedido com este produto"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Gerar Pedido</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(prod)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors border border-slate-200"
                      title="Editar dados, foto e preço deste produto"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-600" />
                    </button>

                    <button
                      onClick={() => setProductToDelete(prod)}
                      className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer transition-colors border border-red-200"
                      title="Excluir este produto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Adicionar / Editar Produto */}
      {isModalOpen && (
        <ProductFormModal
          initialProduct={editingProduct}
          existingProducts={products}
          onSave={async (product) => {
            await onSaveProduct(product);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Modal: Confirmação de Exclusão */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>Excluir Produto Cadastrado?</span>
              </div>
              <button
                onClick={() => setProductToDelete(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Tem certeza que deseja excluir permanentemente o produto{' '}
                <strong className="text-slate-900">{productToDelete.name}</strong> ({productToDelete.code})?
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 flex items-center gap-3">
                {productToDelete.imageUrl ? (
                  <img
                    src={productToDelete.imageUrl}
                    alt={productToDelete.name}
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                  />
                ) : (
                  <Package className="w-8 h-8 text-slate-400 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-slate-900">{productToDelete.name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    Preço: {formatBRL(productToDelete.price)} · Estoque: {productToDelete.stockQuantity} {productToDelete.unit}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-red-500 font-medium">
                Esta ação remove o produto da nuvem para toda a equipe.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir Produto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ProductFormModalProps {
  initialProduct: RegisteredProduct | null;
  existingProducts: RegisteredProduct[];
  onSave: (product: RegisteredProduct) => Promise<void>;
  onClose: () => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  initialProduct,
  existingProducts,
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialProduct);

  const [code, setCode] = useState(
    initialProduct?.code || `PROD-${String(existingProducts.length + 1).padStart(3, '0')}`
  );
  const [name, setName] = useState(initialProduct?.name || '');
  const [category, setCategory] = useState(initialProduct?.category || 'Papelaria');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [price, setPrice] = useState<number>(initialProduct?.price ?? 50.0);
  const [costPrice, setCostPrice] = useState<number>(initialProduct?.costPrice ?? 20.0);
  const [stockQuantity, setStockQuantity] = useState<number>(initialProduct?.stockQuantity ?? 10);
  const [minStock, setMinStock] = useState<number>(initialProduct?.minStock ?? 5);
  const [unit, setUnit] = useState(initialProduct?.unit || 'un');
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl || '');
  const [widthCm, setWidthCm] = useState<number | undefined>(initialProduct?.widthCm);
  const [heightCm, setHeightCm] = useState<number | undefined>(initialProduct?.heightCm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress & convert uploaded image to Base64 (max 800x800 for instant Firestore syncing)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          setImageUrl(compressedBase64);
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const finalCategory = category === 'Outros' && customCategory.trim() ? customCategory.trim() : category;

    const newProd: RegisteredProduct = {
      id: initialProduct?.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: code.trim() || 'PROD-001',
      name: name.trim(),
      category: finalCategory,
      description: description.trim(),
      price: Math.max(0, Number(price) || 0),
      costPrice: costPrice !== undefined ? Math.max(0, Number(costPrice) || 0) : 0,
      stockQuantity: Math.max(0, Number(stockQuantity) || 0),
      minStock: Math.max(0, Number(minStock) || 0),
      unit,
      imageUrl: imageUrl.trim() || '',
      widthCm: widthCm ? Number(widthCm) : undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      createdAt: initialProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSave(newProd);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                {isEditing ? 'Editar Produto Cadastrado' : 'Cadastrar Novo Produto'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Preencha os dados, imagem, preço e quantidade em estoque.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* 1. Imagem do Produto */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-amber-600" />
              <span>Imagem / Foto do Produto</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              {/* Preview Box */}
              <div className="w-28 h-28 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs relative group">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 cursor-pointer"
                      title="Remover foto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="text-center text-slate-400 p-2">
                    <ImageIcon className="w-8 h-8 mx-auto stroke-[1.5] text-slate-300 mb-1" />
                    <span className="text-[10px]">Sem foto</span>
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex-1 space-y-2.5 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Carregar Foto do Aparelho</span>
                  </button>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="px-3 py-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-semibold cursor-pointer border border-red-200"
                    >
                      Limpar Foto
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-medium">
                    Ou cole o link de uma imagem da internet:
                  </span>
                  <input
                    type="url"
                    value={imageUrl.startsWith('data:') ? '' : imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/foto-produto.jpg"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Código e Nome do Produto */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3 space-y-1">
              <label className="font-bold text-slate-700">Código</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PROD-001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="sm:col-span-9 space-y-1">
              <label className="font-bold text-slate-700">
                Nome do Produto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Cartão de Visita Couché 300g 9x5 cm"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* 3. Categoria e Unidade de Medida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {CATEGORIES_LIST.filter((c) => c !== 'Todos').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {category === 'Outros' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Especifique a categoria..."
                  className="w-full mt-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Unidade de Venda</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Preço de Venda e Preço de Custo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/80">
            <div className="space-y-1">
              <label className="font-extrabold text-slate-900 flex items-center justify-between">
                <span>Preço de Venda (R$) *</span>
                <span className="text-[10px] text-amber-700 font-bold">Cobrado do cliente</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-black text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>Custo de Produção (R$)</span>
                <span className="text-[10px] text-slate-500">Estimado</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 font-bold text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-medium text-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
          </div>

          {/* 5. Quantidade em Estoque e Estoque Mínimo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <label className="font-extrabold text-slate-900 flex items-center justify-between">
                <span>Quantidade em Estoque *</span>
                <span className="text-[10px] text-slate-500">Saldo atual</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 flex items-center justify-between">
                <span>Estoque Mínimo de Alerta</span>
                <span className="text-[10px] text-slate-500">Aviso</span>
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-medium text-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* 6. Medidas Opcionais (Largura x Altura em cm) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Largura (cm) - Opcional</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={widthCm ?? ''}
                onChange={(e) => setWidthCm(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="ex: 9"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Altura (cm) - Opcional</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={heightCm ?? ''}
                onChange={(e) => setHeightCm(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="ex: 5"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* 7. Descrição / Detalhes */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Descrição / Observações</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhes como tipo de papel, acabamentos inclusos ou prazos..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-all"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
