import { FieldConfig } from '@/libs/forms';
import { InputAdornment } from '@mui/material';

// List of recipe categories
export const RECIPE_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'appetizer'];

// List of recipe keywords
export const RECIPE_KEYWORDS = [
  'fast',
  'easy',
  'healthy',
  'vegetarian',
  'vegan',
  'gluten-free',
  'low-carb',
  'low-fat',
  'low-calorie',
  'high-protein',
  'high-fiber',
  'kid-friendly',
  'budget-friendly',
];

export const RECIPE_FIELDS: {
  [key: string]: Partial<FieldConfig>;
} = {
  // name: {
  //   name: 'name',
  //   label: 'Name',
  // },
  // description: {
  //   name: 'description',
  //   label: 'Description',
  // },
  cuisine: {
    custom: {
      suggestions: RECIPE_CATEGORIES,
    },
  },
  // ingredients: {
  //   name: 'ingredients',
  //   label: 'Ingredients',
  // },
  instructions: {
    custom: {
      reorderable: true,
    },
  },
  'time.prep': {
    custom: {
      muiTextFieldProps: {
        slotProps: {
          input: {
            startAdornment: <InputAdornment position="start">Min</InputAdornment>,
          },
        },
      },
    },
  },
  'time.cooking': {
    custom: {
      muiTextFieldProps: {
        slotProps: {
          input: {
            startAdornment: <InputAdornment position="start">Min</InputAdornment>,
          },
        },
      },
    },
  },
  'time.total': {
    custom: {
      muiTextFieldProps: {
        slotProps: {
          input: {
            startAdornment: <InputAdornment position="start">Min</InputAdornment>,
          },
        },
      },
    },
  },
  // comments: {
  //   name: 'comments',
  //   label: 'Comments',
  // },
  // score: {
  //   name: 'score',
  //   label: 'Score',
  //   type: 'number',
  // },
  // url: {
  //   name: 'url',
  //   label: 'URL',
  //   type: 'url',
  // },
  // nutrition: {
  //   name: 'nutrition',
  //   label: 'Nutrition info',
  //   type: 'number',
  // },
  // category: {
  //   name: 'category',
  //   label: 'Category',
  // },
  yieldsQty: {
    name: 'yields.quantity',
    label: 'Quantity',
    type: 'number',
  },
  yieldsUnit: {
    name: 'yields.unit',
    label: 'Unit',
  },
  yieldsText: {
    name: 'yieldsText',
    label: 'Number of Servings',
  },
  keywords: {
    custom: {
      suggestions: RECIPE_KEYWORDS,
    },
  },
  // calories: {
  //   name: 'nutrients.calories',
  //   label: 'Calories',
  // },
  // images: {
  //   name: 'images',
  //   label: 'Images',
  // },
};
