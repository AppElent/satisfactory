import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Progress } from "./progress";

describe("Progress", () => {
  it("sets the indicator width from value", () => {
    const { container } = render(<Progress value={70} />);
    const indicator = container.querySelector("[data-progress-indicator]") as HTMLElement;
    expect(indicator.style.width).toBe("70%");
  });
});
