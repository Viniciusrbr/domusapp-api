import { prisma } from "@/lib/prisma";
import type {
	CreatePasswordResetTokenData,
	PasswordResetTokensRepository,
} from "@/repositories/password-reset-tokens-repository";

export class PrismaPasswordResetTokensRepository
	implements PasswordResetTokensRepository
{
	async create({ userId, tokenHash, expiresAt }: CreatePasswordResetTokenData) {
		return prisma.passwordResetToken.create({
			data: { userId, tokenHash, expiresAt },
		});
	}

	async findByTokenHash(tokenHash: string) {
		return prisma.passwordResetToken.findUnique({ where: { tokenHash } });
	}

	async markAsUsed(id: string) {
		await prisma.passwordResetToken.update({
			where: { id },
			data: { usedAt: new Date() },
		});
	}
}
