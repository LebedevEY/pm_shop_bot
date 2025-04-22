export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  telegramId?: string;
  isBlocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  orderId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  user: User;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  contactInfo: string;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  email: string;
}
