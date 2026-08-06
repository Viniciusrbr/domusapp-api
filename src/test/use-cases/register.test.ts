import { compare } from "bcryptjs";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { UserAlreadyExistsError } from "@/use-cases/errors/user-already-exists-error";
import { RegisterUseCase } from "@/use-cases/register";

let usersRepository: InMemoryUsersRepository;
let sut: RegisterUseCase;

describe("Register Use Case", () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		sut = new RegisterUseCase(usersRepository);
	});

	it("should be able to register", async () => {
		const { user } = await sut.execute({
			name: "John Doe",
			email: "johndoe@example.com",
			password: "senha123",
		});

		expect(user.id).toEqual(expect.any(String));
	});

	it("should hash the user password upon registration", async () => {
		const { user } = await sut.execute({
			name: "John Doe",
			email: "johndoe@example.com",
			password: "senha123",
		});

		const isPasswordCorrectlyHashed = await compare(
			"senha123",
			user.passwordHash,
		);

		expect(isPasswordCorrectlyHashed).toBe(true);
	});

	it("should not be able to register with the same email twice", async () => {
		const email = "johndoe@example.com";

		await sut.execute({ name: "John Doe", email, password: "senha123" });

		await expect(() =>
			sut.execute({ name: "John Doe", email, password: "senha123" }),
		).rejects.toBeInstanceOf(UserAlreadyExistsError);
	});
});
