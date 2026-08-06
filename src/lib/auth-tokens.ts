import type { CookieSerializeOptions } from "@fastify/cookie";
import dayjs from "dayjs";
import type { FastifyReply } from "fastify";
import { env } from "@/env";

// Refresh token longo (RNF08). O access token é curto e sua expiração vem do
// register do @fastify/jwt em app.ts.
export const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;

export const REFRESH_TOKEN_COOKIE = "refreshToken";

export interface AuthTokens {
	token: string;
	refreshToken: string;
}

// Assinatura dos tokens é infraestrutura (JWT/HTTP): o use case só recebe este
// contrato por injeção de dependência, o que também o torna testável sem Fastify.
export interface AuthTokenIssuer {
	issue(userId: string): Promise<AuthTokens>;
}

export const makeJwtAuthTokenIssuer = (
	reply: FastifyReply,
): AuthTokenIssuer => ({
	async issue(userId: string) {
		const token = await reply.jwtSign({}, { sign: { sub: userId } });

		const refreshToken = await reply.jwtSign(
			{},
			{
				sign: {
					sub: userId,
					expiresIn: `${REFRESH_TOKEN_EXPIRES_IN_DAYS}d`,
				},
			},
		);

		return { token, refreshToken };
	},
});

export const refreshTokenExpiresAt = () =>
	dayjs().add(REFRESH_TOKEN_EXPIRES_IN_DAYS, "day").toDate();

// Em produção o cliente vive em outro domínio: 'none' + secure é a única
// combinação que o navegador envia cross-site, alinhada ao CORS credentials (RNF11).
// Em dev/test o app roda em http, onde um cookie `secure` seria descartado.
export const refreshTokenCookieOptions = (): CookieSerializeOptions =>
	env.NODE_ENV === "production"
		? { path: "/", httpOnly: true, secure: true, sameSite: "none" }
		: { path: "/", httpOnly: true, secure: false, sameSite: "lax" };
