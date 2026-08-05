import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { authenticate } from "@/controllers/users/authenticate";
import { register } from "@/controllers/users/register";
import {
	authenticateBodySchema,
	authenticateResponseSchema,
	messageResponseSchema,
	registerBodySchema,
} from "@/controllers/users/schemas";

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
}