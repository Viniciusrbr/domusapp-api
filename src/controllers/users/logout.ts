import type { FastifyReply, FastifyRequest } from "fastify";
import {
	REFRESH_TOKEN_COOKIE,
	refreshTokenCookieOptions,
} from "@/lib/auth-tokens";
import { makeLogoutUseCase } from "@/use-cases/factories/make-logout-use-case";

export async function logout(request: FastifyRequest, reply: FastifyReply) {
	const presentedToken = request.cookies[REFRESH_TOKEN_COOKIE];

	// Sem exigir JWT válido: encerrar sessão nunca deve falhar para o cliente.
	if (presentedToken) {
		const logoutUseCase = makeLogoutUseCase();

		await logoutUseCase.execute({ refreshToken: presentedToken });
	}

	return reply
		.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions())
		.status(204)
		.send();
}
