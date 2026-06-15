import { describe, expect, it } from "vitest";
import type { FactoryLike, TransportLike } from "./logistics";
import { computeNetwork, suggestSources } from "./logistics";

const a: FactoryLike = {
	_id: "a",
	production: {
		source: "manual",
		inputs: [],
		outputs: [{ item: "iron-plate", rate: 60 }],
		machines: [],
	},
};
const b: FactoryLike = {
	_id: "b",
	production: {
		source: "manual",
		inputs: [{ item: "iron-plate", rate: 40 }],
		outputs: [],
		machines: [],
	},
};

describe("computeNetwork", () => {
	it("reports raw surplus and need with no transports", () => {
		const net = computeNetwork([a, b], []);
		expect(net.byFactory.get("a")?.surplus).toEqual([
			{ item: "iron-plate", rate: 60 },
		]);
		expect(net.byFactory.get("b")?.needs).toEqual([
			{ item: "iron-plate", rate: 40 },
		]);
	});

	it("subtracts a transport from both surplus and need", () => {
		const t: TransportLike = {
			fromFactoryId: "a",
			toFactoryId: "b",
			item: "iron-plate",
			rate: 40,
		};
		const net = computeNetwork([a, b], [t]);
		expect(net.byFactory.get("a")?.surplus).toEqual([
			{ item: "iron-plate", rate: 20 },
		]);
		expect(net.byFactory.get("b")?.needs).toEqual([]);
	});

	it("gives net per-item totals across the network", () => {
		const net = computeNetwork([a, b], []);
		expect(net.totals).toEqual([{ item: "iron-plate", rate: 20 }]);
	});
});

describe("suggestSources", () => {
	it("lists factories with surplus of the item, highest first", () => {
		const c: FactoryLike = {
			_id: "c",
			production: {
				source: "manual",
				inputs: [],
				outputs: [{ item: "iron-plate", rate: 100 }],
				machines: [],
			},
		};
		const out = suggestSources("iron-plate", [a, c], []);
		expect(out).toEqual([
			{ factoryId: "c", rate: 100 },
			{ factoryId: "a", rate: 60 },
		]);
	});
});
