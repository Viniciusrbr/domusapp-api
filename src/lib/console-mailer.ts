import type { Mailer, SendPasswordResetParams } from "@/lib/mailer";

// Implementação de desenvolvimento: apenas loga o link no console, permitindo
// testar o fluxo de recuperação de senha sem provedor real.
//
// TODO: criar uma implementação de produção (ex: `ResendMailer` / `SmtpMailer`)
// aqui em `src/lib/` e escolhê-la na factory conforme `env.NODE_ENV`.
export class ConsoleMailer implements Mailer {
	async sendPasswordReset({ to, link }: SendPasswordResetParams) {
		console.info(`[mailer] Password reset for ${to}: ${link}`);
	}
}
