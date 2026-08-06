import type { Household } from "@/generated/client/client";
import type { HouseholdsRepository } from "@/repositories/households-repository";
import type { MembershipsRepository } from "@/repositories/memberships-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface UpdateHouseholdUseCaseRequest {
	householdId: string;
	userId: string;
	name: string;
}

interface UpdateHouseholdUseCaseResponse {
	household: Household;
}

export class UpdateHouseholdUseCase {
	constructor(
		private householdsRepository: HouseholdsRepository,
		private membershipsRepository: MembershipsRepository,
	) { }

	async execute({
		householdId,
		userId,
		name,
	}: UpdateHouseholdUseCaseRequest): Promise<UpdateHouseholdUseCaseResponse> {
		// RNF09/RN18: autorização pela membership do usuário no recurso.
		const membership =
			await this.membershipsRepository.findByUserIdAndHouseholdId({
				userId,
				householdId,
			});

		// Para quem não é membro, a casa simplesmente não existe.
		if (!membership) {
			throw new ResourceNotFoundError();
		}

		const household = await this.householdsRepository.findById(householdId);

		if (!household) {
			throw new ResourceNotFoundError();
		}

		household.name = name;

		const updatedHousehold = await this.householdsRepository.save(household);

		return { household: updatedHousehold };
	}
}
