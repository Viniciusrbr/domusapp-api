import type { MembershipsRepository } from "@/repositories/memberships-repository";
import type { TasksRepository } from "@/repositories/tasks-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface DeleteTaskUseCaseRequest {
	taskId: string;
	userId: string;
}

export class DeleteTaskUseCase {
	constructor(
		private tasksRepository: TasksRepository,
		private membershipsRepository: MembershipsRepository,
	) {}

	async execute({ taskId, userId }: DeleteTaskUseCaseRequest): Promise<void> {
		const task = await this.tasksRepository.findById(taskId);

		if (!task) {
			throw new ResourceNotFoundError();
		}

		const membership =
			await this.membershipsRepository.findByUserIdAndHouseholdId({
				userId,
				householdId: task.householdId,
			});

		if (!membership) {
			throw new ResourceNotFoundError();
		}

		// O histórico de execuções cai em cascata pelo schema (RN11).
		await this.tasksRepository.delete(taskId);
	}
}
