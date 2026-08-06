import type { FastifyReply, FastifyRequest } from "fastify";
import type {
	HouseholdParams,
	UpdateHouseholdBody,
} from "@/controllers/households/schemas";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { makeUpdateHouseholdUseCase } from "@/use-cases/factories/make-update-household-use-case";

export async function update(
	request: FastifyRequest<{
		Params: HouseholdParams;
		Body: UpdateHouseholdBody;
	}>,
	reply: FastifyReply,
) {
	const { householdId } = request.params;
	const { name } = request.body;

	try {
		const updateHouseholdUseCase = makeUpdateHouseholdUseCase();

		const { household } = await updateHouseholdUseCase.execute({
			householdId,
			userId: request.user.sub,
			name,
		});

		return reply.status(200).send({
			household: {
				id: household.id,
				name: household.name,
				createdAt: household.createdAt.toISOString(),
				updatedAt: household.updatedAt.toISOString(),
			},
		});
	} catch (error) {
		if (error instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: error.message });
		}

		throw error;
	}
}
