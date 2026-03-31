import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { toast } from '../common/toast';

const KEYS = {
  all:  ['orders'],
  list: (params) => ['orders', 'list', params],
  one:  (id)     => ['orders', id],
};

export const useOrders = (params = {}) =>
  useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const { data } = await api.get('/orders', { params });
      return data;
    },
  });

export const useOrder = (id) =>
  useQuery({
    queryKey: KEYS.one(id),
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data.data.order;
    },
    enabled: !!id,
  });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/orders', payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['restock-queue'] });
      toast.success(`${res.data.data.order.orderNumber} created successfully.`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create order.'),
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Order status updated.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status.'),
  });
};

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/orders/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['restock-queue'] });
      toast.success('Order cancelled. Stock restored.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to cancel order.'),
  });
};