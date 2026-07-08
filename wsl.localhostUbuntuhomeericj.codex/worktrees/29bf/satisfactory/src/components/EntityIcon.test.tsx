import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EntityIcon from "./EntityIcon";

describe("EntityIcon", () => {
	it("renders an img pointing at the vendored icon path", () => {
		const { getByRole } = render(
			<EntityIcon icon="desc-ironplate-c" name="Iron Plate" />,
		);
		const img = getByRole("img") as HTMLImageElement;
		expect(img.getAttribute("src")).toBe("/icons/desc-ironplate-c.png");
		expect(img.getAttribute("alt")).toBe("Iron Plate");
	});

	it("renders a placeholder when icon is missing", () => {
		const { container } = render(<EntityIcon name="Mystery" />);
		expect(container.querySelector("img")).toBeNull();
		expect(container.textContent).toContain("M");
	});
});
