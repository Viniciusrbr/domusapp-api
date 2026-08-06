export class InvalidFrequencyError extends Error {
	constructor() {
		super("Frequency must be an integer greater than or equal to 1.");
	}
}
