import { hash } from "bcryptjs";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it } from "vitest";
import type { User } from "@/generated/client/client";
import { hashToken } from "@/lib/token";
import { InMemoryRefreshTokensRepository } from "@/repositories/in-memory/in-memory-refresh-tokens-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { UnauthorizedError } from "@/use-cases/errors/unauthorized-error";
import { RefreshTokenUseCase } from "@/use-cases/refresh-token";
import { FakeAuthTokenIssuer } from "@/utils/test/fake-auth-token-issuer";

let usersRepository: InMemoryUsersRepository;
let refreshTokensRepository: InMemoryRefreshTokensRepository;
let sut: RefreshTokenUseCase;
let user: User;

const issueRefreshToken = async (
	expiresAt = dayjs().add(7, "day").toDate(),
) => {
	const token = `refresh-${user.id}-${refreshTokensRepository.items.length}`;

	const refreshToken = await refreshTokensRepository.create({
		userId: user.id,
		tokenHash: hashToken(token),
		expiresAt,
	});

	return { token, refreshToken };
};

describe("Refresh Token Use Case", () => {
	beforeEach(async () => {
		usersRepository = new InMemoryUsersRepository();
		refreshTokensRepository = new InMemoryRefreshTokensRepository();
		sut = new RefreshTokenUseCase(
			usersRepository,
			refreshTokensRepository,
			new FakeAuthTokenIssuer(),
		);

		user = await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			passwordHash: await hash("senha123", 6),
		});
	});

	it("should be able to issue a new token pair with a valid refresh token", async () => {
		const { token } = await issueRefreshToken();

		const tokens = await sut.execute({ refreshToken: token, userId: user.id });

		expect(tokens.token).toEqual(expect.any(String));
		expect(tokens.refreshToken).toEqual(expect.any(String));
		expect(tokens.refreshToken).not.toEqual(token);
	});

	it("should persist only the hash of the rotated refresh token", async () => {
		const { token } = await issueRefreshToken();

		const tokens = await sut.execute({ refreshToken: token, userId: user.id });

		const storedToken = await refreshTokensRepository.findByTokenHash(
			hashToken(tokens.refreshToken),
		);

		expect(storedToken).toEqual(
			expect.objectContaining({ userId: user.id, revokedAt: null }),
		);
		expect(
			refreshTokensRepository.items.some(
				(item) => item.tokenHash === tokens.refreshToken,
			),
		).toBe(false);
	});

	it("should revoke the previous refresh token when rotating", async () => {
		const { token, refreshToken } = await issueRefreshToken();

		await sut.execute({ refreshToken: token, userId: user.id });

		const previousToken = refreshTokensRepository.items.find(
			(item) => item.id === refreshToken.id,
		);

		expect(previousToken?.revokedAt).toEqual(expect.any(Date));
	});

	it("should not be able to reuse a rotated refresh token", async () => {
		const { token } = await issueRefreshToken();

		await sut.execute({ refreshToken: token, userId: user.id });

		await expect(() =>
			sut.execute({ refreshToken: token, userId: user.id }),
		).rejects.toBeInstanceOf(UnauthorizedError);
	});

	it("should revoke every refresh token of the user when a revoked one is reused", async () => {
		const { token } = await issueRefreshToken();

		const { refreshToken: rotatedToken } = await sut.execute({
			refreshToken: token,
			userId: user.id,
		});

		// Reuso do token antigo: sinal de vazamento, derruba a família inteira.
		await expect(() =>
			sut.execute({ refreshToken: token, userId: user.id }),
		).rejects.toBeInstanceOf(UnauthorizedError);

		const stillActive = await refreshTokensRepository.findByTokenHash(
			hashToken(rotatedToken),
		);

		expect(stillActive?.revokedAt).toEqual(expect.any(Date));
		expect(
			refreshTokensRepository.items.every((item) => item.revokedAt !== null),
		).toBe(true);
	});

	it("should not be able to refresh with an unknown refresh token", async () => {
		await expect(() =>
			sut.execute({ refreshToken: "does-not-exist", userId: user.id }),
		).rejects.toBeInstanceOf(UnauthorizedError);
	});

	it("should not be able to refresh with an expired refresh token", async () => {
		const { token } = await issueRefreshToken(
			dayjs().subtract(1, "minute").toDate(),
		);

		await expect(() =>
			sut.execute({ refreshToken: token, userId: user.id }),
		).rejects.toBeInstanceOf(UnauthorizedError);
	});

	it("should not be able to refresh a token that belongs to another user", async () => {
		const { token } = await issueRefreshToken();

		const otherUser = await usersRepository.create({
			name: "Jane Doe",
			email: "janedoe@example.com",
			passwordHash: await hash("senha123", 6),
		});

		await expect(() =>
			sut.execute({ refreshToken: token, userId: otherUser.id }),
		).rejects.toBeInstanceOf(UnauthorizedError);
	});
});
