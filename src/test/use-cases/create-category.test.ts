import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory/in-memory-categories-repository";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { InMemoryTasksRepository } from "@/repositories/in-memory/in-memory-tasks-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { CreateCategoryUseCase } from "@/use-cases/create-category";
import { CategoryAlreadyExistsError } from "@/use-cases/errors/category-already-exists-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

let usersRepository: InMemoryUsersRepository;
let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let tasksRepository: InMemoryTasksRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: CreateCategoryUseCase;
let householdId: string;

describe("Create Category Use Case", () => {
	beforeEach(async () => {
		usersRepository = new InMemoryUsersRepository();
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		tasksRepository = new InMemoryTasksRepository(usersRepository);
		categoriesRepository = new InMemoryCategoriesRepository(tasksRepository);
		sut = new CreateCategoryUseCase(
			categoriesRepository,
			membershipsRepository,
		);

		const household = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		householdId = household.id;
	});

	it("should be able to create a category", async () => {
		const { category } = await sut.execute({
			householdId,
			userId: "user-01",
			name: "Lazer",
		});

		expect(category.id).toEqual(expect.any(String));
		expect(category.householdId).toEqual(householdId);
		expect(categoriesRepository.items).toHaveLength(1);
	});

	it("should be able to create categories with the same name in different households", async () => {
		const otherHousehold = await householdsRepository.create({
			name: "Casa da Serra",
			ownerId: "user-01",
		});

		await sut.execute({ householdId, userId: "user-01", name: "Lazer" });

		// RN12: o "Lazer" de uma casa não é o "Lazer" da outra.
		const { category } = await sut.execute({
			householdId: otherHousehold.id,
			userId: "user-01",
			name: "Lazer",
		});

		expect(category.householdId).toEqual(otherHousehold.id);
		expect(categoriesRepository.items).toHaveLength(2);
	});

	it("should not be able to create two categories with the same name in the same household", async () => {
		await sut.execute({ householdId, userId: "user-01", name: "Lazer" });

		await expect(() =>
			sut.execute({ householdId, userId: "user-01", name: "Lazer" }),
		).rejects.toBeInstanceOf(CategoryAlreadyExistsError);

		expect(categoriesRepository.items).toHaveLength(1);
	});

	it("should not be able to create a category in a household the user does not belong to", async () => {
		await expect(() =>
			sut.execute({ householdId, userId: "user-02", name: "Lazer" }),
		).rejects.toBeInstanceOf(ResourceNotFoundError);

		expect(categoriesRepository.items).toHaveLength(0);
	});
});
