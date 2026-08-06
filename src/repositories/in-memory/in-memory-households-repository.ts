import { randomUUID } from "node:crypto";
import type { Household } from "@/generated/client/client";
import type {
	CreateHouseholdData,
	HouseholdsRepository,
} from "@/repositories/households-repository";
import type { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";

export class InMemoryHouseholdsRepository implements HouseholdsRepository {
	public items: Household[];

	constructor(private membershipsRepository: InMemoryMembershipsRepository) {
		// Mesma referência de array usada pelo repositório de memberships.
		this.items = membershipsRepository.households;
	}

	async create({ name, ownerId }: CreateHouseholdData) {
		const household: Household = {
			id: randomUUID(),
			name,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(household);

		// RN16: a membership OWNER nasce junto com a casa.
		this.membershipsRepository.items.push({
			id: randomUUID(),
			userId: ownerId,
			householdId: household.id,
			role: "OWNER",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return household;
	}

	async findById(id: string) {
		const household = this.items.find((item) => item.id === id);

		return household ?? null;
	}

	async save(household: Household) {
		const index = this.items.findIndex((item) => item.id === household.id);

		if (index >= 0) {
			this.items[index] = household;
		}

		return household;
	}

	async delete(id: string) {
		const index = this.items.findIndex((item) => item.id === id);

		if (index >= 0) {
			this.items.splice(index, 1);
		}

		// Cascade equivalente ao do banco (RF09).
		this.membershipsRepository.items = this.membershipsRepository.items.filter(
			(item) => item.householdId !== id,
		);
	}
}
