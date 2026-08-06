import type { Task } from "@/generated/client/client";
import { prisma } from "@/lib/prisma";
import type {
	CreateTaskData,
	MarkTaskAsCompletedData,
	TasksRepository,
} from "@/repositories/tasks-repository";

export class PrismaTasksRepository implements TasksRepository {
	async create({
		householdId,
		name,
		description,
		frequency,
		frequencyUnit,
		startDate,
	}: CreateTaskData) {
		return prisma.task.create({
			data: {
				householdId,
				name,
				description: description ?? null,
				frequency,
				frequencyUnit,
				startDate,
				// RN05: a grade começa na data de início.
				nextDueDate: startDate,
			},
		});
	}

	async findById(id: string) {
		return prisma.task.findUnique({ where: { id } });
	}

	async findManyByHouseholdId(householdId: string) {
		return prisma.task.findMany({
			where: { householdId },
			orderBy: [{ nextDueDate: "asc" }, { createdAt: "asc" }],
		});
	}

	async save(task: Task) {
		return prisma.task.update({
			where: { id: task.id },
			data: {
				name: task.name,
				description: task.description,
			},
		});
	}

	async delete(id: string) {
		// O histórico de execuções cai em cascata pelo schema (RN11).
		await prisma.task.delete({ where: { id } });
	}

	async markAsCompleted({
		taskId,
		userId,
		executedAt,
		nextDueDate,
	}: MarkTaskAsCompletedData) {
		// Execução registrada e grade avançada na MESMA transação: nunca uma sem a outra.
		await prisma.$transaction([
			prisma.taskExecution.create({
				data: { taskId, executedById: userId, executedAt },
			}),
			prisma.task.update({
				where: { id: taskId },
				data: { nextDueDate },
			}),
		]);
	}

	async findExecutionsByTaskId(taskId: string) {
		return prisma.taskExecution.findMany({
			where: { taskId },
			select: {
				id: true,
				executedAt: true,
				executedBy: { select: { id: true, name: true } },
			},
			orderBy: { executedAt: "desc" },
		});
	}
}
