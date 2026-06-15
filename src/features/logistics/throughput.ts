export interface Throughput {
	/** 1-based tier index (belts Mk1-6, pipes Mk1-2). */
	tier: number;
	count: number;
}

const BELT_TIERS = [60, 120, 270, 480, 780, 1200];
const PIPE_TIERS = [300, 600];

function pick(tiers: number[], rate: number): Throughput {
	if (rate <= 0) return { tier: 1, count: 0 };
	const max = tiers[tiers.length - 1];
	if (rate <= max) {
		const idx = tiers.findIndex((t) => t >= rate);
		return { tier: idx + 1, count: 1 };
	}
	return { tier: tiers.length, count: Math.ceil(rate / max) };
}

/** Belt sizing for a solid-item rate (items/min). */
export function beltFor(rate: number): Throughput {
	return pick(BELT_TIERS, rate);
}

/** Pipe sizing for a fluid rate (m³/min). */
export function pipeFor(rate: number): Throughput {
	return pick(PIPE_TIERS, rate);
}
