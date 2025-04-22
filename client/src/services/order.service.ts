import api from './api';
import { Order, OrderStatus } from '../types';

interface OrderFilters {
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  contactInfo?: string;
}

export const OrderService = {
  getAll: async (filters: OrderFilters = {}): Promise<Order[]> => {
    const response = await api.get<Order[]>('/orders', { params: filters });
    return response.data;
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await api.patch<Order>(`/orders/${id}/status`, { status });
    return response.data;
  },
};
