import type { Prisma } from "@/generated/client/client";
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
}
