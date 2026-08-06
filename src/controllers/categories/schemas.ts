import { z } from "zod";

// RN12: 2–60 caracteres, obrigatório.
const categoryNameSchema = z
	.string()
	.trim()
	.min(2, "O nome da categoria deve ter no mínimo 2 caracteres.")
	.max(60, "O nome da categoria deve ter no máximo 60 caracteres.");

export const createCategoryBodySchema = z.object({
	name: categoryNameSchema,
});

export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>;

export const updateCategoryBodySchema = z.object({
	name: categoryNameSchema,
});

export type UpdateCategoryBody = z.infer<typeof updateCategoryBodySchema>;

export const householdCategoriesParamsSchema = z.object({
	householdId: z.string().min(1),
});

export type HouseholdCategoriesParams = z.infer<
	typeof householdCategoriesParamsSchema
>;

export const categoryParamsSchema = z.object({
	categoryId: z.string().min(1),
});

export type CategoryParams = z.infer<typeof categoryParamsSchema>;

export const categorySchema = z.object({
	id: z.string(),
	householdId: z.string(),
	name: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const createCategoryResponseSchema = z.object({
	category: categorySchema,
});

export const updateCategoryResponseSchema = z.object({
	category: categorySchema,
});

export const fetchHouseholdCategoriesResponseSchema = z.object({
	categories: z.array(categorySchema),
});
