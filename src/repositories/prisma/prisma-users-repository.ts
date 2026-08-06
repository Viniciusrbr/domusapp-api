import type { Prisma, User } from "@/generated/client/client";
import { prisma } from "@/lib/prisma";
import type { UsersRepository } from "@/repositories/users-repository";

export class PrismaUsersRepository implements UsersRepository {
	async findById(id: string) {
		return prisma.user.findUnique({ where: { id } });
	}

	async findByEmail(email: string) {
		return prisma.user.findUnique({ where: { email } });
	}

	async create(data: Prisma.UserCreateInput) {
		return prisma.user.create({ data });
	}

	async save(user: User) {
		return prisma.user.update({
			where: { id: user.id },
			data: {
				name: user.name,
				email: user.email,
				passwordHash: user.passwordHash,
			},
		});
	}
}
