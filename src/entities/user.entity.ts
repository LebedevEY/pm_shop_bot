import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Order } from './order.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
    id: string;

  @Column({ unique: true })
    username: string;

  @Column({ unique: true })
    email: string;

  @Column()
    password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
    role: UserRole;

  @Column({ nullable: true, unique: true })
    telegramId: string;
    
  @Column({ default: false })
    isBlocked: boolean;

  @CreateDateColumn()
    createdAt: Date;

  @UpdateDateColumn()
    updatedAt: Date;

  @OneToMany(() => Order, (order) => order.user)
    orders: Order[];
}
