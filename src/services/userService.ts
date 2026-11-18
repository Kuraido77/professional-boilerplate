import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { ConflictError, NotFoundError } from '../utils/errors';

interface FindAllOptions {
    page: number;
    limit: number;
    sort: string;
    order: 'ASC' | 'DESC';
}

export class UserService {
    private static get repo() {
        return AppDataSource.getRepository(User);
    }

    private static sanitize(user: User): Omit<User, 'password'> {
        const { password, ...safeUser } = user as User & { password?: string };
        return safeUser as Omit<User, 'password'>;
    }

    static async findAll({ page, limit, sort, order }: FindAllOptions): Promise<[Omit<User, 'password'>[], number]> {
        const [users, total] = await this.repo.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { [sort]: order },
        });

        return [users.map((u) => this.sanitize(u)), total];
    }

    static async findById(id: number): Promise<Omit<User, 'password'>> {
        const user = await this.repo.findOneBy({ id });
        if (!user) {
            throw new NotFoundError(`User with ID ${id} not found`);
        }
        return this.sanitize(user);
    }

    static async create(data: Partial<User>): Promise<Omit<User, 'password'>> {
        if (data.email) {
            const existing = await this.repo.findOneBy({ email: data.email });
            if (existing) {
                throw new ConflictError('Email already in use');
            }
        }

        const payload = { ...data };
        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, 10);
        }

        const user = this.repo.create(payload);
        const saved = await this.repo.save(user);
        return this.sanitize(saved);
    }

    static async update(id: number, data: Partial<User>): Promise<Omit<User, 'password'>> {
        const user = await this.repo.findOneBy({ id });
        if (!user) {
            throw new NotFoundError(`User with ID ${id} not found`);
        }

        if (data.email && data.email !== user.email) {
            const existing = await this.repo.findOneBy({ email: data.email });
            if (existing) {
                throw new ConflictError('Email already in use');
            }
        }

        const payload = { ...data };
        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, 10);
        }

        Object.assign(user, payload);
        const updated = await this.repo.save(user);
        return this.sanitize(updated);
    }

    static async delete(id: number): Promise<void> {
        const user = await this.repo.findOneBy({ id });
        if (!user) {
            throw new NotFoundError(`User with ID ${id} not found`);
        }
        await this.repo.remove(user);
    }
}