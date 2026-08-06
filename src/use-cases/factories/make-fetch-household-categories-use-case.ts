import { PrismaCategoriesRepository } from "@/repositories/prisma/prisma-categories-repository";
import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { FetchHouseholdCategoriesUseCase } from "@/use-cases/fetch-household-categories";

export function makeFetchHouseholdCategoriesUseCase() {
	const categoriesRepository = new PrismaCategoriesRepository();
	const membershipsRepository = new PrismaMembershipsRepository();
	const fetchHouseholdCategoriesUseCase = new FetchHouseholdCategoriesUseCase(
		categoriesRepository,
		membershipsRepository,
	);

	return fetchHouseholdCategoriesUseCase;
}
