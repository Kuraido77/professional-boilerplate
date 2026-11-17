import { FindOptionsSelect } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { NotFoundError, ConflictError } from '../utils/error';
import bcrypt from 'bcrypt';
import { createLogger } from '../utils/logger';

const logger = createLogger('UserService');
const userRepository = AppDataSource.getRepository(User);

const USER_SELECT_FIELDS: FindOptionsSelect<User> = {
    id: true,
    name: true,
    email: true,
    isActive: true,
    age: true,
    createdAt: true,
    updatedAt: true,
};

interface FindAllOptions {
    page: number;
    limit: number;
    sort: string;
    order: 'ASC' | 'DESC';
}

export class UserService {
    static async findAll(options: FindAllOptions): Promise<[User[], number]> {
        const { page, limit, sort, order } = options;
        const skip = (page - 1) * limit;

        return userRepository.findAndCount({
            select: USER_SELECT_FIELDS,
            order: { [sort]: order },
            skip,
            take: limit,
        });
    }

    static async findById(id: number): Promise<User> {
        const user = await userRepository.findOne({
            where: { id },
            select: USER_SELECT_FIELDS,
        });

        if (!user) {
            throw new NotFoundError('User', id);
        }

        return user;
    }

    static async create(data: {
        name: string;
        email: string;
        password: string;
        age?: number;
    }): Promise<User> {
        const existing = await userRepository.findOne({
            where: { email: data.email },
        });

        if (existing) {
            throw new ConflictError('A user with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = userRepository.create({
            ...data,
            password: hashedPassword,
        });

        const savedUser = await userRepository.save(user);
        delete (savedUser as any).password;

        return savedUser;
    }

    static async update(id: number, data: Partial<User>): Promise<User> {
        const user = await userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundError('User', id);
        }

        if (data.email && data.email !== user.email) {
            const existing = await userRepository.findOne({
                where: { email: data.email },
            });

            if (existing) {
                throw new ConflictError('A user with this email already exists');
            }
        }

        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        Object.assign(user, data);

        const updatedUser = await userRepository.save(user);
        delete (updatedUser as any).password;

        return updatedUser;
    }

    static async delete(id: number): Promise<void> {
        const user = await userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundError('User', id);
        }

        await userRepository.remove(user);
    }
}