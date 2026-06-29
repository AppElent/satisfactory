import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tabs } from "./tabs";

describe("Tabs", () => {
  const items = [
    { id: "graph", label: "Graph" },
    { id: "items", label: "Items" },
  ];

  it("renders one tab per item and marks the active one selected", () => {
    const { getByRole } = render(
      <Tabs items={items} value="items" onChange={() => {}} />,
    );
    expect(getByRole("tab", { name: "Items" }).getAttribute("aria-selected")).toBe("true");
    expect(getByRole("tab", { name: "Graph" }).getAttribute("aria-selected")).toBe("false");
  });
});
