import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const update = vi.fn().mockResolvedValue(undefined);
const updatePassword = vi.fn().mockResolvedValue(undefined);
const signOut = vi.fn();

vi.mock("@clerk/clerk-react", () => ({
	useUser: () => ({
		isLoaded: true,
		user: {
			firstName: "Ada",
			lastName: "Lovelace",
			primaryEmailAddress: { emailAddress: "ada@example.com" },
			update,
			updatePassword,
		},
	}),
	useClerk: () => ({ signOut }),
}));

import { AccountPanel } from "./AccountPanel";

describe("AccountPanel", () => {
	it("shows the user email and no appearance/theme controls", () => {
		render(<AccountPanel />);
		expect(screen.getByText(/ada@example.com/)).toBeInTheDocument();
		expect(screen.queryByText(/appearance/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/theme/i)).not.toBeInTheDocument();
	});

	it("saves profile changes", async () => {
		render(<AccountPanel />);
		const form = screen.getByText("Save profile").closest("form");
		if (!form) {
			throw new Error("Expected the profile form to be rendered");
		}
		fireEvent.submit(form);
		await waitFor(() =>
			expect(update).toHaveBeenCalledWith({
				firstName: "Ada",
				lastName: "Lovelace",
			}),
		);
	});

	it("signs out", () => {
		render(<AccountPanel />);
		fireEvent.click(screen.getByText("Sign out"));
		expect(signOut).toHaveBeenCalled();
	});
});
