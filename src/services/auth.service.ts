import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { User } from '../entities/user.entity';
import { config } from '../config';

export class AuthService {
  constructor(
    private userRepository: Repository<User>,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { username } });

    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }

    return null;
  }

  async login(user: User): Promise<{ accessToken: string; user: Partial<User> }> {
    const payload = { username: user.username, sub: user.id, role: user.role };

    const { password, ...result } = user;

    return {
      accessToken: jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn }),
      user: result,
    };
  }

  async register(userData: Partial<User>): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: userData.username },
        { email: userData.email },
      ],
    });

    if (existingUser) {
      throw new Error('Пользователь с таким именем или email уже существует');
    }

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      return null;
    }
  }
}
