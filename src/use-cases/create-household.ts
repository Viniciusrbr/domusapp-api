import type { Household } from "@/generated/client/client";
import type { HouseholdsRepository } from "@/repositories/households-repository";

interface CreateHouseholdUseCaseRequest {
	name: string;
	userId: string;
}

interface CreateHouseholdUseCaseResponse {
	household: Household;
}

export class CreateHouseholdUseCase {
	constructor(private householdsRepository: HouseholdsRepository) {}

	async execute({
		name,
		userId,
	}: CreateHouseholdUseCaseRequest): Promise<CreateHouseholdUseCaseResponse> {
		const household = await this.householdsRepository.create({
			name,
			ownerId: userId,
		});

		return { household };
	}
}
