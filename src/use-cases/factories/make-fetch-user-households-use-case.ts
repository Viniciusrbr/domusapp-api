import { PrismaMembershipsRepository } from "@/repositories/prisma/prisma-memberships-repository";
import { FetchUserHouseholdsUseCase } from "@/use-cases/fetch-user-households";

export function makeFetchUserHouseholdsUseCase() {
	const membershipsRepository = new PrismaMembershipsRepository();
	const fetchUserHouseholdsUseCase = new FetchUserHouseholdsUseCase(
		membershipsRepository,
	);

	return fetchUserHouseholdsUseCase;
}
