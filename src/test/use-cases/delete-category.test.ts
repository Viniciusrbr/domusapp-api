import { beforeEach, describe, expect, it } from "vitest";
import { parseDateOnly } from "@/lib/recurrence";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory/in-memory-categories-repository";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { InMemoryTasksRepository } from "@/repositories/in-memory/in-memory-tasks-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { DeleteCategoryUseCase } from "@/use-cases/delete-category";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

let usersRepository: InMemoryUsersRepository;
let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let tasksRepository: InMemoryTasksRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: DeleteCategoryUseCase;
let householdId: string;

describe("Delete Category Use Case", () => {
	beforeEach(async () => {
		usersRepository = new InMemoryUsersRepository();
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		tasksRepository = new InMemoryTasksRepository(usersRepository);
		categoriesRepository = new InMemoryCategoriesRepository(tasksRepository);
		sut = new DeleteCategoryUseCase(
			categoriesRepository,
			membershipsRepository,
		);

		const household = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		householdId = household.id;
	});

	it("should be able to delete a category", async () => {
		const category = await categoriesRepository.create({
			householdId,
			name: "Lazer",
		});

		await sut.execute({ categoryId: category.id, userId: "user-01" });

		expect(categoriesRepository.items).toHaveLength(0);
	});

	it("should keep the tasks and clear their category on delete", async () => {
		const category = await categoriesRepository.create({
			householdId,
			name: "Lazer",
		});

		await tasksRepository.create({
			householdId,
			categoryId: category.id,
			name: "Limpar o banheiro",
			frequency: 1,
			frequencyUnit: "WEEK",
			startDate: parseDateOnly("2026-03-10"),
		});

		await sut.execute({ categoryId: category.id, userId: "user-01" });

		// RN14: a tarefa continua existindo, apenas sem categoria.
		expect(tasksRepository.items).toHaveLength(1);
		expect(tasksRepository.items[0].categoryId).toBeNull();
	});

	it("should not be able to delete a category from a household the user does not belong to", async () => {
		const category = await categoriesRepository.create({
			householdId,
			name: "Lazer",
		});

		await expect(() =>
			sut.execute({ categoryId: category.id, userId: "user-02" }),
		).rejects.toBeInstanceOf(ResourceNotFoundError);

		expect(categoriesRepository.items).toHaveLength(1);
	});

	it("should not be able to delete a non-existing category", async () => {
		await expect(() =>
			sut.execute({ categoryId: "non-existing-category", userId: "user-01" }),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});
});
