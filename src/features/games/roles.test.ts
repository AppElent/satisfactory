import { describe, expect, it } from "vitest";
import { hasRole, type Role } from "./roles";

describe("hasRole", () => {
	it("grants when the actual role outranks or equals the minimum", () => {
		expect(hasRole("owner", "viewer")).toBe(true);
		expect(hasRole("editor", "editor")).toBe(true);
		expect(hasRole("viewer", "viewer")).toBe(true);
	});

	it("denies when the actual role is below the minimum", () => {
		expect(hasRole("viewer", "editor")).toBe(false);
		expect(hasRole("editor", "owner")).toBe(false);
	});

	it("ranks owner > editor > viewer", () => {
		const order: Role[] = ["viewer", "editor", "owner"];
		expect(order.every((r, i) => i === 0 || hasRole(r, order[i - 1]))).toBe(
			true,
		);
	});
});
