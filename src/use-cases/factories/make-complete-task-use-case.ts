import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { PrismaTasksRepository } from "@/repositories/prisma/prisma-tasks-repository";
import { CompleteTaskUseCase } from "@/use-cases/complete-task";

export function makeCompleteTaskUseCase() {
	const tasksRepository = new PrismaTasksRepository();
	const membershipsRepository = new PrismaMembershipsRepository();
	const completeTaskUseCase = new CompleteTaskUseCase(
		tasksRepository,
		membershipsRepository,
	);

	return completeTaskUseCase;
}
