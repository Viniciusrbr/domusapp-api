import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { PrismaTasksRepository } from "@/repositories/prisma/prisma-tasks-repository";
import { FetchTaskExecutionsUseCase } from "@/use-cases/fetch-task-executions";

export function makeFetchTaskExecutionsUseCase() {
	const tasksRepository = new PrismaTasksRepository();
	const membershipsRepository = new PrismaMembershipsRepository();
	const fetchTaskExecutionsUseCase = new FetchTaskExecutionsUseCase(
		tasksRepository,
		membershipsRepository,
	);

	return fetchTaskExecutionsUseCase;
}
