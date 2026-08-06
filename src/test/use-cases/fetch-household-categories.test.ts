import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory/in-memory-categories-repository";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { InMemoryTasksRepository } from "@/repositories/in-memory/in-memory-tasks-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { FetchHouseholdCategoriesUseCase } from "@/use-cases/fetch-household-categories";

let usersRepository: InMemoryUsersRepository;
let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let tasksRepository: InMemoryTasksRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: FetchHouseholdCategoriesUseCase;
let householdId: string;

describe("Fetch Household Categories Use Case", () => {
	beforeEach(async () => {
		usersRepository = new InMemoryUsersRepository();
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		tasksRepository = new InMemoryTasksRepository(usersRepository);
		categoriesRepository = new InMemoryCategoriesRepository(tasksRepository);
		sut = new FetchHouseholdCategoriesUseCase(
			categoriesRepository,
			membershipsRepository,
		);

		const household = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		householdId = household.id;
	});

	it("should list only the categories of the household", async () => {
		const otherHousehold = await householdsRepository.create({
			name: "Casa da Serra",
			ownerId: "user-01",
		});

		await categoriesRepository.create({ householdId, name: "Limpeza" });
		await categoriesRepository.create({ householdId, name: "Lazer" });
		await categoriesRepository.create({
			householdId: otherHousehold.id,
			name: "Jardim",
		});

		const { categories } = await sut.execute({
			householdId,
			userId: "user-01",
		});

		expect(categories).toHaveLength(2);
		expect(categories.map((category) => category.name)).toEqual([
			"Lazer",
			"Limpeza",
		]);
	});

	it("should not be able to list categories of a household the user does not belong to", async () => {
		await expect(() =>
			sut.execute({ householdId, userId: "user-02" }),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});
});
