import dayjs from "dayjs";
import type { Mailer } from "@/lib/mailer";
import { generateToken, hashToken } from "@/lib/token";
import type { PasswordResetTokensRepository } from "@/repositories/password-reset-tokens-repository";
import type { UsersRepository } from "@/repositories/users-repository";

const RESET_TOKEN_TTL_IN_HOURS = 1;

interface ForgotPasswordUseCaseRequest {
	email: string;
}

export class ForgotPasswordUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private passwordResetTokensRepository: PasswordResetTokensRepository,
		private mailer: Mailer,
		private resetLinkBaseUrl: string,
	) {}

	async execute({ email }: ForgotPasswordUseCaseRequest): Promise<void> {
		const user = await this.usersRepository.findByEmail(email);

		// Enumeração de contas: se o e-mail não existe, encerramos em silêncio.
		// Quem chama não consegue distinguir este caso do caso de sucesso.
		if (!user) {
			return;
		}

		const token = generateToken();

		await this.passwordResetTokensRepository.create({
			userId: user.id,
			tokenHash: hashToken(token),
			expiresAt: dayjs().add(RESET_TOKEN_TTL_IN_HOURS, "hour").toDate(),
		});

		const link = `${this.resetLinkBaseUrl}?token=${token}`;

		await this.mailer.sendPasswordReset({ to: user.email, link });
	}
}
