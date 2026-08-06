import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { FetchUserHouseholdsUseCase } from "@/use-cases/fetch-user-households";

let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let sut: FetchUserHouseholdsUseCase;

describe("Fetch User Households Use Case", () => {
	beforeEach(() => {
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		sut = new FetchUserHouseholdsUseCase(membershipsRepository);
	});

	it("should be able to fetch only the households the user belongs to", async () => {
		await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});
		await householdsRepository.create({
			name: "Casa do Campo",
			ownerId: "user-02",
		});

		const { households } = await sut.execute({ userId: "user-01" });

		expect(households).toHaveLength(1);
		expect(households[0].name).toEqual("Casa da Praia");
	});

	it("should return the role of the user in each household", async () => {
		const owned = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		const joined = await householdsRepository.create({
			name: "Casa do Campo",
			ownerId: "user-02",
		});

		membershipsRepository.items.push({
			id: "membership-01",
			userId: "user-01",
			householdId: joined.id,
			role: "MEMBER",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const { households } = await sut.execute({ userId: "user-01" });

		expect(households).toEqual([
			expect.objectContaining({ id: owned.id, role: "OWNER" }),
			expect.objectContaining({ id: joined.id, role: "MEMBER" }),
		]);
	});

	it("should return an empty list for a user without households", async () => {
		const { households } = await sut.execute({ userId: "user-01" });

		expect(households).toEqual([]);
	});
});
