import { z } from "zod";
import {
	PASSWORD_LETTER_REGEX,
	PASSWORD_MIN_LENGTH,
	PASSWORD_NUMBER_REGEX,
} from "@/lib/password-policy";

// RN24
const passwordSchema = z
	.string()
	.min(
		PASSWORD_MIN_LENGTH,
		`A senha deve ter no mínimo ${PASSWORD_MIN_LENGTH} caracteres.`,
	)
	.regex(PASSWORD_LETTER_REGEX, "A senha deve conter ao menos uma letra.")
	.regex(PASSWORD_NUMBER_REGEX, "A senha deve conter ao menos um número.");

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

// O novo refresh token volta no cookie httpOnly; o corpo carrega só o access token.
export const refreshTokenResponseSchema = z.object({
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

export const updateUserProfileBodySchema = z
	.object({
		name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres."),
		email: z.email("E-mail inválido."),
		password: passwordSchema,
		currentPassword: z.string().min(1, "A senha atual é obrigatória."),
	})
	.partial()
	.refine((body) => Object.keys(body).length > 0, {
		message: "Informe ao menos um campo para atualizar.",
	})
	// Trocar a senha exige reautenticação com a senha atual.
	.refine((body) => !body.password || Boolean(body.currentPassword), {
		message: "A senha atual é obrigatória para definir uma nova senha.",
		path: ["currentPassword"],
	});

export type UpdateUserProfileBody = z.infer<typeof updateUserProfileBodySchema>;

export const updateUserProfileResponseSchema = z.object({
	user: z.object({
		id: z.string(),
		name: z.string(),
		email: z.email(),
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime(),
	}),
});

export const forgotPasswordBodySchema = z.object({
	email: z.email("E-mail inválido."),
});

export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;

export const resetPasswordBodySchema = z.object({
	token: z.string().min(1, "O token é obrigatório."),
	password: passwordSchema,
});

export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
