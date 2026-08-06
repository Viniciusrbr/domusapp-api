import { PrismaCategoriesRepository } from "@/repositories/prisma/prisma-categories-repository";
import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { PrismaTasksRepository } from "@/repositories/prisma/prisma-tasks-repository";
import { CreateTaskUseCase } from "@/use-cases/create-task";

export function makeCreateTaskUseCase() {
	const tasksRepository = new PrismaTasksRepository();
	const membershipsRepository = new PrismaMembershipsRepository();
	const categoriesRepository = new PrismaCategoriesRepository();
	const createTaskUseCase = new CreateTaskUseCase(
		tasksRepository,
		membershipsRepository,
		categoriesRepository,
	);

	return createTaskUseCase;
}
