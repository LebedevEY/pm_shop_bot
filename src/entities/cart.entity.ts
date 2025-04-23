import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

type CartItem = any;

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
    id: string;

  @ManyToOne(() => User, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'userId', referencedColumnName: 'telegramId' })
    user: User;

  @Column({ nullable: false })
    userId: string;

  @Column({ default: false })
    isCompleted: boolean;

  @OneToMany('CartItem', 'cart', { cascade: true })
    items: CartItem[];

  @CreateDateColumn()
    createdAt: Date;

  @UpdateDateColumn()
    updatedAt: Date;
}
