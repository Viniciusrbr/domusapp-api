import type { z } from "zod";
import type { taskSchema } from "@/controllers/tasks/schemas";
import type { Task } from "@/generated/client/client";
import { formatDateOnly } from "@/lib/recurrence";

type TaskResponse = z.infer<typeof taskSchema>;

/**
 * As datas da grade saem como "YYYY-MM-DD" (sem fuso); os carimbos de tempo,
 * como ISO em UTC. Nenhum status é calculado aqui — isso é do cliente.
 */
export const toTaskResponse = (task: Task): TaskResponse => ({
	id: task.id,
	householdId: task.householdId,
	name: task.name,
	description: task.description,
	frequency: task.frequency,
	frequencyUnit: task.frequencyUnit,
	startDate: formatDateOnly(task.startDate),
	nextDueDate: formatDateOnly(task.nextDueDate),
	createdAt: task.createdAt.toISOString(),
	updatedAt: task.updatedAt.toISOString(),
});
