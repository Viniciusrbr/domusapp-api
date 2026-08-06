import type { FastifyReply, FastifyRequest } from "fastify";
import type { TaskParams } from "@/controllers/tasks/schemas";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { makeDeleteTaskUseCase } from "@/use-cases/factories/make-delete-task-use-case";

export async function remove(
	request: FastifyRequest<{ Params: TaskParams }>,
	reply: FastifyReply,
) {
	const { taskId } = request.params;

	try {
		const deleteTaskUseCase = makeDeleteTaskUseCase();

		await deleteTaskUseCase.execute({
			taskId,
			userId: request.user.sub,
		});

		return reply.status(204).send();
	} catch (error) {
		if (error instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: error.message });
		}

		throw error;
	}
}
