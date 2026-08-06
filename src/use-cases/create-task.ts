import type { Task } from "@/generated/client/client";
import type { FrequencyUnit } from "@/generated/client/enums";
import type { MembershipsRepository } from "@/repositories/memberships-repository";
import type { TasksRepository } from "@/repositories/tasks-repository";
import { InvalidFrequencyError } from "@/use-cases/errors/invalid-frequency-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

interface CreateTaskUseCaseRequest {
	householdId: string;
	userId: string;
	name: string;
	description?: string | null;
	frequency: number;
	frequencyUnit: FrequencyUnit;
	startDate: Date;
}

interface CreateTaskUseCaseResponse {
	task: Task;
}

export class CreateTaskUseCase {
	constructor(
		private tasksRepository: TasksRepository,
		private membershipsRepository: MembershipsRepository,
	) {}

	async execute({
		householdId,
		userId,
		name,
		description,
		frequency,
		frequencyUnit,
		startDate,
	}: CreateTaskUseCaseRequest): Promise<CreateTaskUseCaseResponse> {
		// RN03: frequência é um inteiro >= 1.
		if (!Number.isInteger(frequency) || frequency < 1) {
			throw new InvalidFrequencyError();
		}

		// RNF09/RN18: autorização pela membership do usuário na casa.
		const membership =
			await this.membershipsRepository.findByUserIdAndHouseholdId({
				userId,
				householdId,
			});

		// Para quem não é membro, a casa simplesmente não existe.
		if (!membership) {
			throw new ResourceNotFoundError();
		}

		// RN04: `startDate` no passado é permitido — a tarefa já nasce vencida.
		const task = await this.tasksRepository.create({
			householdId,
			name,
			description,
			frequency,
			frequencyUnit,
			startDate,
		});

		return { task };
	}
}
