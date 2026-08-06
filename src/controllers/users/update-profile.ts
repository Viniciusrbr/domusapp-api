import type { FastifyReply, FastifyRequest } from "fastify";
import type { UpdateUserProfileBody } from "@/controllers/users/schemas";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";
import { InvalidPasswordError } from "@/use-cases/errors/invalid-password-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { UserAlreadyExistsError } from "@/use-cases/errors/user-already-exists-error";
import { makeUpdateUserProfileUseCase } from "@/use-cases/factories/make-update-user-profile-use-case";

export async function updateProfile(
	request: FastifyRequest<{ Body: UpdateUserProfileBody }>,
	reply: FastifyReply,
) {
	const { name, email, password, currentPassword } = request.body;

	try {
		const updateUserProfileUseCase = makeUpdateUserProfileUseCase();

		const { user } = await updateUserProfileUseCase.execute({
			userId: request.user.sub,
			name,
			email,
			password,
			currentPassword,
		});

		return reply.status(200).send({
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				createdAt: user.createdAt.toISOString(),
				updatedAt: user.updatedAt.toISOString(),
			},
		});
	} catch (error) {
		if (error instanceof UserAlreadyExistsError) {
			return reply.status(409).send({ message: error.message });
		}

		if (error instanceof InvalidCredentialsError) {
			return reply.status(401).send({ message: error.message });
		}

		if (error instanceof InvalidPasswordError) {
			return reply.status(400).send({ message: error.message });
		}

		if (error instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: error.message });
		}

		throw error;
	}
}
