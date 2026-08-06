import { PrismaPasswordResetTokensRepository } from "@/repositories/prisma/prisma-password-reset-tokens-repository";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";
import { ResetPasswordUseCase } from "@/use-cases/reset-password";

export function makeResetPasswordUseCase() {
	const usersRepository = new PrismaUsersRepository();
	const passwordResetTokensRepository =
		new PrismaPasswordResetTokensRepository();

	const resetPasswordUseCase = new ResetPasswordUseCase(
		usersRepository,
		passwordResetTokensRepository,
	);

	return resetPasswordUseCase;
}
