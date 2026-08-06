import { hashToken } from "@/lib/token";
import type { RefreshTokensRepository } from "@/repositories/refresh-tokens-repository";

interface LogoutUseCaseRequest {
	refreshToken: string;
}

export class LogoutUseCase {
	constructor(private refreshTokensRepository: RefreshTokensRepository) {}

	// Idempotente por design: um cookie desconhecido ou já revogado não é erro,
	// o resultado desejado (sessão encerrada) já vale.
	async execute({ refreshToken }: LogoutUseCaseRequest): Promise<void> {
		const storedToken = await this.refreshTokensRepository.findByTokenHash(
			hashToken(refreshToken),
		);

		if (!storedToken || storedToken.revokedAt) {
			return;
		}

		await this.refreshTokensRepository.revoke(storedToken.id);
	}
}
