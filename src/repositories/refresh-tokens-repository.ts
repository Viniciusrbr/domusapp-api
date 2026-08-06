import type { RefreshToken } from "@/generated/client/client";

export interface CreateRefreshTokenData {
	userId: string;
	tokenHash: string;
	expiresAt: Date;
}

export interface RefreshTokensRepository {
	create(data: CreateRefreshTokenData): Promise<RefreshToken>;
	findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
	revoke(id: string): Promise<void>;
	revokeAllForUser(userId: string): Promise<void>;
}
