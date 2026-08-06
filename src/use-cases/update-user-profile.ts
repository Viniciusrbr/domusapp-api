import { compare, hash } from "bcryptjs";
import type { User } from "@/generated/client/client";
import { isStrongPassword } from "@/lib/password-policy";
import type { UsersRepository } from "@/repositories/users-repository";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";
import { InvalidPasswordError } from "@/use-cases/errors/invalid-password-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { UserAlreadyExistsError } from "@/use-cases/errors/user-already-exists-error";

interface UpdateUserProfileUseCaseRequest {
	userId: string;
	name?: string;
	email?: string;
	password?: string;
	currentPassword?: string;
}

interface UpdateUserProfileUseCaseResponse {
	user: User;
}

export class UpdateUserProfileUseCase {
	constructor(private usersRepository: UsersRepository) {}

	async execute({
		userId,
		name,
		email,
		password,
		currentPassword,
	}: UpdateUserProfileUseCaseRequest): Promise<UpdateUserProfileUseCaseResponse> {
		const user = await this.usersRepository.findById(userId);

		if (!user) {
			throw new ResourceNotFoundError();
		}

		// RN25: e-mail é único no sistema.
		if (email && email !== user.email) {
			const userWithSameEmail = await this.usersRepository.findByEmail(email);

			if (userWithSameEmail && userWithSameEmail.id !== user.id) {
				throw new UserAlreadyExistsError();
			}

			user.email = email;
		}

		if (name) {
			user.name = name;
		}

		if (password) {
			// Trocar a senha exige reautenticação com a senha atual.
			if (!currentPassword) {
				throw new InvalidCredentialsError();
			}

			const doesPasswordMatch = await compare(
				currentPassword,
				user.passwordHash,
			);

			if (!doesPasswordMatch) {
				throw new InvalidCredentialsError();
			}

			// RN24
			if (!isStrongPassword(password)) {
				throw new InvalidPasswordError();
			}

			user.passwordHash = await hash(password, 6);
		}

		const updatedUser = await this.usersRepository.save(user);

		return { user: updatedUser };
	}
}
