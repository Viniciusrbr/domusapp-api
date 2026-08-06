import { PrismaPasswordResetTokensRepository } from "@/repositories/prisma/prisma-password-reset-tokens-repository";
import { PrismaRefreshTokensRepository } from "@/repositories/prisma/prisma-refresh-tokens-repository";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";
import { ResetPasswordUseCase } from "@/use-cases/reset-password";

export function makeResetPasswordUseCase() {
	const usersRepository = new PrismaUsersRepository();
	const passwordResetTokensRepository =
		new PrismaPasswordResetTokensRepository();
	const refreshTokensRepository = new PrismaRefreshTokensRepository();

	const resetPasswordUseCase = new ResetPasswordUseCase(
		usersRepository,
		passwordResetTokensRepository,
		refreshTokensRepository,
	);

	return resetPasswordUseCase;
}
