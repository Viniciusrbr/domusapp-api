import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { complete } from "@/controllers/tasks/complete";
import { create } from "@/controllers/tasks/create";
import { remove } from "@/controllers/tasks/delete";
import { fetch } from "@/controllers/tasks/fetch";
import { fetchExecutions } from "@/controllers/tasks/fetch-executions";
import {
	completeTaskResponseSchema,
	createTaskBodySchema,
	createTaskResponseSchema,
	fetchHouseholdTasksResponseSchema,
	fetchTaskExecutionsResponseSchema,
	householdTasksParamsSchema,
	taskParamsSchema,
	updateTaskBodySchema,
	updateTaskResponseSchema,
} from "@/controllers/tasks/schemas";
import { update } from "@/controllers/tasks/update";
import { messageResponseSchema } from "@/controllers/users/schemas";
import { verifyJwt } from "@/middlewares/verify-jwt";

export async function tasksRoutes(app: FastifyInstance) {
	const server = app.withTypeProvider<ZodTypeProvider>();

	server.post(
		"/households/:householdId/tasks",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Tasks"],
				summary: "Cria uma tarefa recorrente em uma casa do usuário logado",
				operationId: "createTask",
				params: householdTasksParamsSchema,
				body: createTaskBodySchema,
				response: {
					201: createTaskResponseSchema.describe("Tarefa criada"),
					400: messageResponseSchema.describe("Dados inválidos"),
					401: messageResponseSchema.describe("Não autenticado"),
					404: messageResponseSchema.describe("Casa não encontrada"),
				},
			},
		},
		create,
	);

	server.get(
		"/households/:householdId/tasks",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Tasks"],
				summary:
					"Lista as tarefas de uma casa; o status é derivado no cliente, no fuso local",
				operationId: "fetchHouseholdTasks",
				params: householdTasksParamsSchema,
				response: {
					200: fetchHouseholdTasksResponseSchema.describe("Tarefas da casa"),
					401: messageResponseSchema.describe("Não autenticado"),
					404: messageResponseSchema.describe("Casa não encontrada"),
				},
			},
		},
		fetch,
	);

	server.patch(
		"/tasks/:taskId",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Tasks"],
				summary: "Edita o nome e/ou a descrição de uma tarefa",
				operationId: "updateTask",
				params: taskParamsSchema,
				body: updateTaskBodySchema,
				response: {
					200: updateTaskResponseSchema.describe("Tarefa atualizada"),
					401: messageResponseSchema.describe("Não autenticado"),
					404: messageResponseSchema.describe("Tarefa não encontrada"),
				},
			},
		},
		update,
	);

	server.delete(
		"/tasks/:taskId",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Tasks"],
				summary: "Exclui uma tarefa e, em cascata, o seu histórico",
				operationId: "deleteTask",
				params: taskParamsSchema,
				response: {
					204: z.null().describe("Tarefa excluída"),
					401: messageResponseSchema.describe("Não autenticado"),
					404: messageResponseSchema.describe("Tarefa não encontrada"),
				},
			},
		},
		remove,
	);

	server.post(
		"/tasks/:taskId/completions",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Tasks"],
				summary:
					"Registra a conclusão da tarefa e avança um intervalo da grade de recorrência",
				operationId: "completeTask",
				params: taskParamsSchema,
				response: {
					201: completeTaskResponseSchema.describe("Conclusão registrada"),
					401: messageResponseSchema.describe("Não autenticado"),
					404: messageResponseSchema.describe("Tarefa não encontrada"),
				},
			},
		},
		complete,
	);

	server.get(
		"/tasks/:taskId/completions",
		{
			onRequest: [verifyJwt],
			schema: {
				tags: ["Tasks"],
				summary: "Lista o histórico de conclusões da tarefa (quem e quando)",
				operationId: "fetchTaskExecutions",
				params: taskParamsSchema,
				response: {
					200: fetchTaskExecutionsResponseSchema.describe(
						"Histórico da tarefa",
					),
					401: messageResponseSchema.describe("Não autenticado"),
					404: messageResponseSchema.describe("Tarefa não encontrada"),
				},
			},
		},
		fetchExecutions,
	);
}
