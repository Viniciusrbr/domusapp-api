import { randomUUID } from "node:crypto";
import type { AuthTokenIssuer } from "@/lib/auth-tokens";

// Substitui a assinatura JWT nos testes de use case: só precisa devolver
// strings únicas por emissão para que a rotação seja observável.
export class FakeAuthTokenIssuer implements AuthTokenIssuer {
	async issue(userId: string) {
		return {
			token: `access-${userId}-${randomUUID()}`,
			refreshToken: `refresh-${userId}-${randomUUID()}`,
		};
	}
}
