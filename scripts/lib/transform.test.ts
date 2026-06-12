import { describe, expect, it } from 'vitest'
import type { SourceData } from './source-schema.ts'
import { TransformError, transform } from './transform.ts'

const color = { r: 0, g: 0, b: 0, a: 0 }
const size = { width: 0, height: 0, length: 0 }
const meta = {
  powerConsumption: 4,
  powerConsumptionExponent: 1.3,
  manufacturingSpeed: 1,
}

function item(className: string, slug: string, liquid = false) {
  return {
    slug,
    icon: slug,
    name: slug,
    description: '',
    sinkPoints: 1,
    className,
    stackSize: 100,
    energyValue: 0,
    radioactiveDecay: 0,
    liquid,
    fluidColor: color,
  }
}

function building(className: string, slug: string) {
  return {
    slug,
    icon: slug,
    name: slug,
    description: '',
    className,
    categories: [],
    buildMenuPriority: 0,
    metadata: meta,
    size,
  }
}

function recipe(
  className: string,
  slug: string,
  overrides: Partial<SourceData['recipes'][string]> = {},
) {
  return {
    slug,
    name: slug,
    className,
    alternate: false,
    time: 2,
    inHand: false,
    forBuilding: false,
    inWorkshop: false,
    inMachine: true,
    manualTimeMultiplier: 1,
    ingredients: [{ item: 'Desc_OreIron_C', amount: 1 }],
    products: [{ item: 'Desc_IronIngot_C', amount: 1 }],
    producedIn: ['Desc_SmelterMk1_C'],
    isVariablePower: false,
    minPower: 0,
    maxPower: 1,
    ...overrides,
  }
}

function schematic(
  className: string,
  slug: string,
  overrides: Partial<SourceData['schematics'][string]> = {},
) {
  return {
    className,
    type: 'EST_Milestone',
    name: slug,
    slug,
    icon: slug,
    cost: [{ item: 'Desc_OreIron_C', amount: 10 }],
    unlock: {
      recipes: ['Recipe_IngotIron_C'],
      scannerResources: [],
      inventorySlots: 0,
      giveItems: [],
    },
    requiredSchematics: [],
    tier: 1,
    time: 0,
    mam: false,
    alternate: false,
    ...overrides,
  }
}

function fixture(): SourceData {
  return {
    items: {
      Desc_OreIron_C: item('Desc_OreIron_C', 'iron-ore'),
      Desc_IronIngot_C: item('Desc_IronIngot_C', 'iron-ingot'),
      Desc_Water_C: item('Desc_Water_C', 'water', true),
    },
    recipes: {
      Recipe_IngotIron_C: recipe('Recipe_IngotIron_C', 'iron-ingot'),
      Recipe_Wall_C: recipe('Recipe_Wall_C', 'wall', {
        forBuilding: true,
        inMachine: false,
        ingredients: [{ item: 'Desc_IronIngot_C', amount: 2 }],
        products: [{ item: 'Desc_Wall_C', amount: 1 }],
        producedIn: [],
      }),
    },
    schematics: {
      Schematic_T1_C: schematic('Schematic_T1_C', 'tier-1'),
    },
    generators: {},
    resources: {
      Desc_OreIron_C: { item: 'Desc_OreIron_C', pingColor: color, speed: 1 },
    },
    miners: {},
    buildings: {
      Desc_SmelterMk1_C: building('Desc_SmelterMk1_C', 'smelter'),
      Desc_Wall_C: building('Desc_Wall_C', 'wall'),
    },
  }
}

describe('transform', () => {
  it('classifies producers as buildings and the rest as buildables', () => {
    const { data } = transform(fixture())
    expect(data.buildings.map((b) => b.slug)).toEqual(['smelter'])
    expect(data.buildables.map((b) => b.slug)).toEqual(['wall'])
  })

  it('resolves references to slugs', () => {
    const { data } = transform(fixture())
    const ingot = data.recipes.find((r) => r.slug === 'iron-ingot')
    expect(ingot?.ingredients).toEqual([{ item: 'iron-ore', amount: 1 }])
    expect(ingot?.producedIn).toEqual(['smelter'])
    const wall = data.recipes.find((r) => r.slug === 'wall')
    expect(wall?.products).toEqual([{ item: 'wall', amount: 1 }])
    expect(data.resources[0]?.item).toBe('iron-ore')
  })

  it('marks fluids', () => {
    const { data } = transform(fixture())
    expect(data.items.find((i) => i.slug === 'water')?.form).toBe('fluid')
    expect(data.items.find((i) => i.slug === 'iron-ore')?.form).toBe('solid')
  })

  it('de-duplicates colliding slugs deterministically', () => {
    const source = fixture()
    source.buildings.Desc_Wall2_C = building('Desc_Wall2_C', 'wall')
    const { data } = transform(source)
    expect(data.buildables.map((b) => b.slug).sort()).toEqual([
      'wall',
      'wall-2',
    ])
  })

  it('throws TransformError on unresolved recipe ingredient', () => {
    const source = fixture()
    source.recipes.Recipe_IngotIron_C.ingredients = [
      { item: 'Desc_DoesNotExist_C', amount: 1 },
    ]
    expect(() => transform(source)).toThrow(TransformError)
  })

  it('drops unresolved schematic unlock refs with a warning', () => {
    const source = fixture()
    source.schematics.Schematic_T1_C.unlock.recipes.push('Recipe_Missing_C')
    source.schematics.Schematic_T1_C.requiredSchematics.push(
      'Schematic_Missing_C',
    )
    const { data, warnings } = transform(source)
    const schem = data.schematics[0]
    expect(schem?.unlockRecipes).toEqual(['iron-ingot'])
    expect(schem?.requiredSchematics).toEqual([])
    expect(warnings).toHaveLength(2)
  })

  it('drops unresolved schematic cost items with a warning', () => {
    const source = fixture()
    source.schematics.Schematic_T1_C.cost.push({
      item: 'Desc_Missing_C',
      amount: 5,
    })
    const { data, warnings } = transform(source)
    const schem = data.schematics[0]
    expect(schem?.cost).toEqual([{ item: 'iron-ore', amount: 10 }])
    expect(warnings).toHaveLength(1)
  })
})
