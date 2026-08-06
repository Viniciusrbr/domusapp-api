import { randomUUID } from "node:crypto";
import type { Task, TaskExecution } from "@/generated/client/client";
import type { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import type {
	CreateTaskData,
	MarkTaskAsCompletedData,
	TaskExecutionWithAuthor,
	TasksRepository,
} from "@/repositories/tasks-repository";

export class InMemoryTasksRepository implements TasksRepository {
	public items: Task[] = [];
	public executions: TaskExecution[] = [];

	/**
	 * O repositório de usuários é usado só para resolver o nome do autor no
	 * histórico — equivalente ao `include: { executedBy: true }` do Prisma.
	 */
	constructor(private usersRepository: InMemoryUsersRepository) {}

	async create({
		householdId,
		name,
		description,
		frequency,
		frequencyUnit,
		startDate,
	}: CreateTaskData) {
		const task: Task = {
			id: randomUUID(),
			householdId,
			categoryId: null,
			name,
			description: description ?? null,
			frequency,
			frequencyUnit,
			startDate,
			// RN05: a grade começa na data de início.
			nextDueDate: startDate,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(task);

		return task;
	}

	async findById(id: string) {
		const task = this.items.find((item) => item.id === id);

		return task ?? null;
	}

	async findManyByHouseholdId(householdId: string) {
		return this.items
			.filter((item) => item.householdId === householdId)
			.sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
	}

	async save(task: Task) {
		const index = this.items.findIndex((item) => item.id === task.id);

		if (index >= 0) {
			this.items[index] = task;
		}

		return task;
	}

	async delete(id: string) {
		const index = this.items.findIndex((item) => item.id === id);

		if (index >= 0) {
			this.items.splice(index, 1);
		}

		// Cascade equivalente ao do banco (RN11).
		this.executions = this.executions.filter(
			(execution) => execution.taskId !== id,
		);
	}

	async markAsCompleted({
		taskId,
		userId,
		executedAt,
		nextDueDate,
	}: MarkTaskAsCompletedData) {
		const index = this.items.findIndex((item) => item.id === taskId);

		// Sem tarefa não há execução: os dois estados só mudam juntos.
		if (index < 0) {
			return;
		}

		this.executions.push({
			id: randomUUID(),
			taskId,
			executedById: userId,
			executedAt,
		});

		this.items[index] = {
			...this.items[index],
			nextDueDate,
			updatedAt: new Date(),
		};
	}

	async findExecutionsByTaskId(taskId: string) {
		const executions = this.executions
			.filter((execution) => execution.taskId === taskId)
			.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());

		return executions.flatMap<TaskExecutionWithAuthor>((execution) => {
			const author = this.usersRepository.items.find(
				(user) => user.id === execution.executedById,
			);

			if (!author) {
				return [];
			}

			return [
				{
					id: execution.id,
					executedAt: execution.executedAt,
					executedBy: { id: author.id, name: author.name },
				},
			];
		});
	}
}
