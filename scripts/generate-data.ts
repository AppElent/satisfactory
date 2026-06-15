import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { resourceNodeSchema } from "../src/data/schema.ts";
import { sourceDataSchema } from "./lib/source-schema.ts";
import { transform } from "./lib/transform.ts";

const SOURCE = "data/vendor/greeny-data1.0.json";
const OUT_DIR = "src/data/generated";

const raw = JSON.parse(readFileSync(SOURCE, "utf8"));
const source = sourceDataSchema.parse(raw);
const { data, warnings } = transform(source);

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, entries] of Object.entries(data)) {
	writeFileSync(
		`${OUT_DIR}/${name}.json`,
		`${JSON.stringify(entries, null, 1)}\n`,
	);
	console.log(`${name}: ${entries.length}`);
}

const NODES_SOURCE = "data/vendor/resource-nodes.json";
const nodes = existsSync(NODES_SOURCE)
	? z
			.array(resourceNodeSchema)
			.parse(JSON.parse(readFileSync(NODES_SOURCE, "utf8")))
	: [];
writeFileSync(
	`${OUT_DIR}/resource-nodes.json`,
	`${JSON.stringify(nodes, null, 1)}\n`,
);
console.log(`resource-nodes: ${nodes.length}`);

console.log(`warnings: ${warnings.length}`);
for (const w of warnings) console.warn(`  ${w}`);
