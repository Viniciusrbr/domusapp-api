import type { Household, Membership } from "@/generated/client/client";

export interface MembershipWithHousehold extends Membership {
	household: Household;
}

export interface FindMembershipParams {
	userId: string;
	householdId: string;
}

export interface MembershipsRepository {
	findByUserIdAndHouseholdId(
		params: FindMembershipParams,
	): Promise<Membership | null>;
	findManyByUserId(userId: string): Promise<MembershipWithHousehold[]>;
}
