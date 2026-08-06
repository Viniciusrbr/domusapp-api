import type { FastifyReply, FastifyRequest } from "fastify";
import { toTaskResponse } from "@/controllers/tasks/presenter";
import type { TaskParams } from "@/controllers/tasks/schemas";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { makeCompleteTaskUseCase } from "@/use-cases/factories/make-complete-task-use-case";

export async function complete(
	request: FastifyRequest<{ Params: TaskParams }>,
	reply: FastifyReply,
) {
	const { taskId } = request.params;

	try {
		const completeTaskUseCase = makeCompleteTaskUseCase();

		const { task, executedAt } = await completeTaskUseCase.execute({
			taskId,
			userId: request.user.sub,
		});

		return reply.status(201).send({
			task: toTaskResponse(task),
			execution: { executedAt: executedAt.toISOString() },
		});
	} catch (error) {
		if (error instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: error.message });
		}

		throw error;
	}
}
