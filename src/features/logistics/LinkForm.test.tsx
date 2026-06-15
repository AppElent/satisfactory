import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LinkForm from "./LinkForm";

const factories = [
	{ _id: "a", name: "Smelter" },
	{ _id: "b", name: "Assembler" },
] as never[];

describe("LinkForm", () => {
	it("calls onCreate with the selected link", () => {
		const onCreate = vi.fn();
		render(<LinkForm factories={factories} onCreate={onCreate} />);
		fireEvent.change(screen.getByLabelText("Item"), { target: { value: "iron-plate" } });
		fireEvent.change(screen.getByLabelText("Rate per minute"), { target: { value: "60" } });
		fireEvent.click(screen.getByRole("button", { name: "Add link" }));
		expect(onCreate).toHaveBeenCalledWith(
			expect.objectContaining({ item: "iron-plate", rate: 60, mode: "belt" }),
		);
	});
});
