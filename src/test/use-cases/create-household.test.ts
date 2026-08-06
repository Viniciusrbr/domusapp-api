import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { CreateHouseholdUseCase } from "@/use-cases/create-household";

let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let sut: CreateHouseholdUseCase;

describe("Create Household Use Case", () => {
	beforeEach(() => {
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		sut = new CreateHouseholdUseCase(householdsRepository);
	});

	it("should be able to create a household", async () => {
		const { household } = await sut.execute({
			name: "Casa da Praia",
			userId: "user-01",
		});

		expect(household.id).toEqual(expect.any(String));
		expect(household.name).toEqual("Casa da Praia");
		expect(householdsRepository.items).toHaveLength(1);
	});

	it("should create the owner membership along with the household", async () => {
		const { household } = await sut.execute({
			name: "Casa da Praia",
			userId: "user-01",
		});

		expect(membershipsRepository.items).toHaveLength(1);
		expect(membershipsRepository.items[0]).toEqual(
			expect.objectContaining({
				userId: "user-01",
				householdId: household.id,
				role: "OWNER",
			}),
		);
	});
});
