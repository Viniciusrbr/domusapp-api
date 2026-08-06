export class CategoryAlreadyExistsError extends Error {
	constructor() {
		super("Category name already exists in this household.");
	}
}
