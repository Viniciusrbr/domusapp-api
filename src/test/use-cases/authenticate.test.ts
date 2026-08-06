import { hash } from "bcryptjs";
import { beforeEach, describe, expect, it } from "vitest";
import { hashToken } from "@/lib/token";
import { InMemoryRefreshTokensRepository } from "@/repositories/in-memory/in-memory-refresh-tokens-repository";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { AuthenticateUseCase } from "@/use-cases/authenticate";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";
import { FakeAuthTokenIssuer } from "@/utils/test/fake-auth-token-issuer";

let usersRepository: InMemoryUsersRepository;
let refreshTokensRepository: InMemoryRefreshTokensRepository;
let sut: AuthenticateUseCase;

describe("Authenticate Use Case", () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		refreshTokensRepository = new InMemoryRefreshTokensRepository();
		sut = new AuthenticateUseCase(
			usersRepository,
			refreshTokensRepository,
			new FakeAuthTokenIssuer(),
		);
	});

	it("should be able to authenticate", async () => {
		await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			passwordHash: await hash("senha123", 6),
		});

		const { user, token, refreshToken } = await sut.execute({
			email: "johndoe@example.com",
			password: "senha123",
		});

		expect(user.id).toEqual(expect.any(String));
		expect(token).toEqual(expect.any(String));
		expect(refreshToken).toEqual(expect.any(String));
	});

	it("should persist the hash of the issued refresh token", async () => {
		await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			passwordHash: await hash("senha123", 6),
		});

		const { user, refreshToken } = await sut.execute({
			email: "johndoe@example.com",
			password: "senha123",
		});

		const storedToken = await refreshTokensRepository.findByTokenHash(
			hashToken(refreshToken),
		);

		expect(storedToken).toEqual(
			expect.objectContaining({ userId: user.id, revokedAt: null }),
		);
	});

	it("should not be able to authenticate with a wrong email", async () => {
		await expect(() =>
			sut.execute({ email: "johndoe@example.com", password: "senha123" }),
		).rejects.toBeInstanceOf(InvalidCredentialsError);
	});

	it("should not be able to authenticate with a wrong password", async () => {
		await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			passwordHash: await hash("senha123", 6),
		});

		await expect(() =>
			sut.execute({ email: "johndoe@example.com", password: "senha-errada1" }),
		).rejects.toBeInstanceOf(InvalidCredentialsError);
	});
});
