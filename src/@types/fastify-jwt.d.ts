import "@fastify/jwt";

declare module "@fastify/jwt" {
	interface FastifyJWT {
		// `sub` é o id do usuário, assinado no login (reply.jwtSign).
		user: {
			sub: string;
		};
	}
}
