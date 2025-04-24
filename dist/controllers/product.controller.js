"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRouter = void 0;
exports.setupProductRoutes = setupProductRoutes;
// @ts-nocheck - отключаем проверку типов для всего файла из-за несовместимости типов в multer
const express_1 = require("express");
const path = __importStar(require("path"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const roles_middleware_1 = require("../middleware/roles.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const user_entity_1 = require("../entities/user.entity");
exports.productRouter = (0, express_1.Router)();
function setupProductRoutes(productService) {
    exports.productRouter.get('/', async (req, res, next) => {
        try {
            const isActive = req.query.active === 'true' ? true
                : req.query.active === 'false' ? false : undefined;
            const products = await productService.findAll({ isActive });
            res.json(products);
        }
        catch (error) {
            next(error);
        }
    });
    exports.productRouter.get('/:id', async (req, res, next) => {
        try {
            const product = await productService.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ message: 'Товар не найден' });
            }
            res.json(product);
        }
        catch (error) {
            next(error);
        }
    });
    exports.productRouter.post('/', auth_middleware_1.authMiddleware, (0, roles_middleware_1.rolesMiddleware)([user_entity_1.UserRole.ADMIN]), upload_middleware_1.uploadMiddleware.single('image'), async (req, res, next) => {
        try {
            const productData = req.body;
            // Преобразуем строковые значения 'true'/'false' в булевы значения
            if (productData.isActive !== undefined) {
                productData.isActive = productData.isActive === 'true';
            }
            if (req.file) {
                const relativePath = path.join('/public/uploads/products', path.basename(req.file.path));
                productData.imageUrl = relativePath;
            }
            const product = await productService.create(productData);
            res.status(201).json(product);
        }
        catch (error) {
            next(error);
        }
    });
    // Обработчик обновления товара
    exports.productRouter.put('/:id', auth_middleware_1.authMiddleware, (0, roles_middleware_1.rolesMiddleware)([user_entity_1.UserRole.ADMIN]), upload_middleware_1.uploadMiddleware.single('image'), async (req, res, next) => {
        try {
            const productData = req.body;
            // Преобразуем строковые значения 'true'/'false' в булевы значения
            if (productData.isActive !== undefined) {
                productData.isActive = productData.isActive === 'true';
            }
            if (req.file) {
                const relativePath = path.join('/public/uploads/products', path.basename(req.file.path));
                productData.imageUrl = relativePath;
            }
            console.log('Отправляем данные в сервис продуктов:', productData);
            const product = await productService.update(req.params.id, productData);
            console.log('Результат обновления товара:', product);
            if (!product) {
                console.log('Товар не найден');
                return res.status(404).json({ message: 'Товар не найден' });
            }
            console.log('Успешно обновлен товар:', product);
            res.json(product);
        }
        catch (error) {
            next(error);
        }
    });
    exports.productRouter.delete('/:id', auth_middleware_1.authMiddleware, (0, roles_middleware_1.rolesMiddleware)([user_entity_1.UserRole.ADMIN]), async (req, res, next) => {
        try {
            const result = await productService.delete(req.params.id);
            if (!result) {
                return res.status(404).json({ message: 'Товар не найден' });
            }
            res.json({ success: true });
        }
        catch (error) {
            next(error);
        }
    });
    return exports.productRouter;
}
