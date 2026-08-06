import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { UpdateHouseholdUseCase } from "@/use-cases/update-household";

let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let sut: UpdateHouseholdUseCase;

describe("Update Household Use Case", () => {
	beforeEach(() => {
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		sut = new UpdateHouseholdUseCase(
			householdsRepository,
			membershipsRepository,
		);
	});

	it("should be able to rename a household as a member", async () => {
		const created = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		const { household } = await sut.execute({
			householdId: created.id,
			userId: "user-01",
			name: "Casa da Serra",
		});

		expect(household.name).toEqual("Casa da Serra");
		expect(householdsRepository.items[0].name).toEqual("Casa da Serra");
	});

	it("should not be able to rename a household the user does not belong to", async () => {
		const created = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		await expect(() =>
			sut.execute({
				householdId: created.id,
				userId: "user-02",
				name: "Casa da Serra",
			}),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});

	it("should not be able to rename a non-existing household", async () => {
		await expect(() =>
			sut.execute({
				householdId: "non-existing-household",
				userId: "user-01",
				name: "Casa da Serra",
			}),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});
});
