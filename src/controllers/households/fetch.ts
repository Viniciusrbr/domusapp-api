import type { FastifyReply, FastifyRequest } from "fastify";
import { makeFetchUserHouseholdsUseCase } from "@/use-cases/factories/make-fetch-user-households-use-case";

export async function fetch(request: FastifyRequest, reply: FastifyReply) {
	const fetchUserHouseholdsUseCase = makeFetchUserHouseholdsUseCase();

	const { households } = await fetchUserHouseholdsUseCase.execute({
		userId: request.user.sub,
	});

	return reply.status(200).send({
		households: households.map((household) => ({
			id: household.id,
			name: household.name,
			role: household.role,
			createdAt: household.createdAt.toISOString(),
			updatedAt: household.updatedAt.toISOString(),
		})),
	});
}
