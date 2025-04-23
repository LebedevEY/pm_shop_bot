import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

type Cart = any;

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
    id: string;

  @ManyToOne('Cart', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
    cart: Cart;

  @Column({ nullable: false })
    cartId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
    product: Product;

  @Column({ nullable: false })
    productId: string;

  @Column({ type: 'int', default: 1 })
    quantity: number;

  @Column({
    type: 'decimal', precision: 10, scale: 2, default: 0,
  })
    price: number;

  @CreateDateColumn()
    createdAt: Date;

  @UpdateDateColumn()
    updatedAt: Date;
}
