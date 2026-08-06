import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory/in-memory-categories-repository";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { InMemoryTasksRepository } from "@/repositories/in-memory/in-memory-tasks-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { CategoryAlreadyExistsError } from "@/use-cases/errors/category-already-exists-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { UpdateCategoryUseCase } from "@/use-cases/update-category";

let usersRepository: InMemoryUsersRepository;
let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let tasksRepository: InMemoryTasksRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: UpdateCategoryUseCase;
let householdId: string;

describe("Update Category Use Case", () => {
	beforeEach(async () => {
		usersRepository = new InMemoryUsersRepository();
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		tasksRepository = new InMemoryTasksRepository(usersRepository);
		categoriesRepository = new InMemoryCategoriesRepository(tasksRepository);
		sut = new UpdateCategoryUseCase(
			categoriesRepository,
			membershipsRepository,
		);

		const household = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		householdId = household.id;
	});

	it("should be able to rename a category", async () => {
		const created = await categoriesRepository.create({
			householdId,
			name: "Lazer",
		});

		const { category } = await sut.execute({
			categoryId: created.id,
			userId: "user-01",
			name: "Lazer e cultura",
		});

		expect(category.name).toEqual("Lazer e cultura");
		expect(categoriesRepository.items[0].name).toEqual("Lazer e cultura");
	});

	it("should be able to rename a category to a name used in another household", async () => {
		const otherHousehold = await householdsRepository.create({
			name: "Casa da Serra",
			ownerId: "user-01",
		});

		await categoriesRepository.create({
			householdId: otherHousehold.id,
			name: "Jardim",
		});

		const created = await categoriesRepository.create({
			householdId,
			name: "Lazer",
		});

		const { category } = await sut.execute({
			categoryId: created.id,
			userId: "user-01",
			name: "Jardim",
		});

		expect(category.name).toEqual("Jardim");
	});

	it("should not be able to rename a category to a name already used in the same household", async () => {
		await categoriesRepository.create({ householdId, name: "Limpeza" });

		const created = await categoriesRepository.create({
			householdId,
			name: "Lazer",
		});

		await expect(() =>
			sut.execute({
				categoryId: created.id,
				userId: "user-01",
				name: "Limpeza",
			}),
		).rejects.toBeInstanceOf(CategoryAlreadyExistsError);
	});

	it("should be able to rename a category to its own current name", async () => {
		const created = await categoriesRepository.create({
			householdId,
			name: "Lazer",
		});

		const { category } = await sut.execute({
			categoryId: created.id,
			userId: "user-01",
			name: "Lazer",
		});

		expect(category.name).toEqual("Lazer");
	});

	it("should not be able to rename a category from a household the user does not belong to", async () => {
		const created = await categoriesRepository.create({
			householdId,
			name: "Lazer",
		});

		await expect(() =>
			sut.execute({
				categoryId: created.id,
				userId: "user-02",
				name: "Outro nome",
			}),
		).rejects.toBeInstanceOf(ResourceNotFoundError);

		expect(categoriesRepository.items[0].name).toEqual("Lazer");
	});

	it("should not be able to rename a non-existing category", async () => {
		await expect(() =>
			sut.execute({
				categoryId: "non-existing-category",
				userId: "user-01",
				name: "Outro nome",
			}),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});
});
