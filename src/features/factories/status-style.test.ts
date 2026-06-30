import { describe, expect, it } from "vitest";
import { effProgressTone, statusBadgeTone } from "./status-style";

describe("status-style", () => {
	it("maps efficiency to progress tones", () => {
		expect(effProgressTone(96)).toBe("success");
		expect(effProgressTone(85)).toBe("warning");
		expect(effProgressTone(50)).toBe("danger");
	});

	it("maps factory status to badge tones", () => {
		expect(statusBadgeTone("operational")).toBe("success");
		expect(statusBadgeTone("building")).toBe("warning");
		expect(statusBadgeTone("paused")).toBe("neutral");
		expect(statusBadgeTone("planned")).toBe("info");
	});
});
