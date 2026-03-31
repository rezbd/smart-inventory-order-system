import { useState } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from './useCategories';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';

export default function CategoriesPage() {
  const [isOpen, setIsOpen]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({ name: '', description: '' });

  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setIsOpen(true); };
  const openEdit   = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || '' }); setIsOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateCategory.mutate({ id: editing._id, ...form }, { onSuccess: () => setIsOpen(false) });
    } else {
      createCategory.mutate(form, { onSuccess: () => setIsOpen(false) });
    }
  };

  const isBusy = createCategory.isPending || updateCategory.isPending;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="bg-amber hover:bg-amber-glow text-void font-display font-700 px-5 py-2 rounded text-sm uppercase tracking-wider transition-all"
        >
          + Add Category
        </button>
      </div>

      <div className="bg-panel border border-border rounded-lg shadow-panel overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12"><Spinner size="lg" /></div>
        ) : categories.length === 0 ? (
          <EmptyState icon="◻" title="No categories" description="Create a category before adding products." />
        ) : (
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border">
                {['Name', 'Description', 'Products', 'Created', ''].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-muted uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                  <td className="px-5 py-3 text-bright font-display font-600">{c.name}</td>
                  <td className="px-5 py-3 text-dim max-w-xs truncate">{c.description || '—'}</td>
                  <td className="px-5 py-3 text-amber">{c.productCount}</td>
                  <td className="px-5 py-3 text-muted">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(c)} className="text-dim hover:text-amber transition-colors">Edit</button>
                      <button
                        onClick={() => {
                          if (c.productCount > 0) {
                            alert(`Cannot delete: ${c.productCount} product(s) use this category.`);
                            return;
                          }
                          if (window.confirm('Delete this category?')) deleteCategory.mutate(c._id);
                        }}
                        className="text-dim hover:text-rose transition-colors"
                      >Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editing ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-soft text-[11px] font-mono uppercase tracking-widest mb-1.5">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Electronics"
              required
              className="w-full bg-surface border border-border rounded px-4 py-2.5 text-bright font-mono text-sm placeholder:text-muted focus:outline-none focus:border-amber transition-colors"
            />
          </div>
          <div>
            <label className="block text-soft text-[11px] font-mono uppercase tracking-widest mb-1.5">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Brief description..."
              className="w-full bg-surface border border-border rounded px-4 py-2.5 text-bright font-mono text-sm placeholder:text-muted focus:outline-none focus:border-amber transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isBusy}
              className="flex-1 bg-amber hover:bg-amber-glow text-void font-display font-700 py-2.5 rounded text-sm uppercase tracking-wider disabled:opacity-50 transition-all"
            >
              {isBusy ? 'Saving...' : editing ? 'Update' : 'Create'}
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