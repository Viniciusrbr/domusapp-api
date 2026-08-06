import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { PrismaTasksRepository } from "@/repositories/prisma/prisma-tasks-repository";
import { DeleteTaskUseCase } from "@/use-cases/delete-task";

export function makeDeleteTaskUseCase() {
	const tasksRepository = new PrismaTasksRepository();
	const membershipsRepository = new PrismaMembershipsRepository();
	const deleteTaskUseCase = new DeleteTaskUseCase(
		tasksRepository,
		membershipsRepository,
	);

	return deleteTaskUseCase;
}
