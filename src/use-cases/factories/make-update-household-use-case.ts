import { PrismaHouseholdsRepository } from "@/repositories/prisma/prisma-households-repository";
import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { UpdateHouseholdUseCase } from "@/use-cases/update-household";

export function makeUpdateHouseholdUseCase() {
	const householdsRepository = new PrismaHouseholdsRepository();
	const membershipsRepository = new PrismaMembershipsRepository();
	const updateHouseholdUseCase = new UpdateHouseholdUseCase(
		householdsRepository,
		membershipsRepository,
	);

	return updateHouseholdUseCase;
}
