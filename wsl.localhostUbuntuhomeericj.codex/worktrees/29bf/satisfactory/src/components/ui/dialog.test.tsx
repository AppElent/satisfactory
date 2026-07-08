import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dialog, DialogContent, DialogTitle } from "./dialog";

describe("DialogContent", () => {
	it("renders centered by default", () => {
		render(
			<Dialog open>
				<DialogContent>
					<DialogTitle>Test</DialogTitle>
				</DialogContent>
			</Dialog>,
		);
		expect(screen.getByRole("dialog").className).toContain("top-1/2");
	});

	it("renders bottom-anchored when position='bottom'", () => {
		render(
			<Dialog open>
				<DialogContent position="bottom">
					<DialogTitle>Test</DialogTitle>
				</DialogContent>
			</Dialog>,
		);
		const dialog = screen.getByRole("dialog");
		expect(dialog.className).toContain("bottom-0");
		expect(dialog.className).not.toContain("top-1/2");
	});
});
