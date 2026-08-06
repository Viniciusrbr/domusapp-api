import { beforeEach, describe, expect, it } from "vitest";
import { parseDateOnly } from "@/lib/recurrence";
import { InMemoryHouseholdsRepository } from "@/repositories/in-memory/in-memory-households-repository";
import { InMemoryMembershipsRepository } from "@/repositories/in-memory/in-memory-memberships-repository";
import { InMemoryTasksRepository } from "@/repositories/in-memory/in-memory-tasks-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { FetchHouseholdTasksUseCase } from "@/use-cases/fetch-household-tasks";

let usersRepository: InMemoryUsersRepository;
let membershipsRepository: InMemoryMembershipsRepository;
let householdsRepository: InMemoryHouseholdsRepository;
let tasksRepository: InMemoryTasksRepository;
let sut: FetchHouseholdTasksUseCase;
let householdId: string;

describe("Fetch Household Tasks Use Case", () => {
	beforeEach(async () => {
		usersRepository = new InMemoryUsersRepository();
		membershipsRepository = new InMemoryMembershipsRepository();
		householdsRepository = new InMemoryHouseholdsRepository(
			membershipsRepository,
		);
		tasksRepository = new InMemoryTasksRepository(usersRepository);
		sut = new FetchHouseholdTasksUseCase(
			tasksRepository,
			membershipsRepository,
		);

		const household = await householdsRepository.create({
			name: "Casa da Praia",
			ownerId: "user-01",
		});

		householdId = household.id;
	});

	it("should be able to list the tasks of a household the user belongs to", async () => {
		await tasksRepository.create({
			householdId,
			name: "Regar as plantas",
			frequency: 2,
			frequencyUnit: "DAY",
			startDate: parseDateOnly("2026-03-12"),
		});

		await tasksRepository.create({
			householdId,
			name: "Limpar o banheiro",
			frequency: 1,
			frequencyUnit: "WEEK",
			startDate: parseDateOnly("2026-03-10"),
		});

		const { tasks } = await sut.execute({ householdId, userId: "user-01" });

		expect(tasks).toHaveLength(2);
		// Mais próximas da grade primeiro.
		expect(tasks.map((task) => task.name)).toEqual([
			"Limpar o banheiro",
			"Regar as plantas",
		]);
		// O servidor devolve a grade crua — nada de status calculado aqui.
		expect(tasks[0]).toEqual(
			expect.objectContaining({
				startDate: parseDateOnly("2026-03-10"),
				nextDueDate: parseDateOnly("2026-03-10"),
				frequency: 1,
				frequencyUnit: "WEEK",
			}),
		);
	});

	it("should not list tasks from other households", async () => {
		const otherHousehold = await householdsRepository.create({
			name: "Casa da Serra",
			ownerId: "user-02",
		});

		await tasksRepository.create({
			householdId: otherHousehold.id,
			name: "Varrer a garagem",
			frequency: 1,
			frequencyUnit: "WEEK",
			startDate: parseDateOnly("2026-03-10"),
		});

		const { tasks } = await sut.execute({ householdId, userId: "user-01" });

		expect(tasks).toHaveLength(0);
	});

	it("should not be able to list tasks of a household the user does not belong to", async () => {
		await expect(() =>
			sut.execute({ householdId, userId: "user-02" }),
		).rejects.toBeInstanceOf(ResourceNotFoundError);
	});
});
