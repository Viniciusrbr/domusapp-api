import { z } from "zod";

const taskNameSchema = z
	.string()
	.trim()
	.min(1, "O nome da tarefa é obrigatório.")
	.max(100, "O nome da tarefa deve ter no máximo 100 caracteres.");

const taskDescriptionSchema = z
	.string()
	.trim()
	.max(500, "A descrição deve ter no máximo 500 caracteres.")
	.nullable();

const frequencySchema = z
	.int("A frequência deve ser um número inteiro.")
	.min(1, "A frequência deve ser no mínimo 1.");

const frequencyUnitSchema = z.enum(["DAY", "WEEK", "MONTH"]);

/** Data de calendário "YYYY-MM-DD" — sem hora e sem fuso (RN22/RNF06). */
const dateOnlySchema = z.iso.date();

/** RN13: 0 ou 1 categoria, sempre da mesma casa da tarefa. */
const categoryIdSchema = z.string().min(1);

export const createTaskBodySchema = z.object({
	name: taskNameSchema,
	description: taskDescriptionSchema.optional(),
	frequency: frequencySchema,
	frequencyUnit: frequencyUnitSchema,
	startDate: dateOnlySchema,
	categoryId: categoryIdSchema.nullable().optional(),
});

export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;

// Nesta fatia só nome, descrição e categoria são editáveis: frequência e startDate
// mexem na grade de recorrência e exigem decisão de recomputo do `nextDueDate`.
// `categoryId: null` remove o vínculo; ausente mantém a categoria atual.
export const updateTaskBodySchema = z
	.object({
		name: taskNameSchema.optional(),
		description: taskDescriptionSchema.optional(),
		categoryId: categoryIdSchema.nullable().optional(),
	})
	.refine(
		(body) =>
			body.name !== undefined ||
			body.description !== undefined ||
			body.categoryId !== undefined,
		"Informe ao menos um campo para atualizar.",
	);

export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;

export const householdTasksParamsSchema = z.object({
	householdId: z.string().min(1),
});

export type HouseholdTasksParams = z.infer<typeof householdTasksParamsSchema>;

export const taskParamsSchema = z.object({
	taskId: z.string().min(1),
});

export type TaskParams = z.infer<typeof taskParamsSchema>;

export const taskSchema = z.object({
	id: z.string(),
	householdId: z.string(),
	categoryId: z.string().nullable(),
	name: z.string(),
	description: z.string().nullable(),
	frequency: z.int(),
	frequencyUnit: frequencyUnitSchema,
	// O cliente deriva o status a partir destes campos, no fuso local (RN08/RN23).
	startDate: dateOnlySchema,
	nextDueDate: dateOnlySchema,
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const createTaskResponseSchema = z.object({
	task: taskSchema,
});

export const updateTaskResponseSchema = z.object({
	task: taskSchema,
});

export const fetchHouseholdTasksResponseSchema = z.object({
	tasks: z.array(taskSchema),
});

export const completeTaskResponseSchema = z.object({
	task: taskSchema,
	execution: z.object({
		executedAt: z.iso.datetime(),
	}),
});

export const fetchTaskExecutionsResponseSchema = z.object({
	executions: z.array(
		z.object({
			id: z.string(),
			executedAt: z.iso.datetime(),
			executedBy: z.object({
				id: z.string(),
				name: z.string(),
			}),
		}),
	),
});
