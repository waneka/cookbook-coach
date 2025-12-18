import { z } from 'zod'

// Ingredient schema
export const ingredientSchema = z.object({
  item: z.string().min(1, 'Ingredient name is required'),
  amount: z.string(),
  unit: z.string().optional(),
  notes: z.string().optional(),
})

// Nutrition info schema
export const nutritionInfoSchema = z.object({
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  fiber: z.number().optional(),
}).nullable().optional()

// Instruction schema (for form compatibility with useFieldArray)
export const instructionSchema = z.object({
  value: z.string().min(1, 'Instruction cannot be empty'),
})

// Recipe form schema
export const recipeFormSchema = z.object({
  title: z.string().min(1, 'Recipe title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  source_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  prep_time_minutes: z.number().int().min(0).max(1440).nullish(),
  cook_time_minutes: z.number().int().min(0).max(1440).nullish(),
  servings: z.number().int().min(1).max(100),
  ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required'),
  instructions: z.array(instructionSchema).min(1, 'At least one instruction is required'),
  tags: z.array(z.string()),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
  nutrition_info: nutritionInfoSchema,
  is_public: z.boolean(),
})

export type RecipeFormValues = z.infer<typeof recipeFormSchema>
