import type { Category } from "@/generated/client/client";
import { prisma } from "@/lib/prisma";
import type {
	CategoriesRepository,
	CreateCategoryData,
	FindCategoryByNameParams,
} from "@/repositories/categories-repository";

export class PrismaCategoriesRepository implements CategoriesRepository {
	async create({ householdId, name }: CreateCategoryData) {
		return prisma.category.create({
			data: { householdId, name },
		});
	}

	async findById(id: string) {
		return prisma.category.findUnique({ where: { id } });
	}

	async findManyByHouseholdId(householdId: string) {
		return prisma.category.findMany({
			where: { householdId },
			orderBy: { name: "asc" },
		});
	}

	async findByHouseholdIdAndName({
		householdId,
		name,
	}: FindCategoryByNameParams) {
		return prisma.category.findUnique({
			where: { householdId_name: { householdId, name } },
		});
	}

	async save(category: Category) {
		return prisma.category.update({
			where: { id: category.id },
			data: { name: category.name },
		});
	}

	async delete(id: string) {
		// As tarefas ficam com `categoryId = null` pelo `onDelete: SetNull` do schema (RN14).
		await prisma.category.delete({ where: { id } });
	}
}
