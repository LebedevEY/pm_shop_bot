import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
    id: string;

  @Column({ type: 'varchar', length: 8, unique: true, nullable: true })
    orderNumber: string | null;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId', referencedColumnName: 'telegramId' })
    user: User;

  @Column({ type: 'varchar' })
    userId: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
    status: OrderStatus;

  @Column('decimal', { precision: 10, scale: 2 })
    totalAmount: number;

  @Column('text')
    shippingAddress: string;

  @Column()
    contactPhone: string;

  @CreateDateColumn()
    createdAt: Date;

  @UpdateDateColumn()
    updatedAt: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
    orderItems: OrderItem[];
}
