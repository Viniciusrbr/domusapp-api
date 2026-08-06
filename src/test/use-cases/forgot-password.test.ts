import { hash } from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mailer } from "@/lib/mailer";
import { hashToken } from "@/lib/token";
import { InMemoryPasswordResetTokensRepository } from "@/repositories/in-memory/in-memory-password-reset-tokens-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { ForgotPasswordUseCase } from "@/use-cases/forgot-password";

let usersRepository: InMemoryUsersRepository;
let passwordResetTokensRepository: InMemoryPasswordResetTokensRepository;
let mailer: Mailer;
let sut: ForgotPasswordUseCase;

const RESET_LINK_BASE_URL = "http://localhost:3000/reset-password";

describe("Forgot Password Use Case", () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		passwordResetTokensRepository = new InMemoryPasswordResetTokensRepository();
		mailer = { sendPasswordReset: vi.fn() };
		sut = new ForgotPasswordUseCase(
			usersRepository,
			passwordResetTokensRepository,
			mailer,
			RESET_LINK_BASE_URL,
		);
	});

	it("should be able to create a reset token and send the email", async () => {
		await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			passwordHash: await hash("senha123", 6),
		});

		await sut.execute({ email: "johndoe@example.com" });

		expect(passwordResetTokensRepository.items).toHaveLength(1);
		expect(mailer.sendPasswordReset).toHaveBeenCalledTimes(1);
	});

	it("should send a link whose token matches the stored hash", async () => {
		await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			passwordHash: await hash("senha123", 6),
		});

		await sut.execute({ email: "johndoe@example.com" });

		expect(mailer.sendPasswordReset).toHaveBeenCalledWith({
			to: "johndoe@example.com",
			link: expect.stringContaining(`${RESET_LINK_BASE_URL}?token=`),
		});

		const [{ link }] = vi.mocked(mailer.sendPasswordReset).mock.calls[0];
		const token = new URL(link).searchParams.get("token") ?? "";

		// O token em texto puro NUNCA é persistido — só o seu hash.
		expect(passwordResetTokensRepository.items[0].tokenHash).toEqual(
			hashToken(token),
		);
		expect(passwordResetTokensRepository.items[0].tokenHash).not.toEqual(token);
	});

	it("should not leak whether the email exists", async () => {
		await expect(
			sut.execute({ email: "inexistente@example.com" }),
		).resolves.toBeUndefined();

		expect(passwordResetTokensRepository.items).toHaveLength(0);
		expect(mailer.sendPasswordReset).not.toHaveBeenCalled();
	});
});
