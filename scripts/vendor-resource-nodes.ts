// Vendors resource-node positions + purity from the Satisfactory-Calculator
// interactive map into data/vendor/resource-nodes.json (a committed snapshot).
// Run with `npm run vendor-nodes`, then `npm run generate-data`.
import { writeFileSync } from "node:fs";

const SOURCE =
	"https://satisfactory-calculator.com/en/interactive-map/index/json";
const OUT = "data/vendor/resource-nodes.json";

// SC resource class name → our data-layer item slug.
const TYPE_TO_SLUG: Record<string, string> = {
	Desc_Stone_C: "limestone",
	Desc_OreIron_C: "iron-ore",
	Desc_OreCopper_C: "copper-ore",
	Desc_OreGold_C: "caterium-ore",
	Desc_Coal_C: "coal",
	Desc_LiquidOil_C: "crude-oil",
	Desc_Sulfur_C: "sulfur",
	Desc_OreBauxite_C: "bauxite",
	Desc_RawQuartz_C: "raw-quartz",
	Desc_OreUranium_C: "uranium",
	Desc_SAM_C: "sam",
};

const PURITY: Record<string, "impure" | "normal" | "pure"> = {
	RP_Inpure: "impure",
	RP_Normal: "normal",
	RP_Pure: "pure",
};

interface ScMarker {
	pathName: string;
	x: number;
	y: number;
	type: string;
	purity: string;
}

const res = await fetch(SOURCE, {
	headers: {
		"User-Agent":
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
		Accept: "application/json",
		"X-Requested-With": "XMLHttpRequest",
		Referer: "https://satisfactory-calculator.com/en/interactive-map",
	},
});
const data = (await res.json()) as {
	options: {
		tabId?: string;
		options: { options: { markers: ScMarker[] }[] }[];
	}[];
};

const tab = data.options.find((c) => c.tabId === "resource_nodes");
if (!tab) throw new Error("resource_nodes tab not found in source");

const nodes: {
	id: string;
	x: number;
	y: number;
	type: string;
	purity: string;
}[] = [];
for (const resource of tab.options) {
	for (const layer of resource.options) {
		for (const m of layer.markers ?? []) {
			const type = TYPE_TO_SLUG[m.type];
			const purity = PURITY[m.purity];
			if (!type || !purity) continue; // skip unmapped types/purities
			nodes.push({ id: m.pathName, x: m.x, y: m.y, type, purity });
		}
	}
}

nodes.sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(OUT, `${JSON.stringify(nodes, null, 1)}\n`);
console.log(`vendored ${nodes.length} resource nodes → ${OUT}`);
const byType = new Map<string, number>();
for (const n of nodes) byType.set(n.type, (byType.get(n.type) ?? 0) + 1);
for (const [t, c] of [...byType].sort()) console.log(`  ${t}: ${c}`);
