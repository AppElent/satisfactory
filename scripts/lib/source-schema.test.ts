import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { sourceDataSchema } from "./source-schema.ts";

describe("sourceDataSchema", () => {
	it("parses the vendored greeny data file", () => {
		const raw = JSON.parse(
			readFileSync("data/vendor/greeny-data1.0.json", "utf8"),
		);
		const parsed = sourceDataSchema.parse(raw);
		expect(Object.keys(parsed.items)).toHaveLength(175);
		expect(Object.keys(parsed.recipes)).toHaveLength(797);
		expect(Object.keys(parsed.schematics)).toHaveLength(437);
		expect(Object.keys(parsed.buildings)).toHaveLength(500);
		expect(Object.keys(parsed.generators)).toHaveLength(4);
		expect(Object.keys(parsed.resources)).toHaveLength(13);
		expect(Object.keys(parsed.miners)).toHaveLength(5);
	});

	it("rejects malformed data", () => {
		expect(() => sourceDataSchema.parse({ items: "nope" })).toThrow();
	});
});
