import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useAlternatePresets } from "./useAlternatePresets";

describe("useAlternatePresets", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("loads no custom presets when storage is empty", () => {
		const { result } = renderHook(() =>
			useAlternatePresets(new Set(["recipe-a"])),
		);

		expect(result.current.customPresets).toEqual([]);
	});

	it("ignores malformed storage JSON", () => {
		localStorage.setItem("satisfactory.alternatePresets.v1", "{bad json");
		const { result } = renderHook(() =>
			useAlternatePresets(new Set(["recipe-a"])),
		);

		expect(result.current.customPresets).toEqual([]);
	});

	it("creates a named preset from the current recipe list", () => {
		const { result } = renderHook(() =>
			useAlternatePresets(new Set(["recipe-a"])),
		);

		act(() => {
			result.current.savePreset({
				mode: "create",
				name: "Iron build",
				recipeSlugs: ["recipe-a", "missing"],
			});
		});

		expect(result.current.customPresets).toHaveLength(1);
		expect(result.current.customPresets[0]).toMatchObject({
			name: "Iron build",
			recipeSlugs: ["recipe-a"],
		});
		expect(localStorage.getItem("satisfactory.alternatePresets.v1")).toContain(
			"Iron build",
		);
	});

	it("overwrites an existing preset", () => {
		const { result } = renderHook(() =>
			useAlternatePresets(new Set(["recipe-a", "recipe-b"])),
		);
		let id = "";

		act(() => {
			const saved = result.current.savePreset({
				mode: "create",
				name: "First",
				recipeSlugs: ["recipe-a"],
			});
			id = saved.id;
		});
		act(() => {
			result.current.savePreset({
				mode: "overwrite",
				id,
				name: "Updated",
				recipeSlugs: ["recipe-b"],
			});
		});

		expect(result.current.customPresets).toEqual([
			expect.objectContaining({
				id,
				name: "Updated",
				recipeSlugs: ["recipe-b"],
			}),
		]);
	});
});
