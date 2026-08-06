import type { FastifyReply, FastifyRequest } from "fastify";
import type { ForgotPasswordBody } from "@/controllers/users/schemas";
import { makeForgotPasswordUseCase } from "@/use-cases/factories/make-forgot-password-use-case";

export async function forgotPassword(
	request: FastifyRequest<{ Body: ForgotPasswordBody }>,
	reply: FastifyReply,
) {
	const { email } = request.body;

	const forgotPasswordUseCase = makeForgotPasswordUseCase();

	await forgotPasswordUseCase.execute({ email });

	// Resposta idêntica exista ou não o e-mail: não revelamos quais contas
	// estão cadastradas.
	return reply.status(204).send();
}
