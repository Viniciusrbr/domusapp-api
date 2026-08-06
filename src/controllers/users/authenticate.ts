import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthenticateBody } from "@/controllers/users/schemas";
import {
	makeJwtAuthTokenIssuer,
	REFRESH_TOKEN_COOKIE,
	refreshTokenCookieOptions,
} from "@/lib/auth-tokens";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";
import { makeAuthenticateUseCase } from "@/use-cases/factories/make-authenticate-use-case";

export async function authenticate(
	request: FastifyRequest<{ Body: AuthenticateBody }>,
	reply: FastifyReply,
) {
	const { email, password } = request.body;

	try {
		const authenticateUseCase = makeAuthenticateUseCase(
			makeJwtAuthTokenIssuer(reply),
		);

		const { token, refreshToken } = await authenticateUseCase.execute({
			email,
			password,
		});

		return reply
			.setCookie(
				REFRESH_TOKEN_COOKIE,
				refreshToken,
				refreshTokenCookieOptions(),
			)
			.status(200)
			.send({ token });
	} catch (error) {
		if (error instanceof InvalidCredentialsError) {
			return reply.status(401).send({ message: error.message });
		}

		throw error;
	}
}
