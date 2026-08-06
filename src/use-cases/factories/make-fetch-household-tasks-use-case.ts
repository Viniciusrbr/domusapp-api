import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { PrismaTasksRepository } from "@/repositories/prisma/prisma-tasks-repository";
import { FetchHouseholdTasksUseCase } from "@/use-cases/fetch-household-tasks";

export function makeFetchHouseholdTasksUseCase() {
	const tasksRepository = new PrismaTasksRepository();
	const membershipsRepository = new PrismaMembershipsRepository();
	const fetchHouseholdTasksUseCase = new FetchHouseholdTasksUseCase(
		tasksRepository,
		membershipsRepository,
	);

	return fetchHouseholdTasksUseCase;
}
