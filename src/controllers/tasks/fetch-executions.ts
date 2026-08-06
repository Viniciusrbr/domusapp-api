import type { FastifyReply, FastifyRequest } from "fastify";
import type { TaskParams } from "@/controllers/tasks/schemas";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { makeFetchTaskExecutionsUseCase } from "@/use-cases/factories/make-fetch-task-executions-use-case";

export async function fetchExecutions(
	request: FastifyRequest<{ Params: TaskParams }>,
	reply: FastifyReply,
) {
	const { taskId } = request.params;

	try {
		const fetchTaskExecutionsUseCase = makeFetchTaskExecutionsUseCase();

		const { executions } = await fetchTaskExecutionsUseCase.execute({
			taskId,
			userId: request.user.sub,
		});

		return reply.status(200).send({
			executions: executions.map((execution) => ({
				id: execution.id,
				executedAt: execution.executedAt.toISOString(),
				executedBy: execution.executedBy,
			})),
		});
	} catch (error) {
		if (error instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: error.message });
		}

		throw error;
	}
}
