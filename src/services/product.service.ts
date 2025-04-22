import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

export class ProductService {
  constructor(
    private productRepository: Repository<Product>,
  ) {}

  async findAll(options?: { isActive?: boolean }): Promise<Product[]> {
    const query = this.productRepository.createQueryBuilder('product');

    if (options?.isActive !== undefined) {
      query.where('product.isActive = :isActive', { isActive: options.isActive });
    }

    return query.orderBy('product.createdAt', 'DESC').getMany();
  }

  async findById(id: string): Promise<Product | null> {
    return this.productRepository.findOne({ where: { id } });
  }

  async create(productData: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(productData);
    return this.productRepository.save(product);
  }

  async update(id: string, productData: Partial<Product>): Promise<Product | null> {
    await this.productRepository.update(id, productData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.productRepository.delete(id);
    return result.affected > 0;
  }
}
