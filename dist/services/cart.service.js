"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class CartService {
    constructor(cartRepository, cartItemRepository, productRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }
    async getOrCreateCart(username) {
        if (!username) {
            throw new Error('Не указано имя пользователя');
        }
        // Ищем активную корзину пользователя
        let cart = await this.cartRepository.findOne({
            where: { userId: username, isCompleted: false },
            relations: ['items', 'items.product'],
        });
        // Если корзины нет, создаем новую
        if (!cart) {
            cart = this.cartRepository.create({ userId: username });
            await this.cartRepository.save(cart);
            console.log(`Создана новая корзина для пользователя: ${username}`);
        }
        return cart;
    }
    async addToCart(username, productId, quantity) {
        // Проверяем наличие обязательных параметров
        if (!username) {
            return { success: false, message: 'Не указано имя пользователя' };
        }
        if (!productId) {
            return { success: false, message: 'Не указан ID товара' };
        }
        if (!quantity || quantity <= 0) {
            return { success: false, message: 'Указано некорректное количество товара' };
        }
        console.log(`Попытка добавления товара в корзину: username=${username}, productId=${productId}, quantity=${quantity}`);
        // Проверяем наличие товара и его количество
        const product = await this.productRepository.findOne({ where: { id: productId } });
        if (!product) {
            return { success: false, message: 'Товар не найден' };
        }
        if (!product.isActive) {
            return { success: false, message: 'Товар недоступен для заказа' };
        }
        if (product.stockQuantity < quantity) {
            return {
                success: false,
                message: `Недостаточно товара. Доступно: ${product.stockQuantity} шт.`,
            };
        }
        try {
            // Получаем или создаем корзину
            const cart = await this.getOrCreateCart(username);
            console.log(`Добавление товара в корзину для пользователя: ${username}, товар ID: ${productId}, количество: ${quantity}`);
            // Проверяем, есть ли уже такой товар в корзине
            let cartItem = await this.cartItemRepository.findOne({
                where: { cartId: cart.id, productId },
            });
            if (cartItem) {
                // Обновляем количество, если товар уже в корзине
                cartItem.quantity += quantity;
                await this.cartItemRepository.save(cartItem);
            }
            else {
                // Добавляем новый товар в корзину
                cartItem = this.cartItemRepository.create({
                    cartId: cart.id,
                    productId,
                    quantity,
                    price: product.price,
                });
                await this.cartItemRepository.save(cartItem);
            }
            // Получаем обновленную корзину со всеми товарами
            const updatedCart = await this.cartRepository.findOne({
                where: { id: cart.id },
                relations: ['items', 'items.product'],
            });
            return {
                success: true,
                message: 'Товар добавлен в корзину',
                cart: updatedCart || null,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            console.error(`Ошибка при добавлении товара в корзину для пользователя ${username}: ${errorMessage}`);
            return {
                success: false,
                message: `Ошибка при добавлении товара в корзину: ${errorMessage}`,
            };
        }
    }
    async getCart(username) {
        if (!username) {
            console.error('Попытка получить корзину без указания имени пользователя');
            return null;
        }
        try {
            const cart = await this.cartRepository.findOne({
                where: { userId: username, isCompleted: false },
                relations: ['items', 'items.product'],
            });
            if (cart) {
                console.log(`Найдена корзина для пользователя: ${username}, количество товаров: ${cart.items.length}`);
            }
            else {
                console.log(`Корзина не найдена для пользователя: ${username}`);
            }
            return cart;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            console.error(`Ошибка при получении корзины для пользователя ${username}: ${errorMessage}`);
            return null;
        }
    }
    async clearCart(username) {
        if (!username) {
            console.error('Попытка очистить корзину без указания имени пользователя');
            return false;
        }
        try {
            // Получаем корзину пользователя
            const cart = await this.getCart(username);
            if (!cart) {
                console.log(`Корзина не найдена для пользователя: ${username}`);
                return false;
            }
            // Удаляем все элементы корзины
            if (cart.items && cart.items.length > 0) {
                await this.cartItemRepository.delete({ cartId: cart.id });
                console.log(`Удалено ${cart.items.length} товаров из корзины пользователя ${username}`);
            }
            // Отмечаем корзину как завершенную
            cart.isCompleted = true;
            await this.cartRepository.save(cart);
            console.log(`Корзина пользователя ${username} успешно очищена и помечена как завершенная`);
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            console.error(`Ошибка при очистке корзины для пользователя ${username}: ${errorMessage}`);
            return false;
        }
    }
    async removeFromCart(username, cartItemId) {
        if (!username) {
            return { success: false, message: 'Не указано имя пользователя' };
        }
        if (!cartItemId) {
            return { success: false, message: 'Не указан ID товара в корзине' };
        }
        console.log(`Попытка удаления товара из корзины: username=${username}, cartItemId=${cartItemId}`);
        try {
            const cart = await this.getCart(username);
            if (!cart) {
                return { success: false, message: 'Корзина не найдена' };
            }
            // Проверяем, принадлежит ли элемент корзины данному пользователю
            const cartItem = await this.cartItemRepository.findOne({
                where: { id: cartItemId, cartId: cart.id },
                relations: ['product'], // Добавляем связь с продуктом, чтобы получить информацию о фото
            });
            if (!cartItem) {
                return { success: false, message: 'Товар не найден в корзине' };
            }
            // Удаляем фото товара с сервера, если оно есть
            if (cartItem.product && cartItem.product.imageUrl) {
                try {
                    // Получаем имя файла из URL изображения
                    const fileName = path_1.default.basename(cartItem.product.imageUrl);
                    console.log(`Имя файла изображения: ${fileName}`);
                    // Формируем путь к файлу в директории загрузки
                    const uploadPath = path_1.default.join(__dirname, '..', 'public', 'uploads', 'products');
                    const filePath = path_1.default.join(uploadPath, fileName);
                    console.log(`Проверяем файл по пути: ${filePath}`);
                    // Проверяем существование файла и удаляем его
                    if (fs_1.default.existsSync(filePath)) {
                        console.log(`Файл найден, удаляем: ${filePath}`);
                        fs_1.default.unlinkSync(filePath);
                        console.log(`Успешно удален файл: ${filePath}`);
                    }
                    else {
                        console.log(`Файл не найден по пути: ${filePath}`);
                        // Пробуем альтернативный путь - полный путь из базы данных
                        const fullPath = path_1.default.join(__dirname, '..', 'public', cartItem.product.imageUrl);
                        console.log(`Проверяем полный путь: ${fullPath}`);
                        if (fs_1.default.existsSync(fullPath)) {
                            console.log(`Файл найден по полному пути, удаляем: ${fullPath}`);
                            fs_1.default.unlinkSync(fullPath);
                            console.log(`Успешно удален файл по полному пути: ${fullPath}`);
                        }
                        else {
                            // Еще одна попытка - ищем файл по имени в директории загрузки
                            console.log(`Файл не найден по полному пути: ${fullPath}`);
                            // Получаем список всех файлов в директории загрузки
                            try {
                                const files = fs_1.default.readdirSync(uploadPath);
                                console.log(`Список файлов в директории загрузки: ${files.join(', ')}`);
                            }
                            catch (readError) {
                                console.error(`Ошибка при чтении директории: ${readError}`);
                            }
                        }
                    }
                }
                catch (fileError) {
                    // Если произошла ошибка при удалении файла, логируем её, но продолжаем удаление товара из корзины
                    console.error(`Ошибка при удалении файла: ${fileError}`);
                }
            }
            // Удаляем элемент из корзины
            await this.cartItemRepository.remove(cartItem);
            console.log(`Товар удален из корзины: username=${username}, cartItemId=${cartItemId}`);
            // Получаем обновленную корзину
            const updatedCart = await this.getCart(username);
            return {
                success: true,
                message: 'Товар удален из корзины',
                cart: updatedCart || null,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            console.error(`Ошибка при удалении товара из корзины для пользователя ${username}: ${errorMessage}`);
            return {
                success: false,
                message: `Ошибка при удалении товара из корзины: ${errorMessage}`,
            };
        }
    }
}
exports.CartService = CartService;
