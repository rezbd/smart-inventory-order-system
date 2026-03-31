import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Badge   from '../../components/common/Badge';

const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/metrics');
      return data.data;
    },
    refetchInterval: 60_000,
  });

function MetricCard({ label, value, sub, accent = false, delay = '' }) {
  return (
    <div
      className={`animate-fade-up ${delay} bg-panel border rounded-lg p-5 shadow-panel ${
        accent ? 'border-amber/30 shadow-amber-glow' : 'border-border'
      }`}
    >
      <p className="text-dim text-[11px] font-mono uppercase tracking-widest mb-3">{label}</p>
      <p className={`font-mono text-3xl font-300 leading-none ${accent ? 'text-amber' : 'text-bright'}`}>
        {value}
      </p>
      {sub && <p className="text-muted text-xs font-mono mt-2">{sub}</p>}
    </div>
  );
}

function ActivityFeed({ logs }) {
  const ACTION_ICONS = {
    ORDER_CREATED:       '◈',
    ORDER_CANCELLED:     '✕',
    ORDER_STATUS_UPDATED:'↻',
    STOCK_DEDUCTED:      '↓',
    STOCK_RESTORED:      '↑',
    PRODUCT_RESTOCKED:   '⊕',
    PRODUCT_CREATED:     '⬡',
    PRODUCT_UPDATED:     '✎',
    USER_LOGIN:          '→',
    USER_REGISTERED:     '✦',
  };

  return (
    <div className="space-y-1">
      {logs.length === 0 && (
        <p className="text-dim text-xs font-mono py-4 text-center">No activity recorded yet.</p>
      )}
      {logs.map((log, i) => (
        <div
          key={log._id}
          className="flex items-start gap-3 px-3 py-2.5 rounded hover:bg-surface transition-colors"
          style={{ animationDelay: `${i * 0.04}s` }}
        >
          <span className="text-amber text-xs font-mono mt-0.5 flex-shrink-0 w-4">
            {ACTION_ICONS[log.action] || '·'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-soft text-xs font-mono leading-relaxed">{log.message}</p>
            <p className="text-muted text-[10px] font-mono mt-0.5">
              {new Date(log.createdAt).toLocaleString()}
              {log.performedBy && ` · ${log.performedBy.name}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-rose font-mono text-sm p-6">
        Failed to load dashboard: {error.message}
      </div>
    );
  }

  const { metrics, recentActivity, topProducts, recentOrders } = data;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Orders Today"
          value={metrics.ordersToday}
          sub={`${metrics.pendingOrders} pending`}
          accent
          delay="stagger-1"
        />
        <MetricCard
          label="Revenue Today"
          value={`$${metrics.revenueToday.toFixed(2)}`}
          sub="Delivered orders only"
          delay="stagger-2"
        />
        <MetricCard
          label="Low Stock"
          value={metrics.lowStockCount}
          sub={`${metrics.outOfStockCount} out of stock`}
          delay="stagger-3"
        />
        <MetricCard
          label="Completed Orders"
          value={metrics.completedOrders}
          sub={`of ${metrics.ordersToday} today`}
          delay="stagger-4"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Activity Feed */}
        <div className="lg:col-span-1 bg-panel border border-border rounded-lg shadow-panel animate-fade-up stagger-2">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-600 text-sm text-bright">Activity Log</h2>
            <span className="text-[10px] font-mono text-muted">LAST 10 EVENTS</span>
          </div>
          <div className="p-2">
            <ActivityFeed logs={recentActivity} />
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-panel border border-border rounded-lg shadow-panel animate-fade-up stagger-3">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-600 text-sm text-bright">Recent Orders</h2>
            <Link
              to="/orders"
              className="text-amber text-[11px] font-mono hover:text-amber-glow transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border">
                  {['Order #', 'Customer', 'Total', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-muted uppercase tracking-wider text-[10px]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-dim py-8">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr
                      key={order._id}
                      className="border-b border-border/50 hover:bg-surface/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <Link
                          to={`/orders/${order._id}`}
                          className="text-amber hover:text-amber-glow transition-colors"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-soft">{order.customerName}</td>
                      <td className="px-5 py-3 text-bright">${order.totalAmount.toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <Badge label={order.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-3 bg-panel border border-border rounded-lg shadow-panel animate-fade-up stagger-4">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display font-600 text-sm text-bright">Product Summary</h2>
            <Link
              to="/products"
              className="text-amber text-[11px] font-mono hover:text-amber-glow transition-colors"
            >
              Manage products →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border">
                  {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Threshold', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-muted uppercase tracking-wider text-[10px]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => {
                  const isLow = product.stock > 0 && product.stock < product.minStockThreshold;
                  return (
                    <tr
                      key={product._id}
                      className="border-b border-border/50 hover:bg-surface/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-bright font-500">{product.name}</td>
                      <td className="px-5 py-3 text-dim">{product.sku}</td>
                      <td className="px-5 py-3 text-soft">{product.category?.name || '—'}</td>
                      <td className="px-5 py-3 text-bright">${product.price.toFixed(2)}</td>
                      <td className={`px-5 py-3 ${isLow ? 'text-amber' : 'text-bright'}`}>
                        {product.stock}
                        {isLow && ' ⚠'}
                      </td>
                      <td className="px-5 py-3 text-dim">{product.minStockThreshold}</td>
                      <td className="px-5 py-3">
                        <Badge label={product.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}