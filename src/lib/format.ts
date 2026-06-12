/** Items produced/consumed per minute for a recipe craft. */
export function perMinute(amount: number, craftTimeSeconds: number): number {
	if (craftTimeSeconds === 0) return 0;
	return (amount * 60) / craftTimeSeconds;
}

const numberFormat = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 4,
});

/** Human number: thousands separators, no float noise, ≤4 decimals. */
export function formatNumber(value: number): string {
	return numberFormat.format(value);
}

/** Power in megawatts. */
export function formatPower(megawatts: number): string {
	return `${formatNumber(megawatts)} MW`;
}
