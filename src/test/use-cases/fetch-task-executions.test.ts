import { beforeEach, describe, expect, it } from "vitest";
import { parseDateOnly } from "@/lib/recurrence";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { InMemoryTasksRepository } from "@/repositories/in-memory/in-memory-tasks-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { FetchTaskExecutionsUseCase } from "@/use-cases/fetch-task-executions";

let usersRepository: InMemoryUsersRepository;
let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let tasksRepository: InMemoryTasksRepository;
let sut: FetchTaskExecutionsUseCase;
let householdId: string;

describe("Fetch Task Executions Use Case", () => {
	beforeEach(async () => {
		usersRepository = new InMemoryUsersRepository();
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		tasksRepository = new InMemoryTasksRepository(usersRepository);
		sut = new FetchTaskExecutionsUseCase(
			tasksRepository,
			membershipsRepository,
		);

		const household = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		householdId = household.id;

		await usersRepository.create({
			id: "user-01",
			name: "Ana",
			email: "ana@example.com",
			passwordHash: "hash",
		});
	});

	it("should be able to list who completed the task and when", async () => {
		const task = await tasksRepository.create({
			householdId,
			name: "Limpar o banheiro",
			frequency: 1,
			frequencyUnit: "WEEK",
			startDate: parseDateOnly("2026-03-10"),
		});

		await tasksRepository.markAsCompleted({
			taskId: task.id,
			userId: "user-01",
			executedAt: new Date("2026-03-10T09:00:00.000Z"),
			nextDueDate: parseDateOnly("2026-03-17"),
		});

		await tasksRepository.markAsCompleted({
			taskId: task.id,
			userId: "user-01",
			executedAt: new Date("2026-03-17T09:00:00.000Z"),
			nextDueDate: parseDateOnly("2026-03-24"),
		});

		const { executions } = await sut.execute({
			taskId: task.id,
			userId: "user-01",
		});

		expect(executions).toHaveLength(2);
		// Mais recentes primeiro.
		expect(executions[0].executedAt.toISOString()).toEqual(
			"2026-03-17T09:00:00.000Z",
		);
		expect(executions[0].executedBy).toEqual({ id: "user-01", name: "Ana" });
	});

	it("should not be able to list executions of a task the user has no membership for", async () => {
		const task = await tasksRepository.create({
			householdId,
			name: "Limpar o banheiro",
			frequency: 1,
			frequencyUnit: "WEEK",
			startDate: parseDateOnly("2026-03-10"),
		});

		await expect(() =>
			sut.execute({ taskId: task.id, userId: "user-02" }),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});

	it("should not be able to list executions of a non-existing task", async () => {
		await expect(() =>
			sut.execute({ taskId: "non-existing-task", userId: "user-01" }),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});
});
