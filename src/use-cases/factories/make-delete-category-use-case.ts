import { PrismaCategoriesRepository } from "@/repositories/prisma/prisma-categories-repository";
import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { DeleteCategoryUseCase } from "@/use-cases/delete-category";

export function makeDeleteCategoryUseCase() {
	const categoriesRepository = new PrismaCategoriesRepository();
	const membershipsRepository = new PrismaMembershipsRepository();
	const deleteCategoryUseCase = new DeleteCategoryUseCase(
		categoriesRepository,
		membershipsRepository,
	);

	return deleteCategoryUseCase;
}
