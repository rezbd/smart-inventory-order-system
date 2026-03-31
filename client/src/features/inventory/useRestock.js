import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { toast } from '../common/toast';

export const useRestockQueue = () =>
  useQuery({
    queryKey: ['restock-queue'],
    queryFn: async () => {
      const { data } = await api.get('/inventory/restock-queue');
      return data.data.queue;
    },
    refetchInterval: 30_000, // Poll every 30s — stock changes from orders
  });

export const useRestockProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }) =>
      api.patch(`/inventory/restock/${productId}`, { quantity }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['restock-queue'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(res.data.message);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Restock failed.'),
  });
};