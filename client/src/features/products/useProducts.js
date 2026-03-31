import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { toast } from '../common/toast';

const KEYS = {
  all:  ['products'],
  list: (params) => ['products', 'list', params],
  one:  (id)     => ['products', id],
};

export const useProducts = (params = {}) =>
  useQuery({
    queryKey: KEYS.list(params),
    queryFn:  async () => {
      const { data } = await api.get('/products', { params });
      return data.data.products;
    },
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/products', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Product created successfully.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create product.'),
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.patch(`/products/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Product updated.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update product.'),
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success('Product deleted.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete product.'),
  });
};