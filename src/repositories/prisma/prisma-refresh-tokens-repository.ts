import { prisma } from "@/lib/prisma";
import type {
	CreateRefreshTokenData,
	RefreshTokensRepository,
} from "@/repositories/refresh-tokens-repository";

export class PrismaRefreshTokensRepository implements RefreshTokensRepository {
	async create({ userId, tokenHash, expiresAt }: CreateRefreshTokenData) {
		return prisma.refreshToken.create({
			data: { userId, tokenHash, expiresAt },
		});
	}

	async findByTokenHash(tokenHash: string) {
		return prisma.refreshToken.findUnique({ where: { tokenHash } });
	}

	async revoke(id: string) {
		await prisma.refreshToken.update({
			where: { id },
			data: { revokedAt: new Date() },
		});
	}

	async revokeAllForUser(userId: string) {
		await prisma.refreshToken.updateMany({
			where: { userId, revokedAt: null },
			data: { revokedAt: new Date() },
		});
	}
}
