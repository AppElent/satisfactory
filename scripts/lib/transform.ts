import { type GameData, gameDataSchema } from "../../src/data/schema.ts";
import type { SourceData } from "./source-schema.ts";

export class TransformError extends Error {}

export interface TransformResult {
	data: GameData;
	warnings: string[];
}

/** Maps className → unique slug, suffixing -2, -3, … on collisions (source has dupes). */
function uniqueSlugMap(
	entries: Array<{ className: string; slug: string }>,
): Map<string, string> {
	const counts = new Map<string, number>();
	const map = new Map<string, string>();
	for (const entry of entries) {
		const n = (counts.get(entry.slug) ?? 0) + 1;
		counts.set(entry.slug, n);
		map.set(entry.className, n === 1 ? entry.slug : `${entry.slug}-${n}`);
	}
	return map;
}

const bySlug = <T extends { slug: string }>(a: T, b: T) =>
	a.slug.localeCompare(b.slug);

export function transform(source: SourceData): TransformResult {
	const warnings: string[] = [];

	const itemSlugs = uniqueSlugMap(Object.values(source.items));
	const buildingSlugs = uniqueSlugMap(Object.values(source.buildings));
	const recipeSlugs = uniqueSlugMap(Object.values(source.recipes));
	const schematicSlugs = uniqueSlugMap(Object.values(source.schematics));

	const resolveStrict = (
		map: Map<string, string>,
		className: string,
		context: string,
	): string => {
		const slug = map.get(className);
		if (!slug) {
			throw new TransformError(
				`Unresolved reference ${className} in ${context}`,
			);
		}
		return slug;
	};

	/** Items and buildables share the amount-reference namespace. */
	const resolveItemRef = (className: string, context: string): string =>
		itemSlugs.get(className) ??
		resolveStrict(buildingSlugs, className, context);

	const producerClasses = new Set<string>();
	for (const r of Object.values(source.recipes)) {
		for (const c of r.producedIn) producerClasses.add(c);
	}
	for (const c of Object.keys(source.generators)) producerClasses.add(c);
	for (const c of Object.keys(source.miners)) producerClasses.add(c);

	const items = Object.values(source.items)
		.map((i) => ({
			slug: itemSlugs.get(i.className) as string,
			className: i.className,
			name: i.name,
			description: i.description,
			icon: i.icon,
			form: i.liquid ? ("fluid" as const) : ("solid" as const),
			stackSize: i.stackSize,
			sinkPoints: i.sinkPoints,
			energyValue: i.energyValue,
			radioactiveDecay: i.radioactiveDecay,
		}))
		.sort(bySlug);

	const buildings = Object.values(source.buildings)
		.filter((b) => producerClasses.has(b.className))
		.map((b) => ({
			slug: buildingSlugs.get(b.className) as string,
			className: b.className,
			name: b.name,
			description: b.description,
			icon: b.icon,
			powerConsumption: b.metadata.powerConsumption,
			powerConsumptionExponent: b.metadata.powerConsumptionExponent,
			manufacturingSpeed: b.metadata.manufacturingSpeed,
			size: b.size,
		}))
		.sort(bySlug);

	const buildables = Object.values(source.buildings)
		.filter((b) => !producerClasses.has(b.className))
		.map((b) => ({
			slug: buildingSlugs.get(b.className) as string,
			className: b.className,
			name: b.name,
			description: b.description,
			icon: b.icon,
			categories: b.categories,
			size: b.size,
		}))
		.sort(bySlug);

	const recipes = Object.values(source.recipes)
		.map((r) => ({
			slug: recipeSlugs.get(r.className) as string,
			className: r.className,
			name: r.name,
			alternate: r.alternate,
			time: r.time,
			ingredients: r.ingredients.map((x) => ({
				item: resolveItemRef(x.item, `recipe ${r.className} ingredients`),
				amount: x.amount,
			})),
			products: r.products.map((x) => ({
				item: resolveItemRef(x.item, `recipe ${r.className} products`),
				amount: x.amount,
			})),
			producedIn: r.producedIn.map((c) =>
				resolveStrict(buildingSlugs, c, `recipe ${r.className} producedIn`),
			),
			forBuilding: r.forBuilding,
			inMachine: r.inMachine,
			inHand: r.inHand,
			inWorkshop: r.inWorkshop,
			isVariablePower: r.isVariablePower,
			minPower: r.minPower,
			maxPower: r.maxPower,
		}))
		.sort(bySlug);

	const schematics = Object.values(source.schematics)
		.map((s) => {
			const unlockRecipes: string[] = [];
			for (const c of s.unlock.recipes) {
				const slug = recipeSlugs.get(c);
				if (slug) unlockRecipes.push(slug);
				else
					warnings.push(`schematic ${s.className}: unknown unlock recipe ${c}`);
			}
			const requiredSchematics: string[] = [];
			for (const c of s.requiredSchematics) {
				const slug = schematicSlugs.get(c);
				if (slug) requiredSchematics.push(slug);
				else
					warnings.push(
						`schematic ${s.className}: unknown required schematic ${c}`,
					);
			}
			const cost: { item: string; amount: number }[] = [];
			for (const x of s.cost) {
				const slug = itemSlugs.get(x.item) ?? buildingSlugs.get(x.item);
				if (slug) cost.push({ item: slug, amount: x.amount });
				else
					warnings.push(
						`schematic ${s.className}: unknown cost item ${x.item}`,
					);
			}
			return {
				slug: schematicSlugs.get(s.className) as string,
				className: s.className,
				name: s.name,
				type: s.type,
				tier: s.tier,
				cost,
				unlockRecipes,
				requiredSchematics,
				mam: s.mam,
				alternate: s.alternate,
			};
		})
		.sort(bySlug);

	const resources = Object.values(source.resources)
		.map((r) => ({
			item: resolveStrict(itemSlugs, r.item, "resources"),
			speed: r.speed,
		}))
		.sort((a, b) => a.item.localeCompare(b.item));

	const generators = Object.values(source.generators)
		.map((g) => ({
			className: g.className,
			building: resolveStrict(buildingSlugs, g.className, "generators"),
			fuels: g.fuel.map((c) =>
				resolveStrict(itemSlugs, c, `generator ${g.className} fuel`),
			),
			powerProduction: g.powerProduction,
			powerProductionExponent: g.powerProductionExponent,
			waterToPowerRatio: g.waterToPowerRatio,
		}))
		.sort((a, b) => a.className.localeCompare(b.className));

	const miners = Object.values(source.miners)
		.map((m) => ({
			className: m.className,
			building: resolveStrict(buildingSlugs, m.className, "miners"),
			allowedResources: m.allowedResources.map((c) =>
				resolveStrict(itemSlugs, c, `miner ${m.className} allowedResources`),
			),
			allowLiquids: m.allowLiquids,
			allowSolids: m.allowSolids,
			itemsPerCycle: m.itemsPerCycle,
			extractCycleTime: m.extractCycleTime,
		}))
		.sort((a, b) => a.className.localeCompare(b.className));

	const data = gameDataSchema.parse({
		items,
		recipes,
		buildings,
		buildables,
		schematics,
		resources,
		generators,
		miners,
	});

	return { data, warnings };
}
