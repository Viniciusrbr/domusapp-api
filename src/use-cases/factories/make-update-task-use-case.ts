import { PrismaCategoriesRepository } from "@/repositories/prisma/prisma-categories-repository";
import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { PrismaTasksRepository } from "@/repositories/prisma/prisma-tasks-repository";
import { UpdateTaskUseCase } from "@/use-cases/update-task";

export function makeUpdateTaskUseCase() {
	const tasksRepository = new PrismaTasksRepository();
	const membershipsRepository = new PrismaMembershipsRepository();
	const categoriesRepository = new PrismaCategoriesRepository();
	const updateTaskUseCase = new UpdateTaskUseCase(
		tasksRepository,
		membershipsRepository,
		categoriesRepository,
	);

	return updateTaskUseCase;
}
