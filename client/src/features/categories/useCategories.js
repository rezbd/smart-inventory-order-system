import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { toast } from '../common/toast';

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data.categories;
    },
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/categories', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category created.'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create category.'),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.patch(`/categories/${id}`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category updated.'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update.'),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category deleted.'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete.'),
  });
};