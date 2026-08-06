import type { FastifyReply, FastifyRequest } from "fastify";
import type { ResetPasswordBody } from "@/controllers/users/schemas";
import { InvalidPasswordError } from "@/use-cases/errors/invalid-password-error";
import { InvalidResetTokenError } from "@/use-cases/errors/invalid-reset-token-error";
import { makeResetPasswordUseCase } from "@/use-cases/factories/make-reset-password-use-case";

export async function resetPassword(
	request: FastifyRequest<{ Body: ResetPasswordBody }>,
	reply: FastifyReply,
) {
	const { token, password } = request.body;

	try {
		const resetPasswordUseCase = makeResetPasswordUseCase();

		await resetPasswordUseCase.execute({ token, password });
	} catch (error) {
		if (
			error instanceof InvalidResetTokenError ||
			error instanceof InvalidPasswordError
		) {
			return reply.status(400).send({ message: error.message });
		}

		throw error;
	}

	return reply.status(204).send();
}
