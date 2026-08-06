import { beforeEach, describe, expect, it } from "vitest";
import { parseDateOnly } from "@/lib/recurrence";
import { InMemoryCategoriesRepository } from "@/repositories/in-memory/in-memory-categories-repository";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { InMemoryTasksRepository } from "@/repositories/in-memory/in-memory-tasks-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { CreateTaskUseCase } from "@/use-cases/create-task";
import { InvalidFrequencyError } from "@/use-cases/errors/invalid-frequency-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

let usersRepository: InMemoryUsersRepository;
let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let tasksRepository: InMemoryTasksRepository;
let categoriesRepository: InMemoryCategoriesRepository;
let sut: CreateTaskUseCase;
let householdId: string;

describe("Create Task Use Case", () => {
	beforeEach(async () => {
		usersRepository = new InMemoryUsersRepository();
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		tasksRepository = new InMemoryTasksRepository(usersRepository);
		categoriesRepository = new InMemoryCategoriesRepository(tasksRepository);
		sut = new CreateTaskUseCase(
			tasksRepository,
			membershipsRepository,
			categoriesRepository,
		);

		const household = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		householdId = household.id;
	});

	it("should be able to create a task starting the grid at startDate", async () => {
		const startDate = parseDateOnly("2026-03-10");

		const { task } = await sut.execute({
			householdId,
			userId: "user-01",
			name: "Limpar a caixa d'água",
			description: null,
			frequency: 6,
			frequencyUnit: "MONTH",
			startDate,
		});

		expect(task.id).toEqual(expect.any(String));
		// RN05: a próxima execução prevista nasce igual à data de início.
		expect(task.nextDueDate).toEqual(startDate);
		expect(task.startDate).toEqual(startDate);
		expect(task.categoryId).toBeNull();
		expect(tasksRepository.items).toHaveLength(1);
	});

	it("should be able to create a task with a startDate in the past", async () => {
		const startDate = parseDateOnly("2020-01-01");

		const { task } = await sut.execute({
			householdId,
			userId: "user-01",
			name: "Trocar o filtro",
			frequency: 1,
			frequencyUnit: "DAY",
			startDate,
		});

		// RN04: nasce já vencida, e tudo bem — o cliente é quem deriva o status.
		expect(task.nextDueDate).toEqual(startDate);
	});

	it("should not be able to create a task with a frequency lower than 1", async () => {
		await expect(() =>
			sut.execute({
				householdId,
				userId: "user-01",
				name: "Regar as plantas",
				frequency: 0,
				frequencyUnit: "DAY",
				startDate: parseDateOnly("2026-03-10"),
			}),
		).rejects.toBeInstanceOf(InvalidFrequencyError);
	});

	it("should not be able to create a task with a non-integer frequency", async () => {
		await expect(() =>
			sut.execute({
				householdId,
				userId: "user-01",
				name: "Regar as plantas",
				frequency: 1.5,
				frequencyUnit: "DAY",
				startDate: parseDateOnly("2026-03-10"),
			}),
		).rejects.toBeInstanceOf(InvalidFrequencyError);
	});

	it("should be able to create a task with a category from the same household", async () => {
		const category = await categoriesRepository.create({
			householdId,
			name: "Lazer",
		});

		const { task } = await sut.execute({
			householdId,
			userId: "user-01",
			categoryId: category.id,
			name: "Regar as plantas",
			frequency: 1,
			frequencyUnit: "DAY",
			startDate: parseDateOnly("2026-03-10"),
		});

		expect(task.categoryId).toEqual(category.id);
	});

	it("should not be able to create a task with a category from another household", async () => {
		const otherHousehold = await householdsRepository.create({
			name: "Casa da Serra",
			ownerId: "user-01",
		});

		const foreignCategory = await categoriesRepository.create({
			householdId: otherHousehold.id,
			name: "Jardim",
		});

		await expect(() =>
			sut.execute({
				householdId,
				userId: "user-01",
				categoryId: foreignCategory.id,
				name: "Regar as plantas",
				frequency: 1,
				frequencyUnit: "DAY",
				startDate: parseDateOnly("2026-03-10"),
			}),
		).rejects.toBeInstanceOf(ResourceNotFoundError);

		expect(tasksRepository.items).toHaveLength(0);
	});

	it("should not be able to create a task with a non-existing category", async () => {
		await expect(() =>
			sut.execute({
				householdId,
				userId: "user-01",
				categoryId: "non-existing-category",
				name: "Regar as plantas",
				frequency: 1,
				frequencyUnit: "DAY",
				startDate: parseDateOnly("2026-03-10"),
			}),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});

	it("should not be able to create a task in a household the user does not belong to", async () => {
		await expect(() =>
			sut.execute({
				householdId,
				userId: "user-02",
				name: "Regar as plantas",
				frequency: 1,
				frequencyUnit: "DAY",
				startDate: parseDateOnly("2026-03-10"),
			}),
		).rejects.toBeInstanceOf(ResourceNotFoundError);

		expect(tasksRepository.items).toHaveLength(0);
	});
});
