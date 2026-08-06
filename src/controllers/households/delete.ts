import type { FastifyReply, FastifyRequest } from "fastify";
import type { HouseholdParams } from "@/controllers/households/schemas";
import { NotAllowedError } from "@/use-cases/errors/not-allowed-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { makeDeleteHouseholdUseCase } from "@/use-cases/factories/make-delete-household-use-case";

export async function remove(
	request: FastifyRequest<{ Params: HouseholdParams }>,
	reply: FastifyReply,
) {
	const { householdId } = request.params;

	try {
		const deleteHouseholdUseCase = makeDeleteHouseholdUseCase();

		await deleteHouseholdUseCase.execute({
			householdId,
			userId: request.user.sub,
		});

		return reply.status(204).send();
	} catch (error) {
		if (error instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: error.message });
		}

		if (error instanceof NotAllowedError) {
			return reply.status(403).send({ message: error.message });
		}

		throw error;
	}
}
