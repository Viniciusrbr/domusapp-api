import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { create } from "@/controllers/households/create";
import { remove } from "@/controllers/households/delete";
import { fetch } from "@/controllers/households/fetch";
import {
	createHouseholdBodySchema,
	createHouseholdResponseSchema,
	fetchUserHouseholdsResponseSchema,
	householdParamsSchema,
	updateHouseholdBodySchema,
	updateHouseholdResponseSchema,
} from "@/controllers/households/schemas";
import { update } from "@/controllers/households/update";
import { messageResponseSchema } from "@/controllers/users/schemas";
import { verifyJwt } from "@/middlewares/verify-jwt";

export async function householdsRoutes(app: FastifyInstance) {
	const server = app.withTypeProvider<ZodTypeProvider>();

	server.post(
		"/households",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Households"],
				summary: "Cria uma casa e torna o usuário logado owner",
				operationId: "createHousehold",
				body: createHouseholdBodySchema,
				response: {
					201: createHouseholdResponseSchema.describe("Casa criada"),
					401: messageResponseSchema.describe("Não autenticado"),
				},
			},
		},
		create,
	);

	server.get(
		"/households",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Households"],
				summary:
					"Lista as casas do usuário logado, com o papel dele em cada uma",
				operationId: "fetchUserHouseholds",
				response: {
					200: fetchUserHouseholdsResponseSchema.describe("Casas do usuário"),
					401: messageResponseSchema.describe("Não autenticado"),
				},
			},
		},
		fetch,
	);

	server.patch(
		"/households/:householdId",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Households"],
				summary: "Renomeia uma casa da qual o usuário logado é membro",
				operationId: "updateHousehold",
				params: householdParamsSchema,
				body: updateHouseholdBodySchema,
				response: {
					200: updateHouseholdResponseSchema.describe("Casa atualizada"),
					401: messageResponseSchema.describe("Não autenticado"),
					404: messageResponseSchema.describe("Casa não encontrada"),
				},
			},
		},
		update,
	);

	server.delete(
		"/households/:householdId",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Households"],
				summary: "Exclui uma casa (somente o owner)",
				operationId: "deleteHousehold",
				params: householdParamsSchema,
				response: {
					204: z.null().describe("Casa excluída"),
					401: messageResponseSchema.describe("Não autenticado"),
					403: messageResponseSchema.describe("Somente o owner pode excluir"),
					404: messageResponseSchema.describe("Casa não encontrada"),
				},
			},
		},
		remove,
	);
}
