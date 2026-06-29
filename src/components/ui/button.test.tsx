import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders children and is a button by default", () => {
    const { getByRole } = render(<Button>Construct</Button>);
    expect(getByRole("button").textContent).toBe("Construct");
  });

  it("applies the primary variant data attribute", () => {
    const { getByRole } = render(<Button variant="primary">Go</Button>);
    expect(getByRole("button").getAttribute("data-variant")).toBe("primary");
  });
});
