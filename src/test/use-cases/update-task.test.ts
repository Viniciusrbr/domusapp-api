import { beforeEach, describe, expect, it } from "vitest";
import { parseDateOnly } from "@/lib/recurrence";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { InMemoryTasksRepository } from "@/repositories/in-memory/in-memory-tasks-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { UpdateTaskUseCase } from "@/use-cases/update-task";

let usersRepository: InMemoryUsersRepository;
let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let tasksRepository: InMemoryTasksRepository;
let sut: UpdateTaskUseCase;
let householdId: string;

const createTask = async () =>
	tasksRepository.create({
		householdId,
		name: "Limpar o banheiro",
		description: "Com o produto do armário.",
		frequency: 1,
		frequencyUnit: "WEEK",
		startDate: parseDateOnly("2026-03-10"),
	});

describe("Update Task Use Case", () => {
	beforeEach(async () => {
		usersRepository = new InMemoryUsersRepository();
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		tasksRepository = new InMemoryTasksRepository(usersRepository);
		sut = new UpdateTaskUseCase(tasksRepository, membershipsRepository);

		const household = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		householdId = household.id;
	});

	it("should be able to update the name and the description", async () => {
		const created = await createTask();

		const { task } = await sut.execute({
			taskId: created.id,
			userId: "user-01",
			name: "Limpar os banheiros",
			description: "Os dois, incluindo o de baixo.",
		});

		expect(task.name).toEqual("Limpar os banheiros");
		expect(task.description).toEqual("Os dois, incluindo o de baixo.");
		expect(tasksRepository.items[0].name).toEqual("Limpar os banheiros");
	});

	it("should be able to clear the description", async () => {
		const created = await createTask();

		const { task } = await sut.execute({
			taskId: created.id,
			userId: "user-01",
			description: null,
		});

		expect(task.description).toBeNull();
		expect(task.name).toEqual("Limpar o banheiro");
	});

	it("should not change the recurrence grid", async () => {
		const created = await createTask();

		const { task } = await sut.execute({
			taskId: created.id,
			userId: "user-01",
			name: "Outro nome",
		});

		expect(task.frequency).toEqual(created.frequency);
		expect(task.frequencyUnit).toEqual(created.frequencyUnit);
		expect(task.startDate).toEqual(created.startDate);
		expect(task.nextDueDate).toEqual(created.nextDueDate);
	});

	it("should not be able to update a task from a household the user does not belong to", async () => {
		const created = await createTask();

		await expect(() =>
			sut.execute({
				taskId: created.id,
				userId: "user-02",
				name: "Outro nome",
			}),
		).rejects.toBeInstanceOf(ResourceNotFoundError);

		expect(tasksRepository.items[0].name).toEqual("Limpar o banheiro");
	});

	it("should not be able to update a non-existing task", async () => {
		await expect(() =>
			sut.execute({
				taskId: "non-existing-task",
				userId: "user-01",
				name: "Outro nome",
			}),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});
});
