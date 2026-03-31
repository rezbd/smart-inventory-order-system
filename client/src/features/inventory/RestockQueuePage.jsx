import { useState } from 'react';
import { useRestockQueue, useRestockProduct } from './useRestock';
import Modal      from '../../components/common/Modal';
import Badge      from '../../components/common/Badge';
import Spinner    from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';

export default function RestockQueuePage() {
  const { data: queue = [], isLoading, isFetching } = useRestockQueue();
  const restockProduct = useRestockProduct();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity]               = useState('');

  const openRestock = (product) => { setSelectedProduct(product); setQuantity(''); };

  const handleRestock = (e) => {
    e.preventDefault();
    if (!quantity || Number(quantity) < 1) return;
    restockProduct.mutate(
      { productId: selectedProduct._id, quantity: Number(quantity) },
      { onSuccess: () => setSelectedProduct(null) }
    );
  };

  const urgencyColor = (ratio) => {
    if (ratio === 0) return 'text-rose';
    if (ratio < 0.3) return 'text-rose';
    if (ratio < 0.6) return 'text-amber';
    return 'text-sky';
  };

  const urgencyLabel = (ratio) => {
    if (ratio === 0) return 'CRITICAL';
    if (ratio < 0.3) return 'HIGH';
    if (ratio < 0.6) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {queue.length > 0 && (
            <span className="bg-rose/10 border border-rose/30 text-rose text-xs font-mono px-3 py-1 rounded">
              {queue.length} product{queue.length !== 1 ? 's' : ''} need restocking
            </span>
          )}
          {isFetching && <Spinner size="sm" />}
        </div>
        <p className="text-muted text-[11px] font-mono">Auto-refreshes every 30s</p>
      </div>

      {/* Queue Table */}
      <div className="bg-panel border border-border rounded-lg shadow-panel overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12"><Spinner size="lg" /></div>
        ) : queue.length === 0 ? (
          <EmptyState
            icon="✓"
            title="All stocked up"
            description="No products are below their minimum stock threshold."
          />
        ) : (
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border">
                {['Urgency', 'Product', 'SKU', 'Category', 'Current Stock', 'Threshold', 'Deficit', 'Status', 'Action'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-muted uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.map((product, i) => (
                <tr
                  key={product._id}
                  className="border-b border-border/50 hover:bg-surface/50 transition-colors"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <td className="px-4 py-3">
                    <span className={`font-700 text-[10px] uppercase tracking-wider ${urgencyColor(product.urgencyRatio)}`}>
                      {urgencyLabel(product.urgencyRatio)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-bright font-display font-600 max-w-[140px] truncate">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-dim">{product.sku}</td>
                  <td className="px-4 py-3 text-soft">{product.category?.name || '—'}</td>
                  <td className={`px-4 py-3 font-500 ${urgencyColor(product.urgencyRatio)}`}>
                    {product.stock}
                  </td>
                  <td className="px-4 py-3 text-dim">{product.minStockThreshold}</td>
                  <td className="px-4 py-3 text-rose">−{product.stockDeficit}</td>
                  <td className="px-4 py-3"><Badge label={product.status} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openRestock(product)}
                      className="bg-emerald/10 border border-emerald/30 text-emerald hover:bg-emerald/20 px-3 py-1.5 rounded text-[11px] font-mono uppercase tracking-wider transition-all"
                    >
                      Restock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Restock Modal */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={`Restock: ${selectedProduct?.name}`}
      >
        {selectedProduct && (
          <form onSubmit={handleRestock} className="space-y-5">
            {/* Current stock info */}
            <div className="bg-surface border border-border rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-muted text-[10px] font-mono uppercase tracking-widest mb-1">Current</p>
                <p className={`font-mono text-xl ${urgencyColor(selectedProduct.urgencyRatio)}`}>
                  {selectedProduct.stock}
                </p>
              </div>
              <div>
                <p className="text-muted text-[10px] font-mono uppercase tracking-widest mb-1">Threshold</p>
                <p className="font-mono text-xl text-bright">{selectedProduct.minStockThreshold}</p>
              </div>
              <div>
                <p className="text-muted text-[10px] font-mono uppercase tracking-widest mb-1">Deficit</p>
                <p className="font-mono text-xl text-rose">−{selectedProduct.stockDeficit}</p>
              </div>
            </div>

            <div>
              <label className="block text-soft text-[11px] font-mono uppercase tracking-widest mb-1.5">
                Quantity to Add
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Suggested: ${selectedProduct.stockDeficit}`}
                required
                autoFocus
                className="w-full bg-surface border border-border rounded px-4 py-2.5 text-bright font-mono text-sm placeholder:text-muted focus:outline-none focus:border-emerald transition-colors"
              />
              {quantity > 0 && (
                <p className="text-emerald text-xs font-mono mt-1.5">
                  New stock will be: {selectedProduct.stock + Number(quantity)}
                  {selectedProduct.stock + Number(quantity) >= selectedProduct.minStockThreshold
                    ? ' ✓ Above threshold'
                    : ' — still below threshold'}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={restockProduct.isPending}
                className="flex-1 bg-emerald hover:opacity-90 text-void font-display font-700 py-2.5 rounded text-sm uppercase tracking-wider disabled:opacity-50 transition-all"
              >
                {restockProduct.isPending ? 'Restocking...' : 'Confirm Restock'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 bg-surface border border-border text-soft hover:text-bright rounded text-sm font-mono transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}