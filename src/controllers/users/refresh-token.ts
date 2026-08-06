import type { FastifyReply, FastifyRequest } from "fastify";
import {
	makeJwtAuthTokenIssuer,
	REFRESH_TOKEN_COOKIE,
	refreshTokenCookieOptions,
} from "@/lib/auth-tokens";
import { UnauthorizedError } from "@/use-cases/errors/unauthorized-error";
import { makeRefreshTokenUseCase } from "@/use-cases/factories/make-refresh-token-use-case";

export async function refreshToken(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const presentedToken = request.cookies[REFRESH_TOKEN_COOKIE];

	if (!presentedToken) {
		return reply.status(401).send({ message: "Unauthorized." });
	}

	// Assinatura/expiração do JWT: só o cookie vale aqui, nunca o header
	// Authorization (que carrega o access token).
	try {
		await request.jwtVerify({ onlyCookie: true });
	} catch {
		return reply.status(401).send({ message: "Unauthorized." });
	}

	try {
		const refreshTokenUseCase = makeRefreshTokenUseCase(
			makeJwtAuthTokenIssuer(reply),
		);

		const { token, refreshToken: rotatedToken } =
			await refreshTokenUseCase.execute({
				refreshToken: presentedToken,
				userId: request.user.sub,
			});

		return reply
			.setCookie(
				REFRESH_TOKEN_COOKIE,
				rotatedToken,
				refreshTokenCookieOptions(),
			)
			.status(200)
			.send({ token });
	} catch (error) {
		if (error instanceof UnauthorizedError) {
			return reply
				.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions())
				.status(401)
				.send({ message: error.message });
		}

		throw error;
	}
}
