import { randomUUID } from "node:crypto";
import type { Prisma, User } from "@/generated/client/client";
import type { UsersRepository } from "@/repositories/users-repository";

export class InMemoryUsersRepository implements UsersRepository {
	public items: User[] = [];

	async findById(id: string) {
		const user = this.items.find((item) => item.id === id);
		return user ?? null;
	}

	async findByEmail(email: string) {
		const user = this.items.find((item) => item.email === email);
		return user ?? null;
	}

	async create(data: Prisma.UserCreateInput) {
		const user: User = {
			id: data.id ?? randomUUID(),
			name: data.name,
			email: data.email,
			passwordHash: data.passwordHash,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(user);

		return user;
	}
}
