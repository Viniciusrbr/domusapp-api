import { PrismaHouseholdsRepository } from "@/repositories/prisma/prisma-households-repository";
import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { DeleteHouseholdUseCase } from "@/use-cases/delete-household";

export function makeDeleteHouseholdUseCase() {
	const householdsRepository = new PrismaHouseholdsRepository();
	const membershipsRepository = new PrismaMembershipsRepository();
	const deleteHouseholdUseCase = new DeleteHouseholdUseCase(
		householdsRepository,
		membershipsRepository,
	);

	return deleteHouseholdUseCase;
}
