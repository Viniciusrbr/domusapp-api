import { PrismaRefreshTokensRepository } from "@/repositories/prisma/prisma-refresh-tokens-repository";
import { LogoutUseCase } from "@/use-cases/logout";

export function makeLogoutUseCase() {
	const refreshTokensRepository = new PrismaRefreshTokensRepository();
	const logoutUseCase = new LogoutUseCase(refreshTokensRepository);

	return logoutUseCase;
}
