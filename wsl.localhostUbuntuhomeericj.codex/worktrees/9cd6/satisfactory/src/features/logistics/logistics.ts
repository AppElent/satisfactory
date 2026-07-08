import {
	plannedInputs,
	plannedOutputs,
} from "#/features/factories/factory-view";
import type { ItemRate, Production } from "#/features/factories/types";

/** Minimal factory shape this module needs (Convex Doc<"factories"> satisfies it). */
export interface FactoryLike {
	_id: string;
	production: Production;
}

/** Minimal transport shape (Convex Doc<"transports"> satisfies it). */
export interface TransportLike {
	fromFactoryId: string;
	toFactoryId: string;
	item: string;
	rate: number;
}

export interface FactoryBalance {
	surplus: ItemRate[];
	needs: ItemRate[];
}

export interface Network {
	byFactory: Map<string, FactoryBalance>;
	/** Net production − consumption per item across all factories. */
	totals: ItemRate[];
}

function toMap(rates: ItemRate[]): Map<string, number> {
	const m = new Map<string, number>();
	for (const r of rates) m.set(r.item, (m.get(r.item) ?? 0) + r.rate);
	return m;
}

function positive(m: Map<string, number>): ItemRate[] {
	return [...m]
		.filter(([, rate]) => rate > 1e-9)
		.map(([item, rate]) => ({ item, rate }));
}

export function computeNetwork(
	factories: FactoryLike[],
	transports: TransportLike[],
): Network {
	const byFactory = new Map<string, FactoryBalance>();
	const totals = new Map<string, number>();

	for (const f of factories) {
		const outputs = toMap(plannedOutputs(f.production));
		const inputs = toMap(plannedInputs(f.production));
		for (const [item, rate] of outputs)
			totals.set(item, (totals.get(item) ?? 0) + rate);
		for (const [item, rate] of inputs)
			totals.set(item, (totals.get(item) ?? 0) - rate);

		for (const t of transports) {
			if (t.fromFactoryId === f._id)
				outputs.set(t.item, (outputs.get(t.item) ?? 0) - t.rate);
			if (t.toFactoryId === f._id)
				inputs.set(t.item, (inputs.get(t.item) ?? 0) - t.rate);
		}
		byFactory.set(f._id, {
			surplus: positive(outputs),
			needs: positive(inputs),
		});
	}

	return {
		byFactory,
		totals: [...totals]
			.filter(([, rate]) => Math.abs(rate) > 1e-9)
			.map(([item, rate]) => ({ item, rate })),
	};
}

export function suggestSources(
	item: string,
	factories: FactoryLike[],
	transports: TransportLike[],
): { factoryId: string; rate: number }[] {
	const net = computeNetwork(factories, transports);
	const out: { factoryId: string; rate: number }[] = [];
	for (const [factoryId, balance] of net.byFactory) {
		const s = balance.surplus.find((r) => r.item === item);
		if (s) out.push({ factoryId, rate: s.rate });
	}
	return out.sort((p, q) => q.rate - p.rate);
}
