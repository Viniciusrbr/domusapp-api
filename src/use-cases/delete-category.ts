import type { CategoriesRepository } from "@/repositories/categories-repository";
import type { MembershipsRepository } from "@/repositories/memberships-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface DeleteCategoryUseCaseRequest {
	categoryId: string;
	userId: string;
}

export class DeleteCategoryUseCase {
	constructor(
		private categoriesRepository: CategoriesRepository,
		private membershipsRepository: MembershipsRepository,
	) {}

	async execute({
		categoryId,
		userId,
	}: DeleteCategoryUseCaseRequest): Promise<void> {
		const category = await this.categoriesRepository.findById(categoryId);

		if (!category) {
			throw new ResourceNotFoundError();
		}

		const membership =
			await this.membershipsRepository.findByUserIdAndHouseholdId({
				userId,
				householdId: category.householdId,
			});

		if (!membership) {
			throw new ResourceNotFoundError();
		}

		// RN14: as tarefas que a usavam ficam sem categoria (`onDelete: SetNull`),
		// nenhuma tarefa é apagada.
		await this.categoriesRepository.delete(categoryId);
	}
}
