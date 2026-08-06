import type { FastifyReply, FastifyRequest } from "fastify";
import { toCategoryResponse } from "@/controllers/categories/presenter";
import type {
	CreateCategoryBody,
	HouseholdCategoriesParams,
} from "@/controllers/categories/schemas";
import { CategoryAlreadyExistsError } from "@/use-cases/errors/category-already-exists-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { makeCreateCategoryUseCase } from "@/use-cases/factories/make-create-category-use-case";

export async function create(
	request: FastifyRequest<{
		Params: HouseholdCategoriesParams;
		Body: CreateCategoryBody;
	}>,
	reply: FastifyReply,
) {
	const { householdId } = request.params;
	const { name } = request.body;

	try {
		const createCategoryUseCase = makeCreateCategoryUseCase();

		const { category } = await createCategoryUseCase.execute({
			householdId,
			userId: request.user.sub,
			name,
		});

		return reply.status(201).send({ category: toCategoryResponse(category) });
	} catch (error) {
		if (error instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: error.message });
		}

		if (error instanceof CategoryAlreadyExistsError) {
			return reply.status(409).send({ message: error.message });
		}

		throw error;
	}
}
