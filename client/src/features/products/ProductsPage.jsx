import { useState } from 'react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from './useProducts';
import { useCategories } from '../categories/useCategories';
import Modal       from '../../components/common/Modal';
import Badge       from '../../components/common/Badge';
import Spinner     from '../../components/common/Spinner';
import EmptyState  from '../../components/common/EmptyState';

const EMPTY_FORM = { name: '', category: '', price: '', stock: '', minStockThreshold: '', sku: '' };

export default function ProductsPage() {
  const [isOpen, setIsOpen]     = useState(false);
  const [editing, setEditing]   = useState(null); // product doc or null
  const [form, setForm]         = useState(EMPTY_FORM);
  const [search, setSearch]     = useState('');

  const { data: products = [], isLoading } = useProducts({ search: search || undefined });
  const { data: categories = [] }           = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setIsOpen(true); };
  const openEdit   = (p) => {
    setEditing(p);
    setForm({
      name: p.name, category: p.category?._id || '', price: p.price,
      stock: p.stock, minStockThreshold: p.minStockThreshold, sku: p.sku || '',
    });
    setIsOpen(true);
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price:             Number(form.price),
      stock:             Number(form.stock),
      minStockThreshold: Number(form.minStockThreshold),
    };
    if (editing) {
      updateProduct.mutate({ id: editing._id, ...payload }, { onSuccess: () => setIsOpen(false) });
    } else {
      createProduct.mutate(payload, { onSuccess: () => setIsOpen(false) });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this product? This cannot be undone.')) {
      deleteProduct.mutate(id);
    }
  };

  const isBusy = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-panel border border-border rounded px-4 py-2 text-soft font-mono text-sm placeholder:text-muted focus:outline-none focus:border-amber transition-colors w-64"
        />
        <button
          onClick={openCreate}
          className="bg-amber hover:bg-amber-glow text-void font-display font-700 px-5 py-2 rounded text-sm uppercase tracking-wider transition-all duration-200"
        >
          + Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-panel border border-border rounded-lg shadow-panel overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12"><Spinner size="lg" /></div>
        ) : products.length === 0 ? (
          <EmptyState
            icon="⬡"
            title="No products found"
            description="Add your first product to get started."
            action={
              <button onClick={openCreate} className="bg-amber text-void font-display font-700 px-4 py-2 rounded text-sm uppercase tracking-wider">
                Add Product
              </button>
            }
          />
        ) : (
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border">
                {['Name', 'SKU', 'Category', 'Price', 'Stock', 'Min Threshold', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-muted uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLow = p.stock > 0 && p.stock < p.minStockThreshold;
                return (
                  <tr key={p._id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                    <td className="px-5 py-3 text-bright font-500 font-display">{p.name}</td>
                    <td className="px-5 py-3 text-dim">{p.sku}</td>
                    <td className="px-5 py-3 text-soft">{p.category?.name || '—'}</td>
                    <td className="px-5 py-3 text-bright">${p.price.toFixed(2)}</td>
                    <td className={`px-5 py-3 font-500 ${p.stock === 0 ? 'text-rose' : isLow ? 'text-amber' : 'text-emerald'}`}>
                      {p.stock}{isLow && <span className="text-amber ml-1">⚠</span>}
                    </td>
                    <td className="px-5 py-3 text-dim">{p.minStockThreshold}</td>
                    <td className="px-5 py-3"><Badge label={p.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(p)} className="text-dim hover:text-amber transition-colors">Edit</button>
                        <button onClick={() => handleDelete(p._id)} className="text-dim hover:text-rose transition-colors">Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={editing ? `Edit: ${editing.name}` : 'Add New Product'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'name',              label: 'Product Name',     type: 'text',   placeholder: 'e.g. Industrial Bolt M8' },
            { name: 'price',             label: 'Price ($)',         type: 'number', placeholder: '0.00' },
            { name: 'stock',             label: 'Stock Quantity',    type: 'number', placeholder: '0' },
            { name: 'minStockThreshold', label: 'Min Stock Threshold', type: 'number', placeholder: '10' },
            { name: 'sku',               label: 'SKU (optional)',    type: 'text',   placeholder: 'Auto-generated if blank' },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-soft text-[11px] font-mono uppercase tracking-widest mb-1.5">
                {field.label}
              </label>
              <input
                name={field.name}
                type={field.type}
                step={field.type === 'number' ? 'any' : undefined}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full bg-surface border border-border rounded px-4 py-2.5 text-bright font-mono text-sm placeholder:text-muted focus:outline-none focus:border-amber transition-colors"
              />
            </div>
          ))}
          <div>
            <label className="block text-soft text-[11px] font-mono uppercase tracking-widest mb-1.5">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full bg-surface border border-border rounded px-4 py-2.5 text-bright font-mono text-sm focus:outline-none focus:border-amber transition-colors"
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isBusy}
              className="flex-1 bg-amber hover:bg-amber-glow text-void font-display font-700 py-2.5 rounded text-sm uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {isBusy ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 bg-surface border border-border text-soft hover:text-bright rounded text-sm font-mono transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}