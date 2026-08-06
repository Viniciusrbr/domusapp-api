import { hash } from "bcryptjs";
import { isStrongPassword } from "@/lib/password-policy";
import { hashToken } from "@/lib/token";
import type { PasswordResetTokensRepository } from "@/repositories/password-reset-tokens-repository";
import type { RefreshTokensRepository } from "@/repositories/refresh-tokens-repository";
import type { UsersRepository } from "@/repositories/users-repository";
import { InvalidPasswordError } from "@/use-cases/errors/invalid-password-error";
import { InvalidResetTokenError } from "@/use-cases/errors/invalid-reset-token-error";

interface ResetPasswordUseCaseRequest {
	token: string;
	password: string;
}

export class ResetPasswordUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private passwordResetTokensRepository: PasswordResetTokensRepository,
		private refreshTokensRepository: RefreshTokensRepository,
	) {}

	async execute({
		token,
		password,
	}: ResetPasswordUseCaseRequest): Promise<void> {
		const passwordResetToken =
			await this.passwordResetTokensRepository.findByTokenHash(
				hashToken(token),
			);

		if (!passwordResetToken) {
			throw new InvalidResetTokenError();
		}

		if (passwordResetToken.usedAt) {
			throw new InvalidResetTokenError();
		}

		if (passwordResetToken.expiresAt.getTime() <= Date.now()) {
			throw new InvalidResetTokenError();
		}

		const user = await this.usersRepository.findById(passwordResetToken.userId);

		// O usuário foi removido depois da emissão: o token não vale mais nada.
		if (!user) {
			throw new InvalidResetTokenError();
		}

		// RN24
		if (!isStrongPassword(password)) {
			throw new InvalidPasswordError();
		}

		user.passwordHash = await hash(password, 6);

		await this.usersRepository.save(user);
		await this.passwordResetTokensRepository.markAsUsed(passwordResetToken.id);

		// Trocar a senha derruba as sessões abertas em outros dispositivos (RNF08).
		await this.refreshTokensRepository.revokeAllForUser(user.id);
	}
}
