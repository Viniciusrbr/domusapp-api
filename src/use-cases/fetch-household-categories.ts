import type { Category } from "@/generated/client/client";
import type { CategoriesRepository } from "@/repositories/categories-repository";
import type { MembershipsRepository } from "@/repositories/memberships-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface FetchHouseholdCategoriesUseCaseRequest {
	householdId: string;
	userId: string;
}

interface FetchHouseholdCategoriesUseCaseResponse {
	categories: Category[];
}

export class FetchHouseholdCategoriesUseCase {
	constructor(
		private categoriesRepository: CategoriesRepository,
		private membershipsRepository: MembershipsRepository,
	) {}

	async execute({
		householdId,
		userId,
	}: FetchHouseholdCategoriesUseCaseRequest): Promise<FetchHouseholdCategoriesUseCaseResponse> {
		const membership =
			await this.membershipsRepository.findByUserIdAndHouseholdId({
				userId,
				householdId,
			});

		if (!membership) {
			throw new ResourceNotFoundError();
		}

		// RN12: as categorias são da casa — nunca compartilhadas entre casas.
		const categories =
			await this.categoriesRepository.findManyByHouseholdId(householdId);

		return { categories };
	}
}
