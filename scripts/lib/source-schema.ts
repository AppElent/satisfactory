import { z } from 'zod'

const color = z.object({
  r: z.number(),
  g: z.number(),
  b: z.number(),
  a: z.number(),
})

const itemAmount = z.object({ item: z.string(), amount: z.number() })

export const sourceItemSchema = z.object({
  slug: z.string(),
  icon: z.string(),
  name: z.string(),
  description: z.string(),
  sinkPoints: z.number(),
  className: z.string(),
  stackSize: z.number(),
  energyValue: z.number(),
  radioactiveDecay: z.number(),
  liquid: z.boolean(),
  fluidColor: color,
})

export const sourceRecipeSchema = z.object({
  slug: z.string(),
  name: z.string(),
  className: z.string(),
  alternate: z.boolean(),
  time: z.number(),
  inHand: z.boolean(),
  forBuilding: z.boolean(),
  inWorkshop: z.boolean(),
  inMachine: z.boolean(),
  manualTimeMultiplier: z.number(),
  ingredients: z.array(itemAmount),
  products: z.array(itemAmount),
  producedIn: z.array(z.string()),
  isVariablePower: z.boolean(),
  minPower: z.number(),
  maxPower: z.number(),
})

export const sourceSchematicSchema = z.object({
  className: z.string(),
  type: z.string(),
  name: z.string(),
  slug: z.string(),
  icon: z.string(),
  cost: z.array(itemAmount),
  unlock: z.object({
    recipes: z.array(z.string()),
    scannerResources: z.array(z.string()),
    inventorySlots: z.number(),
    giveItems: z.array(itemAmount),
  }),
  requiredSchematics: z.array(z.string()),
  tier: z.number(),
  time: z.number(),
  mam: z.boolean(),
  alternate: z.boolean(),
})

export const sourceGeneratorSchema = z.object({
  className: z.string(),
  fuel: z.array(z.string()),
  powerProduction: z.number(),
  powerProductionExponent: z.number(),
  waterToPowerRatio: z.number(),
})

export const sourceResourceSchema = z.object({
  item: z.string(),
  pingColor: color,
  speed: z.number(),
})

export const sourceMinerSchema = z.object({
  className: z.string(),
  allowedResources: z.array(z.string()),
  allowLiquids: z.boolean(),
  allowSolids: z.boolean(),
  itemsPerCycle: z.number(),
  extractCycleTime: z.number(),
})

export const sourceBuildingSchema = z.object({
  slug: z.string(),
  icon: z.string(),
  name: z.string(),
  description: z.string(),
  className: z.string(),
  categories: z.array(z.string()),
  buildMenuPriority: z.number(),
  metadata: z.object({
    powerConsumption: z.number().default(0),
    powerConsumptionExponent: z.number().default(0),
    manufacturingSpeed: z.number().default(0),
  }),
  size: z.object({
    width: z.number(),
    height: z.number(),
    length: z.number(),
  }),
})

export const sourceDataSchema = z.object({
  items: z.record(z.string(), sourceItemSchema),
  recipes: z.record(z.string(), sourceRecipeSchema),
  schematics: z.record(z.string(), sourceSchematicSchema),
  generators: z.record(z.string(), sourceGeneratorSchema),
  resources: z.record(z.string(), sourceResourceSchema),
  miners: z.record(z.string(), sourceMinerSchema),
  buildings: z.record(z.string(), sourceBuildingSchema),
})

export type SourceData = z.infer<typeof sourceDataSchema>
