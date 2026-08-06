import { env } from "@/env";
import { ConsoleMailer } from "@/lib/console-mailer";
import { PrismaPasswordResetTokensRepository } from "@/repositories/prisma/prisma-password-reset-tokens-repository";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository";
import { ForgotPasswordUseCase } from "@/use-cases/forgot-password";

export function makeForgotPasswordUseCase() {
	const usersRepository = new PrismaUsersRepository();
	const passwordResetTokensRepository =
		new PrismaPasswordResetTokensRepository();
	// TODO: trocar por um mailer real (Resend/SMTP) quando houver provedor.
	const mailer = new ConsoleMailer();

	const forgotPasswordUseCase = new ForgotPasswordUseCase(
		usersRepository,
		passwordResetTokensRepository,
		mailer,
		`${env.WEB_APP_URL}/reset-password`,
	);

	return forgotPasswordUseCase;
}
