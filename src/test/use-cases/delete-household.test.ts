import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { DeleteHouseholdUseCase } from "@/use-cases/delete-household";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let sut: DeleteHouseholdUseCase;

describe("Delete Household Use Case", () => {
	beforeEach(() => {
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		sut = new DeleteHouseholdUseCase(
			householdsRepository,
			membershipsRepository,
		);
	});

	it("should be able to delete a household as the owner", async () => {
		const created = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		await sut.execute({ householdId: created.id, userId: "user-01" });

		expect(householdsRepository.items).toHaveLength(0);
		expect(membershipsRepository.items).toHaveLength(0);
	});

	it("should not be able to delete a household as a non-owner member", async () => {
		const created = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		membershipsRepository.items.push({
			id: "membership-02",
			userId: "user-02",
			householdId: created.id,
			role: "MEMBER",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		await expect(() =>
			sut.execute({ householdId: created.id, userId: "user-02" }),
		).rejects.toBeInstanceOf(NotAllowedError);

		expect(householdsRepository.items).toHaveLength(1);
	});

	it("should not be able to delete a household the user does not belong to", async () => {
		const created = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		await expect(() =>
			sut.execute({ householdId: created.id, userId: "user-03" }),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});

	it("should not be able to delete a non-existing household", async () => {
		await expect(() =>
			sut.execute({
				householdId: "non-existing-household",
				userId: "user-01",
			}),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});
});
