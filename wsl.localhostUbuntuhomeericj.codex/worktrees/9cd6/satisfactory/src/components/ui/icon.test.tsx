import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./icon";

describe("Icon", () => {
	it("renders an svg referencing the symbol id", () => {
		const { container } = render(<Icon name="factory" />);
		const use = container.querySelector("use");
		expect(use?.getAttribute("href")).toBe("#i-factory");
	});

	it("applies the size to width and height", () => {
		const { container } = render(<Icon name="zap" size={24} />);
		const svg = container.querySelector("svg") as SVGElement;
		expect(svg.getAttribute("width")).toBe("24");
		expect(svg.getAttribute("height")).toBe("24");
	});
});
