import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
    id: string;

  @ManyToOne(() => Order, (order) => order.orderItems)
  @JoinColumn({ name: 'orderId' })
    order: Order;

  @Column()
    orderId: string;

  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn({ name: 'productId' })
    product: Product;

  @Column()
    productId: string;

  @Column()
    quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
    price: number;

  @CreateDateColumn()
    createdAt: Date;
}
