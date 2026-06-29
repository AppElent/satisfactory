import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Panel } from "./panel";

describe("Panel", () => {
  it("renders a title header strip and children", () => {
    const { getByText } = render(
      <Panel title="Factory Network">rows</Panel>,
    );
    expect(getByText("Factory Network")).toBeInTheDocument();
    expect(getByText("rows")).toBeInTheDocument();
  });

  it("renders the orange top rail when topRail is set", () => {
    const { container } = render(<Panel topRail>body</Panel>);
    expect(container.querySelector("[data-top-rail]")).not.toBeNull();
  });
});
