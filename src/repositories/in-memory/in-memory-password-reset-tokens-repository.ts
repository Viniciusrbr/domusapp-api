import { randomUUID } from "node:crypto";
import type { PasswordResetToken } from "@/generated/client/client";
import type {
	CreatePasswordResetTokenData,
	PasswordResetTokensRepository,
} from "@/repositories/password-reset-tokens-repository";

export class InMemoryPasswordResetTokensRepository
	implements PasswordResetTokensRepository
{
	public items: PasswordResetToken[] = [];

	async create({ userId, tokenHash, expiresAt }: CreatePasswordResetTokenData) {
		const passwordResetToken: PasswordResetToken = {
			id: randomUUID(),
			userId,
			tokenHash,
			expiresAt,
			usedAt: null,
			createdAt: new Date(),
		};

		this.items.push(passwordResetToken);

		return passwordResetToken;
	}

	async findByTokenHash(tokenHash: string) {
		const passwordResetToken = this.items.find(
			(item) => item.tokenHash === tokenHash,
		);

		return passwordResetToken ?? null;
	}

	async markAsUsed(id: string) {
		const index = this.items.findIndex((item) => item.id === id);

		if (index >= 0) {
			this.items[index] = { ...this.items[index], usedAt: new Date() };
		}
	}
}
