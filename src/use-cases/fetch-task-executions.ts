import type { MembershipsRepository } from "@/repositories/memberships-repository";
import type {
	TaskExecutionWithAuthor,
	TasksRepository,
} from "@/repositories/tasks-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface FetchTaskExecutionsUseCaseRequest {
	taskId: string;
	userId: string;
}

interface FetchTaskExecutionsUseCaseResponse {
	executions: TaskExecutionWithAuthor[];
}

export class FetchTaskExecutionsUseCase {
	constructor(
		private tasksRepository: TasksRepository,
		private membershipsRepository: MembershipsRepository,
	) {}

	async execute({
		taskId,
		userId,
	}: FetchTaskExecutionsUseCaseRequest): Promise<FetchTaskExecutionsUseCaseResponse> {
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

		const executions =
			await this.tasksRepository.findExecutionsByTaskId(taskId);

		return { executions };
	}
}
