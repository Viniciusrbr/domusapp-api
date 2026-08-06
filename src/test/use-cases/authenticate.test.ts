import { hash } from "bcryptjs";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { AuthenticateUseCase } from "@/use-cases/authenticate";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";

let usersRepository: InMemoryUsersRepository;
let sut: AuthenticateUseCase;

describe("Authenticate Use Case", () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		sut = new AuthenticateUseCase(usersRepository);
	});

	it("should be able to authenticate", async () => {
		await usersRepository.create({
			name: "John Doe",
			email: "johndoe@example.com",
			passwordHash: await hash("senha123", 6),
		});

		const { user } = await sut.execute({
			email: "johndoe@example.com",
			password: "senha123",
		});

		expect(user.id).toEqual(expect.any(String));
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
