import type { Task } from "@/generated/client/client";
import type { FrequencyUnit } from "@/generated/client/enums";

export interface CreateTaskData {
	householdId: string;
	/** 0 ou 1 categoria, sempre da mesma casa da tarefa (RN13). */
	categoryId?: string | null;
	name: string;
	description?: string | null;
	frequency: number;
	frequencyUnit: FrequencyUnit;
	startDate: Date;
}

export interface MarkTaskAsCompletedData {
	taskId: string;
	userId: string;
	executedAt: Date;
	nextDueDate: Date;
}

export interface TaskExecutionWithAuthor {
	id: string;
	executedAt: Date;
	executedBy: {
		id: string;
		name: string;
	};
}

export interface TasksRepository {
	/** A tarefa nasce com `nextDueDate` igual a `startDate` (RN05). */
	create(data: CreateTaskData): Promise<Task>;
	findById(id: string): Promise<Task | null>;
	findManyByHouseholdId(householdId: string): Promise<Task[]>;
	save(task: Task): Promise<Task>;
	delete(id: string): Promise<void>;
	/**
	 * Transacional: registra a execução E avança a grade. Os dois estados
	 * mudam juntos ou nenhum muda.
	 */
	markAsCompleted(data: MarkTaskAsCompletedData): Promise<void>;
	findExecutionsByTaskId(taskId: string): Promise<TaskExecutionWithAuthor[]>;
}
