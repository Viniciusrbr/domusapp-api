import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { create } from "@/controllers/categories/create";
import { remove } from "@/controllers/categories/delete";
import { fetch } from "@/controllers/categories/fetch";
import {
	categoryParamsSchema,
	createCategoryBodySchema,
	createCategoryResponseSchema,
	fetchHouseholdCategoriesResponseSchema,
	householdCategoriesParamsSchema,
	updateCategoryBodySchema,
	updateCategoryResponseSchema,
} from "@/controllers/categories/schemas";
import { update } from "@/controllers/categories/update";
import { messageResponseSchema } from "@/controllers/users/schemas";
import { verifyJwt } from "@/middlewares/verify-jwt";

export async function categoriesRoutes(app: FastifyInstance) {
	const server = app.withTypeProvider<ZodTypeProvider>();

	server.post(
		"/households/:householdId/categories",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Categories"],
				summary: "Cria uma categoria em uma casa do usuário logado",
				operationId: "createCategory",
				params: householdCategoriesParamsSchema,
				body: createCategoryBodySchema,
				response: {
					201: createCategoryResponseSchema.describe("Categoria criada"),
					400: messageResponseSchema.describe("Dados inválidos"),
					401: messageResponseSchema.describe("Não autenticado"),
					404: messageResponseSchema.describe("Casa não encontrada"),
					409: messageResponseSchema.describe(
						"Já existe uma categoria com esse nome na casa",
					),
				},
			},
		},
		create,
	);

	server.get(
		"/households/:householdId/categories",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Categories"],
				summary: "Lista as categorias de uma casa",
				operationId: "fetchHouseholdCategories",
				params: householdCategoriesParamsSchema,
				response: {
					200: fetchHouseholdCategoriesResponseSchema.describe(
						"Categorias da casa",
					),
					401: messageResponseSchema.describe("Não autenticado"),
					404: messageResponseSchema.describe("Casa não encontrada"),
				},
			},
		},
		fetch,
	);

	server.patch(
		"/categories/:categoryId",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Categories"],
				summary: "Renomeia uma categoria",
				operationId: "updateCategory",
				params: categoryParamsSchema,
				body: updateCategoryBodySchema,
				response: {
					200: updateCategoryResponseSchema.describe("Categoria atualizada"),
					400: messageResponseSchema.describe("Dados inválidos"),
					401: messageResponseSchema.describe("Não autenticado"),
					404: messageResponseSchema.describe("Categoria não encontrada"),
					409: messageResponseSchema.describe(
						"Já existe uma categoria com esse nome na casa",
					),
				},
			},
		},
		update,
	);

	server.delete(
		"/categories/:categoryId",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Categories"],
				summary:
					"Exclui uma categoria; as tarefas que a usavam ficam sem categoria",
				operationId: "deleteCategory",
				params: categoryParamsSchema,
				response: {
					204: z.null().describe("Categoria excluída"),
					401: messageResponseSchema.describe("Não autenticado"),
					404: messageResponseSchema.describe("Categoria não encontrada"),
				},
			},
		},
		remove,
	);
}
