import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatDateOnly, parseDateOnly } from "@/lib/recurrence";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { InMemoryTasksRepository } from "@/repositories/in-memory/in-memory-tasks-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { CompleteTaskUseCase } from "@/use-cases/complete-task";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";

let usersRepository: InMemoryUsersRepository;
let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let tasksRepository: InMemoryTasksRepository;
let sut: CompleteTaskUseCase;
let householdId: string;

const createTask = async ({
	startDate,
	frequency = 7,
	frequencyUnit = "DAY" as const,
}: {
	startDate: string;
	frequency?: number;
	frequencyUnit?: "DAY" | "WEEK" | "MONTH";
}) =>
	tasksRepository.create({
		householdId,
		name: "Limpar o banheiro",
		frequency,
		frequencyUnit,
		startDate: parseDateOnly(startDate),
	});

describe("Complete Task Use Case", () => {
	beforeEach(async () => {
		usersRepository = new InMemoryUsersRepository();
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		tasksRepository = new InMemoryTasksRepository(usersRepository);
		sut = new CompleteTaskUseCase(tasksRepository, membershipsRepository);

		const household = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		householdId = household.id;

		// Um segundo membro, para provar que qualquer membro pode concluir (RN27).
		membershipsRepository.items.push({
			id: "membership-02",
			userId: "user-02",
			householdId,
			role: "MEMBER",
			createdAt: new Date(),
			updatedAt: new Date(),
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("should record the execution with the current user and the server time", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-12T15:30:00.000Z"));

		const task = await createTask({ startDate: "2026-03-10" });

		const { executedAt } = await sut.execute({
			taskId: task.id,
			userId: "user-02",
		});

		expect(tasksRepository.executions).toHaveLength(1);
		expect(tasksRepository.executions[0].executedById).toEqual("user-02");
		expect(tasksRepository.executions[0].taskId).toEqual(task.id);
		// RN10/RN21: instante em UTC, definido pelo servidor.
		expect(executedAt.toISOString()).toEqual("2026-03-12T15:30:00.000Z");
	});

	it("should advance the grid from the expected date, not from the completion date", async () => {
		vi.useFakeTimers();
		// Concluída com 2 dias de atraso: a grade não pode olhar para "hoje".
		vi.setSystemTime(new Date("2026-03-12T15:30:00.000Z"));

		const created = await createTask({
			startDate: "2026-03-10",
			frequency: 7,
			frequencyUnit: "DAY",
		});

		const { task } = await sut.execute({
			taskId: created.id,
			userId: "user-01",
		});

		// 10/03 + 7 dias = 17/03 (e NÃO 12/03 + 7 = 19/03).
		expect(formatDateOnly(task.nextDueDate)).toEqual("2026-03-17");
		expect(formatDateOnly(tasksRepository.items[0].nextDueDate)).toEqual(
			"2026-03-17",
		);
	});

	it("should advance exactly one interval, leaving an overdue task still overdue", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-12T12:00:00.000Z"));

		// Prevista há mais de um mês, com frequência semanal.
		const created = await createTask({
			startDate: "2026-01-05",
			frequency: 1,
			frequencyUnit: "WEEK",
		});

		const first = await sut.execute({ taskId: created.id, userId: "user-01" });

		// RN07: um passo só — continua no passado, ou seja, ainda vencida.
		expect(formatDateOnly(first.task.nextDueDate)).toEqual("2026-01-12");
		expect(first.task.nextDueDate.getTime()).toBeLessThan(Date.now());

		// Concluir de novo recupera mais um passo do atraso.
		const second = await sut.execute({ taskId: created.id, userId: "user-01" });

		expect(formatDateOnly(second.task.nextDueDate)).toEqual("2026-01-19");
		expect(tasksRepository.executions).toHaveLength(2);
	});

	it("should keep execution and grid consistent for monthly tasks with day clamping", async () => {
		const created = await createTask({
			startDate: "2026-01-31",
			frequency: 1,
			frequencyUnit: "MONTH",
		});

		const { task } = await sut.execute({
			taskId: created.id,
			userId: "user-01",
		});

		expect(formatDateOnly(task.nextDueDate)).toEqual("2026-02-28");
	});

	it("should not be able to complete a task from a household the user does not belong to", async () => {
		const created = await createTask({ startDate: "2026-03-10" });

		await expect(() =>
			sut.execute({ taskId: created.id, userId: "user-99" }),
		).rejects.toBeInstanceOf(ResourceNotFoundError);

		// Nem execução registrada, nem grade avançada.
		expect(tasksRepository.executions).toHaveLength(0);
		expect(formatDateOnly(tasksRepository.items[0].nextDueDate)).toEqual(
			"2026-03-10",
		);
	});

	it("should not be able to complete a non-existing task", async () => {
		await expect(() =>
			sut.execute({ taskId: "non-existing-task", userId: "user-01" }),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});
});
