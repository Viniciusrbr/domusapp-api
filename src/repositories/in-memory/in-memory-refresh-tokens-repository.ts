import { randomUUID } from "node:crypto";
import type { RefreshToken } from "@/generated/client/client";
import type {
	CreateRefreshTokenData,
	RefreshTokensRepository,
} from "@/repositories/refresh-tokens-repository";

export class InMemoryRefreshTokensRepository
	implements RefreshTokensRepository
{
	public items: RefreshToken[] = [];

	async create({ userId, tokenHash, expiresAt }: CreateRefreshTokenData) {
		const refreshToken: RefreshToken = {
			id: randomUUID(),
			userId,
			tokenHash,
			expiresAt,
			revokedAt: null,
			createdAt: new Date(),
		};

		this.items.push(refreshToken);

		return refreshToken;
	}

	async findByTokenHash(tokenHash: string) {
		const refreshToken = this.items.find(
			(item) => item.tokenHash === tokenHash,
		);

		return refreshToken ?? null;
	}

	async revoke(id: string) {
		const index = this.items.findIndex((item) => item.id === id);

		if (index >= 0) {
			this.items[index] = { ...this.items[index], revokedAt: new Date() };
		}
	}

	async revokeAllForUser(userId: string) {
		this.items = this.items.map((item) =>
			item.userId === userId && !item.revokedAt
				? { ...item, revokedAt: new Date() }
				: item,
		);
	}
}
