import { prisma } from "@/lib/prisma";
import type {
	FindMembershipParams,
	MembershipsRepository,
} from "@/repositories/memberships-repository";

export class PrismaMembershipsRepository implements MembershipsRepository {
	async findByUserIdAndHouseholdId({
		userId,
		householdId,
	}: FindMembershipParams) {
		return prisma.membership.findUnique({
			where: { userId_householdId: { userId, householdId } },
		});
	}

	async findManyByUserId(userId: string) {
		return prisma.membership.findMany({
			where: { userId },
			include: { household: true },
			orderBy: { createdAt: "asc" },
		});
	}
}
