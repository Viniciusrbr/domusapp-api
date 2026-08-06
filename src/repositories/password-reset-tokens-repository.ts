import type { PasswordResetToken } from "@/generated/client/client";

export interface CreatePasswordResetTokenData {
	userId: string;
	tokenHash: string;
	expiresAt: Date;
}

export interface PasswordResetTokensRepository {
	create(data: CreatePasswordResetTokenData): Promise<PasswordResetToken>;
	findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
	markAsUsed(id: string): Promise<void>;
}
