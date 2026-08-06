import type { FastifyReply, FastifyRequest } from "fastify";
import { toTaskResponse } from "@/controllers/tasks/presenter";
import type {
	CreateTaskBody,
	HouseholdTasksParams,
} from "@/controllers/tasks/schemas";
import { parseDateOnly } from "@/lib/recurrence";
import { InvalidFrequencyError } from "@/use-cases/errors/invalid-frequency-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { makeCreateTaskUseCase } from "@/use-cases/factories/make-create-task-use-case";

export async function create(
	request: FastifyRequest<{
		Params: HouseholdTasksParams;
		Body: CreateTaskBody;
	}>,
	reply: FastifyReply,
) {
	const { householdId } = request.params;
	const { name, description, frequency, frequencyUnit, startDate, categoryId } =
		request.body;

	try {
		const createTaskUseCase = makeCreateTaskUseCase();

		const { task } = await createTaskUseCase.execute({
			householdId,
			userId: request.user.sub,
			name,
			description,
			frequency,
			frequencyUnit,
			startDate: parseDateOnly(startDate),
			categoryId,
		});

		return reply.status(201).send({ task: toTaskResponse(task) });
	} catch (error) {
		if (error instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: error.message });
		}

		if (error instanceof InvalidFrequencyError) {
			return reply.status(400).send({ message: error.message });
		}

		throw error;
	}
}
