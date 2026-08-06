import type { Task } from "@/generated/client/client";
import { computeNextDueDate } from "@/lib/recurrence";
import type { MembershipsRepository } from "@/repositories/memberships-repository";
import type { TasksRepository } from "@/repositories/tasks-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface CompleteTaskUseCaseRequest {
	taskId: string;
	userId: string;
}

interface CompleteTaskUseCaseResponse {
	task: Task;
	executedAt: Date;
}

export class CompleteTaskUseCase {
	constructor(
		private tasksRepository: TasksRepository,
		private membershipsRepository: MembershipsRepository,
	) {}

	async execute({
		taskId,
		userId,
	}: CompleteTaskUseCaseRequest): Promise<CompleteTaskUseCaseResponse> {
		const task = await this.tasksRepository.findById(taskId);

		if (!task) {
			throw new ResourceNotFoundError();
		}

		// RN27/RN15: qualquer membro da casa pode concluir.
		const membership =
			await this.membershipsRepository.findByUserIdAndHouseholdId({
				userId,
				householdId: task.householdId,
			});

		if (!membership) {
			throw new ResourceNotFoundError();
		}

		// RN06/RN07: avança UM intervalo a partir da data PREVISTA, jamais da data
		// real de conclusão. Se a nova prevista continuar no passado, a tarefa
		// segue vencida — recuperar o atraso exige concluir de novo.
		const nextDueDate = computeNextDueDate({
			current: task.nextDueDate,
			frequency: task.frequency,
			unit: task.frequencyUnit,
		});

		// RN10/RN21: o instante da execução é definido pelo servidor, em UTC.
		const executedAt = new Date();

		await this.tasksRepository.markAsCompleted({
			taskId,
			userId,
			executedAt,
			nextDueDate,
		});

		return { task: { ...task, nextDueDate }, executedAt };
	}
}
