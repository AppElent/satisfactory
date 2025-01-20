import * as Yup from 'yup';

export const externalRecipeYupSchema = Yup.object().shape({
  author: Yup.string().default('').optional(),
  canonical_url: Yup.string().url('Invalid URL format').default('').optional(),
  category: Yup.string().default('').optional(),
  cook_time: Yup.number().integer().positive().default(0).optional(),
  cuisine: Yup.string().default('').optional(),
  description: Yup.string().default('').optional(),
  host: Yup.string().default('').optional(),
  image: Yup.string().url('Invalid URL format').default('').optional(),
  ingredient_groups: Yup.array().of(
    Yup.object().shape({
      ingredients: Yup.array().of(Yup.string().default('').optional()).default([]).optional(),
      purpose: Yup.string().nullable().default(null).optional(),
    })
  ).default([]).optional(),
  ingredients: Yup.array().of(Yup.string().default('').optional()).default([]).optional(),
  instructions: Yup.string().default('').optional(),
  instructions_list: Yup.array().of(Yup.string().default('').optional()).default([]).optional(),
  keywords: Yup.array().of(Yup.string().default('').optional()).default([]).optional(),
  language: Yup.string().default('').optional(),
  nutrients: Yup.object().shape({
    calories: Yup.string().default('').optional(),
    carbohydrateContent: Yup.string().default('').optional(),
    cholesterolContent: Yup.string().default('').optional(),
    fatContent: Yup.string().default('').optional(),
    fiberContent: Yup.string().default('').optional(),
    proteinContent: Yup.string().default('').optional(),
    saturatedFatContent: Yup.string().default('').optional(),
    servingSize: Yup.string().default('').optional(),
    sodiumContent: Yup.string().default('').optional(),
    sugarContent: Yup.string().default('').optional(),
    transFatContent: Yup.string().default('').optional(),
    unsaturatedFatContent: Yup.string().default('').optional(),
  }).default({}).optional(),
  prep_time: Yup.number().integer().positive().default(0).optional(),
  ratings: Yup.number().min(0).max(5).default(0).optional(),
  ratings_count: Yup.number().integer().min(0).default(0).optional(),
  site_name: Yup.string().default('').optional(),
  title: Yup.string().default('').optional(),
  total_time: Yup.number().integer().positive().default(0).optional(),
  yields: Yup.string().default('').optional(),
});

export interface ExternalRecipe extends Yup.InferType<typeof externalRecipeYupSchema> {
  // using interface instead of type generally gives nicer editor feedback
  randomString?: string;
  // createdAt?: string | undefined; //TODO: Make dates
  // updatedAt?: string | undefined;
}

// export const externalRecipeDefaultValues: Partial<ExternalRecipe> = externalRecipeYupSchema.getDefault();
