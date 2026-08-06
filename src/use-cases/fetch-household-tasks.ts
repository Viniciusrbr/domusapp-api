import type { Task } from "@/generated/client/client";
import type { MembershipsRepository } from "@/repositories/memberships-repository";
import type { TasksRepository } from "@/repositories/tasks-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface FetchHouseholdTasksUseCaseRequest {
	householdId: string;
	userId: string;
}

interface FetchHouseholdTasksUseCaseResponse {
	tasks: Task[];
}

export class FetchHouseholdTasksUseCase {
	constructor(
		private tasksRepository: TasksRepository,
		private membershipsRepository: MembershipsRepository,
	) {}

	async execute({
		householdId,
		userId,
	}: FetchHouseholdTasksUseCaseRequest): Promise<FetchHouseholdTasksUseCaseResponse> {
		const membership =
			await this.membershipsRepository.findByUserIdAndHouseholdId({
				userId,
				householdId,
			});

		if (!membership) {
			throw new ResourceNotFoundError();
		}

		// Devolve a grade crua (startDate/nextDueDate/frequência). O status
		// (vencida, vence hoje, ...) é derivado no cliente, no fuso local (RN08/RN23).
		const tasks = await this.tasksRepository.findManyByHouseholdId(householdId);

		return { tasks };
	}
}
