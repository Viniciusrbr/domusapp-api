import type { Household } from "@/generated/client/client";
import { prisma } from "@/lib/prisma";
import type {
	CreateHouseholdData,
	HouseholdsRepository,
} from "@/repositories/households-repository";

export class PrismaHouseholdsRepository implements HouseholdsRepository {
	async create({ name, ownerId }: CreateHouseholdData) {
		return prisma.$transaction(async (tx) => {
			const household = await tx.household.create({ data: { name } });

			await tx.membership.create({
				data: {
					userId: ownerId,
					householdId: household.id,
					role: "OWNER",
				},
			});

			return household;
		});
	}

	async findById(id: string) {
		return prisma.household.findUnique({ where: { id } });
	}

	async save(household: Household) {
		return prisma.household.update({
			where: { id: household.id },
			data: { name: household.name },
		});
	}

	async delete(id: string) {
		await prisma.household.delete({ where: { id } });
	}
}
