import api from './api';
import { User } from '../types';

export const UserService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  blockUser: async (id: string): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}/block`);
    return response.data;
  },

  unblockUser: async (id: string): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}/unblock`);
    return response.data;
  },
};
