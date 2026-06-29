import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders its label", () => {
    const { getByText } = render(<Badge tone="success">Operational</Badge>);
    expect(getByText("Operational")).toBeInTheDocument();
  });

  it("renders a status dot when dot is set", () => {
    const { container } = render(
      <Badge tone="danger" dot>Offline</Badge>,
    );
    expect(container.querySelector("[data-badge-dot]")).not.toBeNull();
  });
});
