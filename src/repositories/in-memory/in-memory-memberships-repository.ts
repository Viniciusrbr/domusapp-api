import type { Household, Membership } from "@/generated/client/client";
import type {
	FindMembershipParams,
	MembershipsRepository,
} from "@/repositories/memberships-repository";

export class InMemoryMembershipsRepository implements MembershipsRepository {
	public items: Membership[] = [];

	/**
	 * Store das casas, compartilhado por referência com o
	 * InMemoryHouseholdsRepository — assim o `include: { household: true }`
	 * do Prisma tem equivalente aqui.
	 */
	constructor(public households: Household[] = []) {}

	async findByUserIdAndHouseholdId({
		userId,
		householdId,
	}: FindMembershipParams) {
		const membership = this.items.find(
			(item) => item.userId === userId && item.householdId === householdId,
		);

		return membership ?? null;
	}

	async findManyByUserId(userId: string) {
		return this.items
			.filter((item) => item.userId === userId)
			.flatMap((membership) => {
				const household = this.households.find(
					(item) => item.id === membership.householdId,
				);

				return household ? [{ ...membership, household }] : [];
			});
	}
}
