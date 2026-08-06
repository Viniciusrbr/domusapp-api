import { describe, expect, it } from "vitest";
import {
	computeNextDueDate,
	formatDateOnly,
	parseDateOnly,
} from "@/lib/recurrence";

const nextDueDateFrom = (
	current: string,
	frequency: number,
	unit: "DAY" | "WEEK" | "MONTH",
) =>
	formatDateOnly(
		computeNextDueDate({ current: parseDateOnly(current), frequency, unit }),
	);

describe("computeNextDueDate", () => {
	it("should advance by days", () => {
		expect(nextDueDateFrom("2026-01-10", 1, "DAY")).toEqual("2026-01-11");
	});

	it("should advance by weeks", () => {
		expect(nextDueDateFrom("2026-01-10", 1, "WEEK")).toEqual("2026-01-17");
	});

	it("should advance by months", () => {
		expect(nextDueDateFrom("2026-01-10", 1, "MONTH")).toEqual("2026-02-10");
	});

	it("should advance by multiple intervals", () => {
		expect(nextDueDateFrom("2026-01-10", 5, "DAY")).toEqual("2026-01-15");
		expect(nextDueDateFrom("2026-01-10", 3, "WEEK")).toEqual("2026-01-31");
		expect(nextDueDateFrom("2026-01-10", 4, "MONTH")).toEqual("2026-05-10");
	});

	it("should clamp the day when the target month is shorter", () => {
		// 31/jan + 1 mês em 2026 (fev com 28 dias)
		expect(nextDueDateFrom("2026-01-31", 1, "MONTH")).toEqual("2026-02-28");
		// 31/jan + 1 mês em 2028 (ano bissexto)
		expect(nextDueDateFrom("2028-01-31", 1, "MONTH")).toEqual("2028-02-29");
		// 31/mar + 1 mês (abr com 30 dias)
		expect(nextDueDateFrom("2026-03-31", 1, "MONTH")).toEqual("2026-04-30");
	});

	it("should not carry the clamp forward on the following step", () => {
		// A grade continua ancorada no dia 31 do mês seguinte quando ele existe.
		expect(nextDueDateFrom("2026-01-31", 2, "MONTH")).toEqual("2026-03-31");
	});

	it("should cross month and year boundaries", () => {
		expect(nextDueDateFrom("2026-12-28", 1, "WEEK")).toEqual("2027-01-04");
		expect(nextDueDateFrom("2026-12-15", 1, "MONTH")).toEqual("2027-01-15");
	});

	it("should keep date-only semantics (midnight UTC, no timezone drift)", () => {
		const nextDueDate = computeNextDueDate({
			current: parseDateOnly("2026-01-10"),
			frequency: 1,
			unit: "DAY",
		});

		expect(nextDueDate.toISOString()).toEqual("2026-01-11T00:00:00.000Z");
	});
});
