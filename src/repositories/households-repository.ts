import type { Household } from "@/generated/client/client";

export interface CreateHouseholdData {
	name: string;
	ownerId: string;
}

export interface HouseholdsRepository {
	create(data: CreateHouseholdData): Promise<Household>;
	findById(id: string): Promise<Household | null>;
	save(household: Household): Promise<Household>;
	delete(id: string): Promise<void>;
}
