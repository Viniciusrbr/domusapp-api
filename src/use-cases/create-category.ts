import type { Category } from "@/generated/client/client";
import type { CategoriesRepository } from "@/repositories/categories-repository";
import type { MembershipsRepository } from "@/repositories/memberships-repository";
import { CategoryAlreadyExistsError } from "@/use-cases/errors/category-already-exists-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface CreateCategoryUseCaseRequest {
	householdId: string;
	userId: string;
	name: string;
}

interface CreateCategoryUseCaseResponse {
	category: Category;
}

export class CreateCategoryUseCase {
	constructor(
		private categoriesRepository: CategoriesRepository,
		private membershipsRepository: MembershipsRepository,
	) {}

	async execute({
		householdId,
		userId,
		name,
	}: CreateCategoryUseCaseRequest): Promise<CreateCategoryUseCaseResponse> {
		// RNF09/RN18: autorização pela membership do usuário na casa.
		const membership =
			await this.membershipsRepository.findByUserIdAndHouseholdId({
				userId,
				householdId,
			});

		// Para quem não é membro, a casa simplesmente não existe.
		if (!membership) {
			throw new ResourceNotFoundError();
		}

		// RN12: o nome é único DENTRO da casa; em outra casa o mesmo nome é livre.
		const categoryWithSameName =
			await this.categoriesRepository.findByHouseholdIdAndName({
				householdId,
				name,
			});

		if (categoryWithSameName) {
			throw new CategoryAlreadyExistsError();
		}

		const category = await this.categoriesRepository.create({
			householdId,
			name,
		});

		return { category };
	}
}
