import type { Category } from "@/generated/client/client";
import type { CategoriesRepository } from "@/repositories/categories-repository";
import type { MembershipsRepository } from "@/repositories/memberships-repository";
import { CategoryAlreadyExistsError } from "@/use-cases/errors/category-already-exists-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface UpdateCategoryUseCaseRequest {
	categoryId: string;
	userId: string;
	name: string;
}

interface UpdateCategoryUseCaseResponse {
	category: Category;
}

export class UpdateCategoryUseCase {
	constructor(
		private categoriesRepository: CategoriesRepository,
		private membershipsRepository: MembershipsRepository,
	) {}

	async execute({
		categoryId,
		userId,
		name,
	}: UpdateCategoryUseCaseRequest): Promise<UpdateCategoryUseCaseResponse> {
		const category = await this.categoriesRepository.findById(categoryId);

		if (!category) {
			throw new ResourceNotFoundError();
		}

		// A autorização sai da casa DA CATEGORIA.
		const membership =
			await this.membershipsRepository.findByUserIdAndHouseholdId({
				userId,
				householdId: category.householdId,
			});

		// Para quem não é membro, a categoria simplesmente não existe.
		if (!membership) {
			throw new ResourceNotFoundError();
		}

		// RN12: o novo nome não pode colidir com outra categoria da mesma casa.
		const categoryWithSameName =
			await this.categoriesRepository.findByHouseholdIdAndName({
				householdId: category.householdId,
				name,
			});

		if (categoryWithSameName && categoryWithSameName.id !== category.id) {
			throw new CategoryAlreadyExistsError();
		}

		category.name = name;

		const updatedCategory = await this.categoriesRepository.save(category);

		return { category: updatedCategory };
	}
}
