import type { Task } from "@/generated/client/client";
import type { CategoriesRepository } from "@/repositories/categories-repository";
import type { MembershipsRepository } from "@/repositories/memberships-repository";
import type { TasksRepository } from "@/repositories/tasks-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface UpdateTaskUseCaseRequest {
	taskId: string;
	userId: string;
	name?: string;
	description?: string | null;
	/** `undefined` mantém a categoria atual; `null` remove o vínculo. */
	categoryId?: string | null;
}

interface UpdateTaskUseCaseResponse {
	task: Task;
}

export class UpdateTaskUseCase {
	constructor(
		private tasksRepository: TasksRepository,
		private membershipsRepository: MembershipsRepository,
		private categoriesRepository: CategoriesRepository,
	) {}

	async execute({
		taskId,
		userId,
		name,
		description,
		categoryId,
	}: UpdateTaskUseCaseRequest): Promise<UpdateTaskUseCaseResponse> {
		const task = await this.tasksRepository.findById(taskId);

		if (!task) {
			throw new ResourceNotFoundError();
		}

		// A autorização sai da casa DA TAREFA.
		const membership =
			await this.membershipsRepository.findByUserIdAndHouseholdId({
				userId,
				householdId: task.householdId,
			});

		// Para quem não é membro, a tarefa simplesmente não existe.
		if (!membership) {
			throw new ResourceNotFoundError();
		}

		// Só nome e descrição nesta fatia: frequência e startDate mexem na grade.
		if (name !== undefined) {
			task.name = name;
		}

		if (description !== undefined) {
			task.description = description;
		}

		// RN13: `null` desvincula; um id precisa apontar para categoria DESTA casa.
		if (categoryId !== undefined) {
			if (categoryId !== null) {
				const category = await this.categoriesRepository.findById(categoryId);

				// Categoria de outra casa é tratada como inexistente.
				if (!category || category.householdId !== task.householdId) {
					throw new ResourceNotFoundError();
				}
			}

			task.categoryId = categoryId;
		}

		const updatedTask = await this.tasksRepository.save(task);

		return { task: updatedTask };
	}
}
