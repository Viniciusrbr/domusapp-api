import { beforeEach, describe, expect, it } from "vitest";
import { parseDateOnly } from "@/lib/recurrence";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { InMemoryTasksRepository } from "@/repositories/in-memory/in-memory-tasks-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { DeleteTaskUseCase } from "@/use-cases/delete-task";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

let usersRepository: InMemoryUsersRepository;
let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let tasksRepository: InMemoryTasksRepository;
let sut: DeleteTaskUseCase;
let householdId: string;

const createTask = async () =>
	tasksRepository.create({
		householdId,
		name: "Limpar o banheiro",
		frequency: 1,
		frequencyUnit: "WEEK",
		startDate: parseDateOnly("2026-03-10"),
	});

describe("Delete Task Use Case", () => {
	beforeEach(async () => {
		usersRepository = new InMemoryUsersRepository();
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		tasksRepository = new InMemoryTasksRepository(usersRepository);
		sut = new DeleteTaskUseCase(tasksRepository, membershipsRepository);

		const household = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		householdId = household.id;
	});

	it("should be able to delete a task along with its execution history", async () => {
		const created = await createTask();

		await tasksRepository.markAsCompleted({
			taskId: created.id,
			userId: "user-01",
			executedAt: new Date(),
			nextDueDate: parseDateOnly("2026-03-17"),
		});

		await sut.execute({ taskId: created.id, userId: "user-01" });

		expect(tasksRepository.items).toHaveLength(0);
		// RN11: o histórico cai em cascata.
		expect(tasksRepository.executions).toHaveLength(0);
	});

	it("should not be able to delete a task from a household the user does not belong to", async () => {
		const created = await createTask();

		await expect(() =>
			sut.execute({ taskId: created.id, userId: "user-02" }),
		).rejects.toBeInstanceOf(ResourceNotFoundError);

		expect(tasksRepository.items).toHaveLength(1);
	});

	it("should not be able to delete a non-existing task", async () => {
		await expect(() =>
			sut.execute({ taskId: "non-existing-task", userId: "user-01" }),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});
});
