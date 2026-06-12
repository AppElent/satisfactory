import { z } from "zod";

export const itemAmountSchema = z.object({
	/** Slug of an item or buildable. */
	item: z.string(),
	amount: z.number(),
});

export const itemSchema = z.object({
	slug: z.string(),
	className: z.string(),
	name: z.string(),
	description: z.string(),
	icon: z.string(),
	form: z.enum(["solid", "fluid"]),
	stackSize: z.number(),
	sinkPoints: z.number(),
	energyValue: z.number(),
	radioactiveDecay: z.number(),
});

export const recipeSchema = z.object({
	slug: z.string(),
	className: z.string(),
	name: z.string(),
	alternate: z.boolean(),
	/** Seconds per craft. Per-minute rate = amount * 60 / time. */
	time: z.number(),
	ingredients: z.array(itemAmountSchema),
	products: z.array(itemAmountSchema),
	/** Building slugs. Empty for hand/workshop/build-gun recipes. */
	producedIn: z.array(z.string()),
	forBuilding: z.boolean(),
	inMachine: z.boolean(),
	inHand: z.boolean(),
	inWorkshop: z.boolean(),
	isVariablePower: z.boolean(),
	minPower: z.number(),
	maxPower: z.number(),
});

export const buildingSchema = z.object({
	slug: z.string(),
	className: z.string(),
	name: z.string(),
	description: z.string(),
	icon: z.string(),
	powerConsumption: z.number(),
	powerConsumptionExponent: z.number(),
	manufacturingSpeed: z.number(),
	size: z.object({
		width: z.number(),
		height: z.number(),
		length: z.number(),
	}),
});

export const buildableSchema = z.object({
	slug: z.string(),
	className: z.string(),
	name: z.string(),
	description: z.string(),
	icon: z.string(),
	categories: z.array(z.string()),
	size: z.object({
		width: z.number(),
		height: z.number(),
		length: z.number(),
	}),
});

export const schematicSchema = z.object({
	slug: z.string(),
	className: z.string(),
	name: z.string(),
	icon: z.string(),
	type: z.string(),
	tier: z.number(),
	cost: z.array(itemAmountSchema),
	/** Recipe slugs. Source refs that don't resolve are dropped (known data quirk). */
	unlockRecipes: z.array(z.string()),
	/** Schematic slugs. Source refs that don't resolve are dropped (known data quirk). */
	requiredSchematics: z.array(z.string()),
	mam: z.boolean(),
	alternate: z.boolean(),
});

export const resourceSchema = z.object({
	/** Item slug. */
	item: z.string(),
	/** Extraction speed multiplier. */
	speed: z.number(),
});

export const generatorSchema = z.object({
	className: z.string(),
	/** Building slug. */
	building: z.string(),
	/** Item slugs. */
	fuels: z.array(z.string()),
	powerProduction: z.number(),
	powerProductionExponent: z.number(),
	waterToPowerRatio: z.number(),
});

export const minerSchema = z.object({
	className: z.string(),
	/** Building slug. */
	building: z.string(),
	/** Item slugs. */
	allowedResources: z.array(z.string()),
	allowLiquids: z.boolean(),
	allowSolids: z.boolean(),
	itemsPerCycle: z.number(),
	extractCycleTime: z.number(),
});

export const gameDataSchema = z.object({
	items: z.array(itemSchema),
	recipes: z.array(recipeSchema),
	buildings: z.array(buildingSchema),
	buildables: z.array(buildableSchema),
	schematics: z.array(schematicSchema),
	resources: z.array(resourceSchema),
	generators: z.array(generatorSchema),
	miners: z.array(minerSchema),
});

export type ItemAmount = z.infer<typeof itemAmountSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type Building = z.infer<typeof buildingSchema>;
export type Buildable = z.infer<typeof buildableSchema>;
export type Schematic = z.infer<typeof schematicSchema>;
export type Resource = z.infer<typeof resourceSchema>;
export type Generator = z.infer<typeof generatorSchema>;
export type Miner = z.infer<typeof minerSchema>;
export type GameData = z.infer<typeof gameDataSchema>;
