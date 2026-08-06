import type { AuthTokenIssuer } from "@/lib/auth-tokens";
import { PrismaRefreshTokensRepository } from "@/repositories/prisma/prisma-refresh-tokens-repository";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";
import { RefreshTokenUseCase } from "@/use-cases/refresh-token";

export function makeRefreshTokenUseCase(tokenIssuer: AuthTokenIssuer) {
	const usersRepository = new PrismaUsersRepository();
	const refreshTokensRepository = new PrismaRefreshTokensRepository();

	const refreshTokenUseCase = new RefreshTokenUseCase(
		usersRepository,
		refreshTokensRepository,
		tokenIssuer,
	);

	return refreshTokenUseCase;
}
