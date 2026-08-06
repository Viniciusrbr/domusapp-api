import type { FastifyReply, FastifyRequest } from "fastify";
import { toCategoryResponse } from "@/controllers/categories/presenter";
import type {
	CategoryParams,
	UpdateCategoryBody,
} from "@/controllers/categories/schemas";
import { CategoryAlreadyExistsError } from "@/use-cases/errors/category-already-exists-error";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { makeUpdateCategoryUseCase } from "@/use-cases/factories/make-update-category-use-case";

export async function update(
	request: FastifyRequest<{
		Params: CategoryParams;
		Body: UpdateCategoryBody;
	}>,
	reply: FastifyReply,
) {
	const { categoryId } = request.params;
	const { name } = request.body;

	try {
		const updateCategoryUseCase = makeUpdateCategoryUseCase();

		const { category } = await updateCategoryUseCase.execute({
			categoryId,
			userId: request.user.sub,
			name,
		});

		return reply.status(200).send({ category: toCategoryResponse(category) });
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
