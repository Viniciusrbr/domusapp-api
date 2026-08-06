import { compare } from "bcryptjs";
import type { User } from "@/generated/client/client";
import {
	type AuthTokenIssuer,
	type AuthTokens,
	refreshTokenExpiresAt,
} from "@/lib/auth-tokens";
import { hashToken } from "@/lib/token";
import type { RefreshTokensRepository } from "@/repositories/refresh-tokens-repository";
import type { UsersRepository } from "@/repositories/users-repository";
import { InvalidCredentialsError } from "@/use-cases/errors/invalid-credentials-error";

interface AuthenticateUseCaseRequest {
	email: string;
	password: string;
}

interface AuthenticateUseCaseResponse extends AuthTokens {
	user: User;
}

export class AuthenticateUseCase {
	constructor(
		private usersRepository: UsersRepository,
		private refreshTokensRepository: RefreshTokensRepository,
		private tokenIssuer: AuthTokenIssuer,
	) {}

	async execute({
		email,
		password,
	}: AuthenticateUseCaseRequest): Promise<AuthenticateUseCaseResponse> {
		const user = await this.usersRepository.findByEmail(email);

		if (!user) {
			throw new InvalidCredentialsError();
		}

		const doesPasswordMatch = await compare(password, user.passwordHash);

		if (!doesPasswordMatch) {
			throw new InvalidCredentialsError();
		}

		const { token, refreshToken } = await this.tokenIssuer.issue(user.id);

		// Persistido pelo HASH, nunca em texto puro (RNF07/RNF08).
		await this.refreshTokensRepository.create({
			userId: user.id,
			tokenHash: hashToken(refreshToken),
			expiresAt: refreshTokenExpiresAt(),
		});

		return { user, token, refreshToken };
	}
}
