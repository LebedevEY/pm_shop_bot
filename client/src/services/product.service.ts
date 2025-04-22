import api from './api';
import { Product } from '../types';

export const ProductService = {
  getAll: async (isActive?: boolean): Promise<Product[]> => {
    const params = isActive !== undefined ? { active: isActive.toString() } : {};
    const response = await api.get<Product[]>('/products', { params });
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  create: async (productData: FormData | Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const config = productData instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    } : {};
    
    const response = await api.post<Product>('/products', productData, config);
    return response.data;
  },

  update: async (id: string, productData: FormData | Partial<Product>): Promise<Product> => {
    // Если обновляется только статус активности и это обычный объект (не FormData)
    if (!(productData instanceof FormData) && 
        Object.keys(productData).length === 1 && 
        'isActive' in productData) {
      // Используем JSON для отправки статуса активности
      const response = await api.put<Product>(`/products/${id}`, productData);
      return response.data;
    }
    
    // Для FormData используем специальные заголовки
    const config = productData instanceof FormData ? {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    } : {};
    
    const response = await api.put<Product>(`/products/${id}`, productData, config);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
