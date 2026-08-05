import type { FastifyReply, FastifyRequest } from "fastify";
import type { RegisterBody } from "@/controllers/users/schemas";
import { UserAlreadyExistsError } from "@/use-cases/errors/user-already-exists-error";
import { makeRegisterUseCase } from "@/use-cases/factories/make-register-use-case";

export async function register(
	request: FastifyRequest<{ Body: RegisterBody }>,
	reply: FastifyReply,
) {
	const { name, email, password } = request.body;

	try {
		const registerUseCase = makeRegisterUseCase();

		await registerUseCase.execute({ name, email, password });
	} catch (error) {
		if (error instanceof UserAlreadyExistsError) {
			return reply.status(409).send({ message: error.message });
		}

		throw error;
	}

	return reply.status(201).send();
}
