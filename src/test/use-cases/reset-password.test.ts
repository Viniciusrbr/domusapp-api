import { compare, hash } from "bcryptjs";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it } from "vitest";
import type { User } from "@/generated/client/client";
import { generateToken, hashToken } from "@/lib/token";
import { InMemoryPasswordResetTokensRepository } from "@/repositories/in-memory/in-memory-password-reset-tokens-repository";
import { InMemoryRefreshTokensRepository } from "@/repositories/in-memory/in-memory-refresh-tokens-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { InvalidPasswordError } from "@/use-cases/errors/invalid-password-error";
import { InvalidResetTokenError } from "@/use-cases/errors/invalid-reset-token-error";
import { ResetPasswordUseCase } from "@/use-cases/reset-password";

let usersRepository: InMemoryUsersRepository;
let passwordResetTokensRepository: InMemoryPasswordResetTokensRepository;
let refreshTokensRepository: InMemoryRefreshTokensRepository;
let sut: ResetPasswordUseCase;
let user: User;

const issueToken = async (expiresAt = dayjs().add(1, "hour").toDate()) => {
	const token = generateToken();

	const passwordResetToken = await passwordResetTokensRepository.create({
		userId: user.id,
		tokenHash: hashToken(token),
		expiresAt,
	});

	return { token, passwordResetToken };
};

describe("Reset Password Use Case", () => {
	beforeEach(async () => {
		usersRepository = new InMemoryUsersRepository();
		passwordResetTokensRepository = new InMemoryPasswordResetTokensRepository();
		refreshTokensRepository = new InMemoryRefreshTokensRepository();
		sut = new ResetPasswordUseCase(
			usersRepository,
			passwordResetTokensRepository,
			refreshTokensRepository,
		);

		user = await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			passwordHash: await hash("senha123", 6),
		});
	});

	it("should be able to reset the password with a valid token", async () => {
		const { token, passwordResetToken } = await issueToken();

		await sut.execute({ token, password: "novasenha1" });

		const updatedUser = await usersRepository.findById(user.id);

		await expect(
			compare("novasenha1", updatedUser?.passwordHash ?? ""),
		).resolves.toBe(true);

		const storedToken = passwordResetTokensRepository.items.find(
			(item) => item.id === passwordResetToken.id,
		);

		expect(storedToken?.usedAt).toEqual(expect.any(Date));
	});

	it("should revoke the active refresh tokens of the user", async () => {
		const { token } = await issueToken();

		const refreshToken = await refreshTokensRepository.create({
			userId: user.id,
			tokenHash: hashToken(generateToken()),
			expiresAt: dayjs().add(7, "day").toDate(),
		});

		await sut.execute({ token, password: "novasenha1" });

		const storedToken = refreshTokensRepository.items.find(
			(item) => item.id === refreshToken.id,
		);

		expect(storedToken?.revokedAt).toEqual(expect.any(Date));
	});

	it("should not be able to reset the password with an unknown token", async () => {
		await expect(() =>
			sut.execute({ token: generateToken(), password: "novasenha1" }),
		).rejects.toBeInstanceOf(InvalidResetTokenError);
	});

	it("should not be able to reset the password with an expired token", async () => {
		const { token } = await issueToken(dayjs().subtract(1, "minute").toDate());

		await expect(() =>
			sut.execute({ token, password: "novasenha1" }),
		).rejects.toBeInstanceOf(InvalidResetTokenError);
	});

	it("should not be able to reuse a token", async () => {
		const { token } = await issueToken();

		await sut.execute({ token, password: "novasenha1" });

		await expect(() =>
			sut.execute({ token, password: "outrasenha1" }),
		).rejects.toBeInstanceOf(InvalidResetTokenError);
	});

	it("should not be able to reset the password to a weak one", async () => {
		const { token } = await issueToken();

		await expect(() =>
			sut.execute({ token, password: "somenteletras" }),
		).rejects.toBeInstanceOf(InvalidPasswordError);
	});
});
