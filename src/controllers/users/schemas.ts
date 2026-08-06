import { z } from "zod";

const passwordSchema = z
	.string()
	.min(8, "A senha deve ter no mínimo 8 caracteres.")
	.regex(/[a-zA-Z]/, "A senha deve conter ao menos uma letra.")
	.regex(/[0-9]/, "A senha deve conter ao menos um número.");

export const registerBodySchema = z.object({
	name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres."),
	email: z.email("E-mail inválido."),
	password: passwordSchema,
});

export type RegisterBody = z.infer<typeof registerBodySchema>;

export const authenticateBodySchema = z.object({
	email: z.email("E-mail inválido."),
	password: z.string().min(1, "A senha é obrigatória."),
});

export type AuthenticateBody = z.infer<typeof authenticateBodySchema>;

export const authenticateResponseSchema = z.object({
	token: z.string(),
});

export const messageResponseSchema = z.object({
	message: z.string(),
});

export const userProfileResponseSchema = z.object({
	user: z.object({
		id: z.string(),
		name: z.string(),
		email: z.email(),
		createdAt: z.iso.datetime(),
	}),
});
