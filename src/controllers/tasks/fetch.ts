import type { FastifyReply, FastifyRequest } from "fastify";
import { toTaskResponse } from "@/controllers/tasks/presenter";
import type { HouseholdTasksParams } from "@/controllers/tasks/schemas";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { makeFetchHouseholdTasksUseCase } from "@/use-cases/factories/make-fetch-household-tasks-use-case";

export async function fetch(
	request: FastifyRequest<{ Params: HouseholdTasksParams }>,
	reply: FastifyReply,
) {
	const { householdId } = request.params;

	try {
		const fetchHouseholdTasksUseCase = makeFetchHouseholdTasksUseCase();

		const { tasks } = await fetchHouseholdTasksUseCase.execute({
			householdId,
			userId: request.user.sub,
		});

		return reply.status(200).send({ tasks: tasks.map(toTaskResponse) });
	} catch (error) {
		if (error instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: error.message });
		}

		throw error;
	}
}
