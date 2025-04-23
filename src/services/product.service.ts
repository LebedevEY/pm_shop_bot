import { Repository } from 'typeorm';
import fs from 'fs';
import path from 'path';
import { Product } from '../entities';

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
    try {
      // Получаем информацию о товаре перед удалением
      const product = await this.findById(id);

      if (product && product.imageUrl) {
        // Получаем имя файла из URL изображения
        const fileName = path.basename(product.imageUrl);
        console.log(`Имя файла изображения товара: ${fileName}`);

        // Формируем путь к файлу в директории загрузки
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'products');
        const filePath = path.join(uploadPath, fileName);

        console.log(`Проверяем файл по пути: ${filePath}`);

        // Проверяем существование файла и удаляем его
        if (fs.existsSync(filePath)) {
          console.log(`Файл найден, удаляем: ${filePath}`);
          fs.unlinkSync(filePath);
          console.log(`Успешно удален файл изображения товара: ${filePath}`);
        } else {
          console.log(`Файл не найден по пути: ${filePath}`);

          // Пробуем альтернативный путь - полный путь из базы данных
          const fullPath = path.join(__dirname, '..', 'public', product.imageUrl);
          console.log(`Проверяем полный путь: ${fullPath}`);

          if (fs.existsSync(fullPath)) {
            console.log(`Файл найден по полному пути, удаляем: ${fullPath}`);
            fs.unlinkSync(fullPath);
            console.log(`Успешно удален файл изображения товара по полному пути: ${fullPath}`);
          } else {
            console.log(`Файл изображения товара не найден: ${fullPath}`);
          }
        }
      }

      // Удаляем товар из базы данных
      const result = await this.productRepository.delete(id);
      return result.affected !== null && result.affected !== undefined && result.affected > 0;
    } catch (error) {
      console.error(`Ошибка при удалении товара: ${error}`);
      return false;
    }
  }
}
