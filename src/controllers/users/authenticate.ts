import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthenticateBody } from "@/controllers/users/schemas";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";
import { makeAuthenticateUseCase } from "@/use-cases/factories/make-authenticate-use-case";

export async function authenticate(
	request: FastifyRequest<{ Body: AuthenticateBody }>,
	reply: FastifyReply,
) {
	const { email, password } = request.body;

	try {
		const authenticateUseCase = makeAuthenticateUseCase();

		const { user } = await authenticateUseCase.execute({ email, password });

		// Access token curto (expiração vem do register do @fastify/jwt em app.ts).
		const token = await reply.jwtSign({}, { sign: { sub: user.id } });

		// Refresh token longo, entregue como cookie httpOnly.
		// Obs: a rota de refresh + rotação persistida no banco (RNF08) ainda não existe.
		const refreshToken = await reply.jwtSign(
			{},
			{ sign: { sub: user.id, expiresIn: "7d" } },
		);

		return reply
			.setCookie("refreshToken", refreshToken, {
				path: "/",
				secure: true, // em prod cross-domain: manter true + sameSite 'none' (RNF11)
				sameSite: true,
				httpOnly: true,
			})
			.status(200)
			.send({ token });
	} catch (error) {
		if (error instanceof InvalidCredentialsError) {
			return reply.status(401).send({ message: error.message });
		}

		throw error;
	}
}
