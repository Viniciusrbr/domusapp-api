import type { FastifyReply, FastifyRequest } from "fastify";
import type { CategoryParams } from "@/controllers/categories/schemas";
import { ResourceNotFoundError } from "@/use-cases/errors/resource-not-found-error";
import { makeDeleteCategoryUseCase } from "@/use-cases/factories/make-delete-category-use-case";

export async function remove(
	request: FastifyRequest<{ Params: CategoryParams }>,
	reply: FastifyReply,
) {
	const { categoryId } = request.params;

	try {
		const deleteCategoryUseCase = makeDeleteCategoryUseCase();

		await deleteCategoryUseCase.execute({
			categoryId,
			userId: request.user.sub,
		});

		return reply.status(204).send();
	} catch (error) {
		if (error instanceof ResourceNotFoundError) {
			return reply.status(404).send({ message: error.message });
		}

		throw error;
	}
}
