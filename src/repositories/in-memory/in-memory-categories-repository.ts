import { randomUUID } from "node:crypto";
import type { Category } from "@/generated/client/client";
import type {
	CategoriesRepository,
	CreateCategoryData,
	FindCategoryByNameParams,
} from "@/repositories/categories-repository";
import type { InMemoryTasksRepository } from "@/repositories/in-memory/in-memory-tasks-repository";

export class InMemoryCategoriesRepository implements CategoriesRepository {
	public items: Category[] = [];

	/**
	 * O repositório de tarefas é usado só para reproduzir o `onDelete: SetNull`
	 * do schema ao excluir uma categoria (RN14).
	 */
	constructor(private tasksRepository: InMemoryTasksRepository) {}

	async create({ householdId, name }: CreateCategoryData) {
		const category: Category = {
			id: randomUUID(),
			householdId,
			name,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		this.items.push(category);

		return category;
	}

	async findById(id: string) {
		const category = this.items.find((item) => item.id === id);

		return category ?? null;
	}

	async findManyByHouseholdId(householdId: string) {
		return this.items
			.filter((item) => item.householdId === householdId)
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	async findByHouseholdIdAndName({
		householdId,
		name,
	}: FindCategoryByNameParams) {
		const category = this.items.find(
			(item) => item.householdId === householdId && item.name === name,
		);

		return category ?? null;
	}

	async save(category: Category) {
		const index = this.items.findIndex((item) => item.id === category.id);

		if (index >= 0) {
			this.items[index] = category;
		}

		return category;
	}

	async delete(id: string) {
		const index = this.items.findIndex((item) => item.id === id);

		if (index >= 0) {
			this.items.splice(index, 1);
		}

		// SetNull equivalente ao do banco: a tarefa fica sem categoria, não some (RN14).
		this.tasksRepository.items = this.tasksRepository.items.map((task) =>
			task.categoryId === id ? { ...task, categoryId: null } : task,
		);
	}
}
