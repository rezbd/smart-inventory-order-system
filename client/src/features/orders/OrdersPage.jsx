import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrders, useCreateOrder, useCancelOrder } from './useOrders';
import { useProducts } from '../products/useProducts';
import Modal      from '../../components/common/Modal';
import Badge      from '../../components/common/Badge';
import Spinner    from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';

const STATUS_FILTERS = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
const EMPTY_ITEM     = { product: '', quantity: 1 };

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [isOpen, setIsOpen]             = useState(false);
  const [form, setForm]                 = useState({ customerName: '', customerEmail: '', notes: '', items: [{ ...EMPTY_ITEM }] });
  const [formError, setFormError]       = useState('');

  const params = statusFilter !== 'All' ? { status: statusFilter } : {};
  const { data, isLoading }       = useOrders(params);
  const { data: products = [] }   = useProducts();
  const createOrder = useCreateOrder();
  const cancelOrder = useCancelOrder();

  const orders = data?.data?.orders || [];

  const addItem    = () => setForm((p) => ({ ...p, items: [...p.items, { ...EMPTY_ITEM }] }));
  const removeItem = (i) => setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, value) =>
    setForm((p) => ({
      ...p,
      items: p.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item),
    }));

  // Calculate live preview total
  const previewTotal = form.items.reduce((sum, item) => {
    const product = products.find((p) => p._id === item.product);
    return sum + (product ? product.price * Number(item.quantity || 0) : 0);
  }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    const validItems = form.items.filter((i) => i.product && i.quantity > 0);
    if (validItems.length === 0) { setFormError('Add at least one product.'); return; }

    createOrder.mutate(
      { ...form, items: validItems.map((i) => ({ product: i.product, quantity: Number(i.quantity) })) },
      {
        onSuccess: () => { setIsOpen(false); setForm({ customerName: '', customerEmail: '', notes: '', items: [{ ...EMPTY_ITEM }] }); },
        onError: (err) => setFormError(err.response?.data?.message || 'Order failed.'),
      }
    );
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-panel border border-border rounded-lg p-1 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
                statusFilter === s
                  ? 'bg-amber text-void font-600'
                  : 'text-dim hover:text-soft'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-amber hover:bg-amber-glow text-void font-display font-700 px-5 py-2 rounded text-sm uppercase tracking-wider transition-all"
        >
          + New Order
        </button>
      </div>

      {/* Table */}
      <div className="bg-panel border border-border rounded-lg shadow-panel overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12"><Spinner size="lg" /></div>
        ) : orders.length === 0 ? (
          <EmptyState icon="◈" title="No orders" description="Create your first order to get started." />
        ) : (
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border">
                {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Created', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-muted uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-3">
                    <Link to={`/orders/${order._id}`} className="text-amber hover:text-amber-glow transition-colors font-500">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-bright">{order.customerName}</td>
                  <td className="px-5 py-3 text-dim">{order.items?.length ?? 0}</td>
                  <td className="px-5 py-3 text-bright">${order.totalAmount.toFixed(2)}</td>
                  <td className="px-5 py-3"><Badge label={order.status} /></td>
                  <td className="px-5 py-3 text-muted">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      <Link to={`/orders/${order._id}`} className="text-dim hover:text-amber transition-colors">
                        View
                      </Link>
                      {!['Delivered', 'Cancelled'].includes(order.status) && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Cancel ${order.orderNumber}? Stock will be restored.`))
                              cancelOrder.mutate(order._id);
                          }}
                          className="text-dim hover:text-rose transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Order Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create New Order" maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="px-4 py-3 bg-rose-dim border border-rose/30 rounded text-rose text-xs font-mono">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-soft text-[11px] font-mono uppercase tracking-widest mb-1.5">Customer Name *</label>
              <input
                value={form.customerName}
                onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                placeholder="John Doe"
                required
                className="w-full bg-surface border border-border rounded px-4 py-2.5 text-bright font-mono text-sm placeholder:text-muted focus:outline-none focus:border-amber transition-colors"
              />
            </div>
            <div>
              <label className="block text-soft text-[11px] font-mono uppercase tracking-widest mb-1.5">Customer Email</label>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))}
                placeholder="john@example.com"
                className="w-full bg-surface border border-border rounded px-4 py-2.5 text-bright font-mono text-sm placeholder:text-muted focus:outline-none focus:border-amber transition-colors"
              />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-soft text-[11px] font-mono uppercase tracking-widest">Order Items *</label>
              <button type="button" onClick={addItem} className="text-amber text-[11px] font-mono hover:text-amber-glow transition-colors">
                + Add item
              </button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => {
                const selectedProduct = products.find((p) => p._id === item.product);
                const subtotal        = selectedProduct ? selectedProduct.price * Number(item.quantity || 0) : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <select
                      value={item.product}
                      onChange={(e) => updateItem(i, 'product', e.target.value)}
                      className="flex-1 bg-surface border border-border rounded px-3 py-2 text-bright font-mono text-xs focus:outline-none focus:border-amber transition-colors"
                    >
                      <option value="">Select product...</option>
                      {products
                        .filter((p) => p.status === 'Active' && p.stock > 0)
                        .map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} — ${p.price.toFixed(2)} (stock: {p.stock})
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct?.stock || 9999}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                      className="w-20 bg-surface border border-border rounded px-3 py-2 text-bright font-mono text-xs focus:outline-none focus:border-amber transition-colors"
                    />
                    <span className="text-dim font-mono text-xs w-20 text-right">
                      ${subtotal.toFixed(2)}
                    </span>
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(i)} className="text-muted hover:text-rose transition-colors text-sm w-5">
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total preview */}
          <div className="flex items-center justify-between py-2 border-t border-border">
            <span className="text-dim text-xs font-mono uppercase tracking-wider">Estimated Total</span>
            <span className="text-amber font-mono text-lg">${previewTotal.toFixed(2)}</span>
          </div>

          <div>
            <label className="block text-soft text-[11px] font-mono uppercase tracking-widest mb-1.5">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              placeholder="Order notes..."
              className="w-full bg-surface border border-border rounded px-4 py-2.5 text-bright font-mono text-sm placeholder:text-muted focus:outline-none focus:border-amber transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={createOrder.isPending}
              className="flex-1 bg-amber hover:bg-amber-glow text-void font-display font-700 py-2.5 rounded text-sm uppercase tracking-wider disabled:opacity-50 transition-all"
            >
              {createOrder.isPending ? 'Processing...' : 'Place Order'}
            </button>
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 bg-surface border border-border text-soft hover:text-bright rounded text-sm font-mono transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}