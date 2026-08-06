import { PrismaHouseholdsRepository } from "@/repositories/prisma/prisma-households-repository";
import { CreateHouseholdUseCase } from "@/use-cases/create-household";

export function makeCreateHouseholdUseCase() {
	const householdsRepository = new PrismaHouseholdsRepository();
	const createHouseholdUseCase = new CreateHouseholdUseCase(
		householdsRepository,
	);

	return createHouseholdUseCase;
}
