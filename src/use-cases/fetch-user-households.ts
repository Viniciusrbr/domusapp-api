import type { Role } from "@/generated/client/enums";
import type { MembershipsRepository } from "@/repositories/memberships-repository";

interface UserHousehold {
	id: string;
	name: string;
	role: Role;
	createdAt: Date;
	updatedAt: Date;
}

interface FetchUserHouseholdsUseCaseRequest {
	userId: string;
}

interface FetchUserHouseholdsUseCaseResponse {
	households: UserHousehold[];
}

export class FetchUserHouseholdsUseCase {
	constructor(private membershipsRepository: MembershipsRepository) {}

	async execute({
		userId,
	}: FetchUserHouseholdsUseCaseRequest): Promise<FetchUserHouseholdsUseCaseResponse> {
		// A lista sai das memberships do usuário — nunca de uma "casa ativa" (RN19).
		const memberships =
			await this.membershipsRepository.findManyByUserId(userId);

		const households = memberships.map((membership) => ({
			id: membership.household.id,
			name: membership.household.name,
			role: membership.role,
			createdAt: membership.household.createdAt,
			updatedAt: membership.household.updatedAt,
		}));

		return { households };
	}
}
