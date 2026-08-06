import { PrismaCategoriesRepository } from "@/repositories/prisma/prisma-categories-repository";
import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { UpdateCategoryUseCase } from "@/use-cases/update-category";

export function makeUpdateCategoryUseCase() {
	const categoriesRepository = new PrismaCategoriesRepository();
	const membershipsRepository = new PrismaMembershipsRepository();
	const updateCategoryUseCase = new UpdateCategoryUseCase(
		categoriesRepository,
		membershipsRepository,
	);

	return updateCategoryUseCase;
}
