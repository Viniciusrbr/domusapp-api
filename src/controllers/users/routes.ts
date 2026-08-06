import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { authenticate } from "@/controllers/users/authenticate";
import { forgotPassword } from "@/controllers/users/forgot-password";
import { logout } from "@/controllers/users/logout";
import { profile } from "@/controllers/users/profile";
import { refreshToken } from "@/controllers/users/refresh-token";
import { register } from "@/controllers/users/register";
import { resetPassword } from "@/controllers/users/reset-password";
import {
	authenticateBodySchema,
	authenticateResponseSchema,
	forgotPasswordBodySchema,
	messageResponseSchema,
	refreshTokenResponseSchema,
	registerBodySchema,
	resetPasswordBodySchema,
	updateUserProfileBodySchema,
	updateUserProfileResponseSchema,
	userProfileResponseSchema,
} from "@/controllers/users/schemas";
import { updateProfile } from "@/controllers/users/update-profile";
import { verifyJwt } from "@/middlewares/verify-jwt";

export async function usersRoutes(app: FastifyInstance) {
	const server = app.withTypeProvider<ZodTypeProvider>();

	server.post(
		"/users",
		{
			schema: {
				tags: ["Users"],
				summary: "Cria uma nova conta de usuário",
				operationId: "registerUser",
				body: registerBodySchema,
				response: {
					201: z.null().describe("Conta criada"),
					409: messageResponseSchema.describe("E-mail já cadastrado"),
				},
			},
		},
		register,
	);

	server.post(
		"/sessions",
		{
			schema: {
				tags: ["Users"],
				summary: "Autentica um usuário (login)",
				operationId: "authenticateUser",
				body: authenticateBodySchema,
				response: {
					200: authenticateResponseSchema.describe("Autenticado"),
					401: messageResponseSchema.describe("Credenciais inválidas"),
				},
			},
		},
		authenticate,
	);

	server.post(
		"/token/refresh",
		{
			schema: {
				tags: ["Users"],
				summary: "Rotaciona o refresh token e emite um novo access token",
				description:
					"Lê o refresh token do cookie httpOnly, revoga o atual e emite um novo par (RNF08).",
				operationId: "refreshToken",
				response: {
					200: refreshTokenResponseSchema.describe(
						"Novo par de tokens emitido",
					),
					401: messageResponseSchema.describe(
						"Refresh token ausente, inválido, revogado ou expirado",
					),
				},
			},
		},
		refreshToken,
	);

	server.post(
		"/sessions/logout",
		{
			schema: {
				tags: ["Users"],
				summary: "Encerra a sessão atual",
				description:
					"Revoga o refresh token atual e limpa o cookie. Responde 204 mesmo sem sessão ativa.",
				operationId: "logout",
				response: {
					204: z.null().describe("Sessão encerrada"),
				},
			},
		},
		logout,
	);

	server.get(
		"/me",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Users"],
				summary: "Retorna os dados do usuário autenticado",
				operationId: "getUserProfile",
				response: {
					200: userProfileResponseSchema.describe("Perfil do usuário"),
					401: messageResponseSchema.describe("Não autenticado"),
					404: messageResponseSchema.describe("Usuário não encontrado"),
				},
			},
		},
		profile,
	);

	server.patch(
		"/me",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Users"],
				summary: "Atualiza os dados do usuário autenticado",
				operationId: "updateUserProfile",
				body: updateUserProfileBodySchema,
				response: {
					200: updateUserProfileResponseSchema.describe("Perfil atualizado"),
					400: messageResponseSchema.describe("Nova senha inválida"),
					401: messageResponseSchema.describe(
						"Não autenticado ou senha atual incorreta",
					),
					404: messageResponseSchema.describe("Usuário não encontrado"),
					409: messageResponseSchema.describe("E-mail já cadastrado"),
				},
			},
		},
		updateProfile,
	);

	server.post(
		"/password/forgot",
		{
			schema: {
				tags: ["Users"],
				summary: "Solicita um e-mail de recuperação de senha",
				description:
					"Responde 204 exista ou não uma conta com o e-mail informado.",
				operationId: "forgotPassword",
				body: forgotPasswordBodySchema,
				response: {
					204: z.null().describe("Solicitação recebida"),
				},
			},
		},
		forgotPassword,
	);

	server.post(
		"/password/reset",
		{
			schema: {
				tags: ["Users"],
				summary: "Define uma nova senha a partir de um token de recuperação",
				operationId: "resetPassword",
				body: resetPasswordBodySchema,
				response: {
					204: z.null().describe("Senha redefinida"),
					400: messageResponseSchema.describe(
						"Token inválido, expirado ou já utilizado",
					),
				},
			},
		},
		resetPassword,
	);
}
