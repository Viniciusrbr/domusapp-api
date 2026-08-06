import type { FastifyReply, FastifyRequest } from "fastify";
import { toCategoryResponse } from "@/controllers/categories/presenter";
import type { HouseholdCategoriesParams } from "@/controllers/categories/schemas";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { makeFetchHouseholdCategoriesUseCase } from "@/use-cases/factories/make-fetch-household-categories-use-case";

export async function fetch(
	request: FastifyRequest<{ Params: HouseholdCategoriesParams }>,
	reply: FastifyReply,
) {
	const { householdId } = request.params;

	try {
		const fetchHouseholdCategoriesUseCase =
			makeFetchHouseholdCategoriesUseCase();

		const { categories } = await fetchHouseholdCategoriesUseCase.execute({
			householdId,
			userId: request.user.sub,
		});

		return reply
			.status(200)
			.send({ categories: categories.map(toCategoryResponse) });
	} catch (error) {
		if (error instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: error.message });
		}

		throw error;
	}
}
