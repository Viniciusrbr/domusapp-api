import { compare, hash } from "bcryptjs";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryUsersRepository } from "@/repositories/in-memory/in-memory-users-repository";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";
import { InvalidPasswordError } from "@/use-cases/errors/invalid-password-error";
import { UserAlreadyExistsError } from "@/use-cases/errors/user-already-exists-error";
import { UpdateUserProfileUseCase } from "@/use-cases/update-user-profile";

let usersRepository: InMemoryUsersRepository;
let sut: UpdateUserProfileUseCase;

const createUser = async () =>
	usersRepository.create({
		name: "John Doe",
		email: "johndoe@example.com",
		passwordHash: await hash("senha123", 6),
	});

describe("Update User Profile Use Case", () => {
	beforeEach(() => {
		usersRepository = new InMemoryUsersRepository();
		sut = new UpdateUserProfileUseCase(usersRepository);
	});

	it("should be able to update the name and the email", async () => {
		const { id } = await createUser();

		const { user } = await sut.execute({
			userId: id,
			name: "John Doe Jr.",
			email: "john.jr@example.com",
		});

		expect(user.name).toEqual("John Doe Jr.");
		expect(user.email).toEqual("john.jr@example.com");
	});

	it("should not be able to update the email to one already in use", async () => {
		const { id } = await createUser();

		await usersRepository.create({
			name: "Jane Doe",
			email: "janedoe@example.com",
			passwordHash: await hash("senha123", 6),
		});

		await expect(() =>
			sut.execute({ userId: id, email: "janedoe@example.com" }),
		).rejects.toBeInstanceOf(UserAlreadyExistsError);
	});

	it("should be able to keep its own email untouched", async () => {
		const { id } = await createUser();

		const { user } = await sut.execute({
			userId: id,
			email: "johndoe@example.com",
		});

		expect(user.email).toEqual("johndoe@example.com");
	});

	it("should be able to change the password with the correct current password", async () => {
		const { id } = await createUser();

		const { user } = await sut.execute({
			userId: id,
			password: "novasenha1",
			currentPassword: "senha123",
		});

		await expect(compare("novasenha1", user.passwordHash)).resolves.toBe(true);
	});

	it("should not be able to change the password without the current password", async () => {
		const { id } = await createUser();

		await expect(() =>
			sut.execute({ userId: id, password: "novasenha1" }),
		).rejects.toBeInstanceOf(InvalidCredentialsError);
	});

	it("should not be able to change the password with a wrong current password", async () => {
		const { id } = await createUser();

		await expect(() =>
			sut.execute({
				userId: id,
				password: "novasenha1",
				currentPassword: "senha-errada1",
			}),
		).rejects.toBeInstanceOf(InvalidCredentialsError);
	});

	it("should not be able to change the password to a weak one", async () => {
		const { id } = await createUser();

		await expect(() =>
			sut.execute({
				userId: id,
				password: "somenteletras",
				currentPassword: "senha123",
			}),
		).rejects.toBeInstanceOf(InvalidPasswordError);
	});
});
