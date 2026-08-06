import type { z } from "zod";
import type { categorySchema } from "@/controllers/categories/schemas";
import type { Category } from "@/generated/client/client";

type CategoryResponse = z.infer<typeof categorySchema>;

export const toCategoryResponse = (category: Category): CategoryResponse => ({
	id: category.id,
	householdId: category.householdId,
	name: category.name,
	createdAt: category.createdAt.toISOString(),
	updatedAt: category.updatedAt.toISOString(),
});
