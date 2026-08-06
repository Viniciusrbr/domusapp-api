import type { HouseholdsRepository } from "@/repositories/households-repository";
import type { MembershipsRepository } from "@/repositories/memberships-repository";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface DeleteHouseholdUseCaseRequest {
	householdId: string;
	userId: string;
}

export class DeleteHouseholdUseCase {
	constructor(
		private householdsRepository: HouseholdsRepository,
		private membershipsRepository: MembershipsRepository,
	) {}

	async execute({
		householdId,
		userId,
	}: DeleteHouseholdUseCaseRequest): Promise<void> {
		const membership =
			await this.membershipsRepository.findByUserIdAndHouseholdId({
				userId,
				householdId,
			});

		// Para quem não é membro, a casa simplesmente não existe.
		if (!membership) {
			throw new ResourceNotFoundError();
		}

		// Membro, mas sem o papel necessário: excluir é privilégio do owner.
		if (membership.role !== "OWNER") {
			throw new NotAllowedError();
		}

		const household = await this.householdsRepository.findById(householdId);

		if (!household) {
			throw new ResourceNotFoundError();
		}

		// Cascade (memberships, categorias, tarefas, histórico) fica a cargo do banco.
		await this.householdsRepository.delete(householdId);
	}
}
