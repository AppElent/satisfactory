import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const BASE =
	"https://raw.githubusercontent.com/greeny/SatisfactoryTools/master/www/assets/images/items";
const OUT = "public/icons";
const GEN = "src/data/generated";

function iconsFrom(file: string): string[] {
	const arr = JSON.parse(readFileSync(`${GEN}/${file}`, "utf8")) as Array<{
		icon?: string;
	}>;
	return arr.map((e) => e.icon).filter((i): i is string => Boolean(i));
}

const slugs = new Set<string>([
	...iconsFrom("items.json"),
	...iconsFrom("buildings.json"),
	...iconsFrom("buildables.json"),
	...iconsFrom("schematics.json"),
]);

mkdirSync(OUT, { recursive: true });
let downloaded = 0;
let skipped = 0;
const failed: string[] = [];

for (const slug of slugs) {
	const dest = `${OUT}/${slug}.png`;
	if (existsSync(dest)) {
		skipped++;
		continue;
	}
	const res = await fetch(`${BASE}/${slug}_64.png`);
	if (!res.ok) {
		failed.push(slug);
		continue;
	}
	const buf = Buffer.from(await res.arrayBuffer());
	writeFileSync(dest, buf);
	downloaded++;
}

console.log(
	`downloaded: ${downloaded}, skipped: ${skipped}, failed: ${failed.length}`,
);
for (const f of failed) console.warn(`  no image for ${f}`);
if (failed.length > 20) {
	console.error("Too many missing icons — aborting (data/source mismatch?)");
	process.exit(1);
}
