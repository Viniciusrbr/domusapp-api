import { PrismaCategoriesRepository } from "@/repositories/prisma/prisma-categories-repository";
import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { CreateCategoryUseCase } from "@/use-cases/create-category";

export function makeCreateCategoryUseCase() {
	const categoriesRepository = new PrismaCategoriesRepository();
	const membershipsRepository = new PrismaMembershipsRepository();
	const createCategoryUseCase = new CreateCategoryUseCase(
		categoriesRepository,
		membershipsRepository,
	);

	return createCategoryUseCase;
}
