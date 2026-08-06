import type { Category } from "@/generated/client/client";

export interface CreateCategoryData {
	householdId: string;
	name: string;
}

export interface FindCategoryByNameParams {
	householdId: string;
	name: string;
}

export interface CategoriesRepository {
	create(data: CreateCategoryData): Promise<Category>;
	findById(id: string): Promise<Category | null>;
	findManyByHouseholdId(householdId: string): Promise<Category[]>;
	/** Base da unicidade por casa (RN12): mesmo nome em casas diferentes coexiste. */
	findByHouseholdIdAndName(
		params: FindCategoryByNameParams,
	): Promise<Category | null>;
	save(category: Category): Promise<Category>;
	/** As tarefas que a usavam ficam com `categoryId = null` (RN14). */
	delete(id: string): Promise<void>;
}
