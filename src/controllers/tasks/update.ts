import type { FastifyReply, FastifyRequest } from "fastify";
import { toTaskResponse } from "@/controllers/tasks/presenter";
import type { TaskParams, UpdateTaskBody } from "@/controllers/tasks/schemas";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { makeUpdateTaskUseCase } from "@/use-cases/factories/make-update-task-use-case";

export async function update(
	request: FastifyRequest<{ Params: TaskParams; Body: UpdateTaskBody }>,
	reply: FastifyReply,
) {
	const { taskId } = request.params;
	const { name, description } = request.body;

	try {
		const updateTaskUseCase = makeUpdateTaskUseCase();

		const { task } = await updateTaskUseCase.execute({
			taskId,
			userId: request.user.sub,
			name,
			description,
		});

		return reply.status(200).send({ task: toTaskResponse(task) });
	} catch (error) {
		if (error instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: error.message });
		}

		throw error;
	}
}
