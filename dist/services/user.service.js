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
exports.UserService = void 0;
const bcrypt = __importStar(require("bcrypt"));
const entities_1 = require("../entities");
class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async findAll() {
        return this.userRepository.find();
    }
    async findById(id) {
        return this.userRepository.findOne({ where: { id } });
    }
    async findByUsername(username) {
        return this.userRepository.findOne({ where: { username } });
    }
    async findByEmail(email) {
        return this.userRepository.findOne({ where: { email } });
    }
    async create(userData) {
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }
        const user = this.userRepository.create(userData);
        return this.userRepository.save(user);
    }
    async update(userData) {
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }
        await this.userRepository.save(userData);
        return this.findById(userData.id);
    }
    async createAdminIfNotExists() {
        const adminExists = await this.userRepository.findOne({
            where: { role: entities_1.UserRole.ADMIN },
        });
        if (!adminExists) {
            await this.create({
                username: 'admin',
                email: process.env.ADMIN_EMAIL || 'admin@example.com',
                password: process.env.ADMIN_PASSWORD || 'admin123',
                role: entities_1.UserRole.ADMIN,
            });
        }
    }
}
exports.UserService = UserService;
