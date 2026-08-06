import { z } from "zod";

const householdNameSchema = z
	.string()
	.trim()
	.min(2, "O nome da casa deve ter no mínimo 2 caracteres.")
	.max(120, "O nome da casa deve ter no máximo 120 caracteres.");

export const createHouseholdBodySchema = z.object({
	name: householdNameSchema,
});

export type CreateHouseholdBody = z.infer<typeof createHouseholdBodySchema>;

export const updateHouseholdBodySchema = z.object({
	name: householdNameSchema,
});

export type UpdateHouseholdBody = z.infer<typeof updateHouseholdBodySchema>;

export const householdParamsSchema = z.object({
	householdId: z.string().min(1),
});

export type HouseholdParams = z.infer<typeof householdParamsSchema>;

export const householdSchema = z.object({
	id: z.string(),
	name: z.string(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
});

export const createHouseholdResponseSchema = z.object({
	household: householdSchema,
});

export const updateHouseholdResponseSchema = z.object({
	household: householdSchema,
});

export const fetchUserHouseholdsResponseSchema = z.object({
	households: z.array(
		householdSchema.extend({
			role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
		}),
	),
});
