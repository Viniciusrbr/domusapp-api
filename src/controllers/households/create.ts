import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreateHouseholdBody } from "@/controllers/households/schemas";
import { makeCreateHouseholdUseCase } from "@/use-cases/factories/make-create-household-use-case";

export async function create(
	request: FastifyRequest<{ Body: CreateHouseholdBody }>,
	reply: FastifyReply,
) {
	const { name } = request.body;

	const createHouseholdUseCase = makeCreateHouseholdUseCase();

	const { household } = await createHouseholdUseCase.execute({
		name,
		userId: request.user.sub,
	});

	return reply.status(201).send({
		household: {
			id: household.id,
			name: household.name,
			createdAt: household.createdAt.toISOString(),
			updatedAt: household.updatedAt.toISOString(),
		},
	});
}
