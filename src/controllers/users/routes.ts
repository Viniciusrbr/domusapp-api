import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { authenticate } from "@/controllers/users/authenticate";
import { profile } from "@/controllers/users/profile";
import { register } from "@/controllers/users/register";
import {
	authenticateBodySchema,
	authenticateResponseSchema,
	messageResponseSchema,
	registerBodySchema,
	userProfileResponseSchema,
} from "@/controllers/users/schemas";
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
}
