import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';

// Используем тип вместо прямого импорта для избежания циклической зависимости
// Этот тип будет использоваться только для типизации, а не для импорта реального класса
type CartItem = any;

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId', referencedColumnName: 'telegramId' })
  user: User;

  @Column({ nullable: false })
  userId: string;

  @Column({ default: false })
  isCompleted: boolean;

  // Используем строковый идентификатор вместо прямого импорта для избежания циклической зависимости
  @OneToMany('CartItem', 'cart', { cascade: true })
  items: CartItem[]; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
