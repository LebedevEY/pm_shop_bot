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
    console.log('Обновление товара в сервисе:', id);
    console.log('Данные для обновления:', productData);
    
    // Проверяем, есть ли в данных поле isActive
    if ('isActive' in productData) {
      console.log('Обнаружено поле isActive:', productData.isActive, typeof productData.isActive);
      
      // Убедимся, что isActive имеет тип boolean
      if (typeof productData.isActive === 'string') {
        productData.isActive = productData.isActive === 'true';
        console.log('Преобразовано в boolean:', productData.isActive);
      }
    }
    
    const result = await this.productRepository.update(id, productData);
    console.log('Результат обновления:', result);
    
    const updatedProduct = await this.findById(id);
    console.log('Обновленный товар:', updatedProduct);
    
    return updatedProduct;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.productRepository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
}
