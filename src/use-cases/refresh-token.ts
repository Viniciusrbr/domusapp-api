import {
	type AuthTokenIssuer,
	type AuthTokens,
	refreshTokenExpiresAt,
} from "@/lib/auth-tokens";
import { hashToken } from "@/lib/token";
import type { RefreshTokensRepository } from "@/repositories/refresh-tokens-repository";
import type { UsersRepository } from "@/repositories/users-repository";
import { UnauthorizedError } from "@/use-cases/errors/unauthorized-error";

interface RefreshTokenUseCaseRequest {
	// Token em texto puro vindo do cookie, com a assinatura JWT já verificada
	// pelo controller; aqui vale o registro persistido (RNF08).
	refreshToken: string;
	userId: string;
}

export class RefreshTokenUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private refreshTokensRepository: RefreshTokensRepository,
		private tokenIssuer: AuthTokenIssuer,
	) {}

	async execute({
		refreshToken,
		userId,
	}: RefreshTokenUseCaseRequest): Promise<AuthTokens> {
		const storedToken = await this.refreshTokensRepository.findByTokenHash(
			hashToken(refreshToken),
		);

		if (!storedToken) {
			throw new UnauthorizedError();
		}

		// O `sub` assinado não bate com o dono do registro: token adulterado ou
		// reaproveitado por outra sessão.
		if (storedToken.userId !== userId) {
			throw new UnauthorizedError();
		}

		// Reuso de um token já rotacionado indica vazamento: derruba a família
		// inteira de sessões do usuário.
		if (storedToken.revokedAt) {
			await this.refreshTokensRepository.revokeAllForUser(storedToken.userId);

			throw new UnauthorizedError();
		}

		if (storedToken.expiresAt.getTime() <= Date.now()) {
			throw new UnauthorizedError();
		}

		const user = await this.usersRepository.findById(storedToken.userId);

		// O usuário foi removido depois da emissão: o token não vale mais nada.
		if (!user) {
			throw new UnauthorizedError();
		}

		// Rotação: o token apresentado morre aqui, antes de emitir o próximo.
		await this.refreshTokensRepository.revoke(storedToken.id);

		const tokens = await this.tokenIssuer.issue(user.id);

		await this.refreshTokensRepository.create({
			userId: user.id,
			tokenHash: hashToken(tokens.refreshToken),
			expiresAt: refreshTokenExpiresAt(),
		});

		return tokens;
	}
}
