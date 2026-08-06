import dayjs from "dayjs";
import { beforeEach, describe, expect, it } from "vitest";
import { hashToken } from "@/lib/token";
import { InMemoryRefreshTokensRepository } from "@/repositories/in-memory/in-memory-refresh-tokens-repository";
import { LogoutUseCase } from "@/use-cases/logout";

let refreshTokensRepository: InMemoryRefreshTokensRepository;
let sut: LogoutUseCase;

const issueRefreshToken = async (token: string) =>
	refreshTokensRepository.create({
		userId: "user-01",
		tokenHash: hashToken(token),
		expiresAt: dayjs().add(7, "day").toDate(),
	});

describe("Logout Use Case", () => {
	beforeEach(() => {
		refreshTokensRepository = new InMemoryRefreshTokensRepository();
		sut = new LogoutUseCase(refreshTokensRepository);
	});

	it("should be able to revoke the current refresh token", async () => {
		const refreshToken = await issueRefreshToken("refresh-01");

		await sut.execute({ refreshToken: "refresh-01" });

		const storedToken = refreshTokensRepository.items.find(
			(item) => item.id === refreshToken.id,
		);

		expect(storedToken?.revokedAt).toEqual(expect.any(Date));
	});

	it("should keep other sessions of the user active", async () => {
		await issueRefreshToken("refresh-01");
		const otherSession = await issueRefreshToken("refresh-02");

		await sut.execute({ refreshToken: "refresh-01" });

		const storedToken = refreshTokensRepository.items.find(
			(item) => item.id === otherSession.id,
		);

		expect(storedToken?.revokedAt).toBeNull();
	});

	it("should not fail when the refresh token is unknown", async () => {
		await expect(
			sut.execute({ refreshToken: "does-not-exist" }),
		).resolves.toBeUndefined();
	});

	it("should not fail when the refresh token was already revoked", async () => {
		const refreshToken = await issueRefreshToken("refresh-01");

		await sut.execute({ refreshToken: "refresh-01" });
		const revokedAt = refreshTokensRepository.items.find(
			(item) => item.id === refreshToken.id,
		)?.revokedAt;

		await sut.execute({ refreshToken: "refresh-01" });

		const storedToken = refreshTokensRepository.items.find(
			(item) => item.id === refreshToken.id,
		);

		expect(storedToken?.revokedAt).toEqual(revokedAt);
	});
});
