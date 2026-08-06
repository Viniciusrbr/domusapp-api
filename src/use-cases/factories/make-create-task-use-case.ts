import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { PrismaTasksRepository } from "@/repositories/prisma/prisma-tasks-repository";
import { CreateTaskUseCase } from "@/use-cases/create-task";

export function makeCreateTaskUseCase() {
	const tasksRepository = new PrismaTasksRepository();
	const membershipsRepository = new PrismaMembershipsRepository();
	const createTaskUseCase = new CreateTaskUseCase(
		tasksRepository,
		membershipsRepository,
	);

	return createTaskUseCase;
}
