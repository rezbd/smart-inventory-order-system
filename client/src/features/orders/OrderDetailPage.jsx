import { useParams, useNavigate } from 'react-router-dom';
import { useOrder, useUpdateOrderStatus, useCancelOrder } from './useOrders';
import Badge   from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

const TRANSITIONS = {
  Pending:   ['Confirmed'],
  Confirmed: ['Shipped'],
  Shipped:   ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

export default function OrderDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { data: order, isLoading } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder  = useCancelOrder();

  if (isLoading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
  if (!order)    return <div className="text-rose font-mono p-6">Order not found.</div>;

  const nextStatuses = TRANSITIONS[order.status] || [];

  return (
    <div className="max-w-3xl space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/orders')} className="text-dim hover:text-soft font-mono text-xs mb-3 transition-colors">
            ← Back to Orders
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-700 text-2xl text-bright">{order.orderNumber}</h1>
            <Badge label={order.status} />
          </div>
          <p className="text-dim font-mono text-xs mt-1">
            Created {new Date(order.createdAt).toLocaleString()}
            {order.createdBy && ` by ${order.createdBy.name}`}
          </p>
        </div>
        <div className="flex gap-2">
          {nextStatuses.map((status) => (
            <button
              key={status}
              onClick={() => updateStatus.mutate({ id: order._id, status })}
              disabled={updateStatus.isPending}
              className="bg-amber hover:bg-amber-glow text-void font-display font-700 px-4 py-2 rounded text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              Mark {status}
            </button>
          ))}
          {!['Delivered', 'Cancelled'].includes(order.status) && (
            <button
              onClick={() => {
                if (window.confirm('Cancel this order? Stock will be restored.'))
                  cancelOrder.mutate(order._id, { onSuccess: () => navigate('/orders') });
              }}
              className="bg-surface border border-rose/40 text-rose hover:bg-rose-dim px-4 py-2 rounded text-xs font-mono uppercase tracking-wider transition-all"
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Customer info */}
      <div className="bg-panel border border-border rounded-lg shadow-panel p-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-muted text-[10px] font-mono uppercase tracking-widest mb-1">Customer</p>
          <p className="text-bright font-display font-600">{order.customerName}</p>
          {order.customerEmail && <p className="text-dim font-mono text-xs">{order.customerEmail}</p>}
        </div>
        <div>
          <p className="text-muted text-[10px] font-mono uppercase tracking-widest mb-1">Order Total</p>
          <p className="text-amber font-mono text-2xl font-300">${order.totalAmount.toFixed(2)}</p>
        </div>
        {order.notes && (
          <div className="col-span-2">
            <p className="text-muted text-[10px] font-mono uppercase tracking-widest mb-1">Notes</p>
            <p className="text-soft font-mono text-sm">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Line items */}
      <div className="bg-panel border border-border rounded-lg shadow-panel overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display font-600 text-sm text-bright">Order Items</h2>
        </div>
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border">
              {['Product', 'SKU', 'Qty', 'Unit Price', 'Subtotal'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-muted uppercase tracking-wider text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-5 py-3 text-bright font-display font-500">{item.productName}</td>
                <td className="px-5 py-3 text-dim">{item.product?.sku || '—'}</td>
                <td className="px-5 py-3 text-bright">{item.quantity}</td>
                <td className="px-5 py-3 text-soft">${item.priceAtOrder.toFixed(2)}</td>
                <td className="px-5 py-3 text-amber">${item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
            <tr className="bg-surface/50">
              <td colSpan={4} className="px-5 py-3 text-right text-muted uppercase tracking-wider text-[10px]">Total</td>
              <td className="px-5 py-3 text-amber font-500 text-sm">${order.totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}