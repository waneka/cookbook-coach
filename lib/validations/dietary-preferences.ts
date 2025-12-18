import { z } from 'zod'

// Common allergies
export const COMMON_ALLERGIES = [
  'peanuts',
  'tree-nuts',
  'milk',
  'eggs',
  'wheat',
  'soy',
  'fish',
  'shellfish',
  'sesame',
  'gluten',
] as const

// Common diet types
export const DIET_TYPES = [
  'vegetarian',
  'vegan',
  'pescatarian',
  'keto',
  'paleo',
  'low-carb',
  'low-fat',
  'mediterranean',
  'whole30',
  'diabetic-friendly',
] as const

// Common dietary restrictions
export const DIETARY_RESTRICTIONS = [
  'no-pork',
  'no-beef',
  'no-alcohol',
  'halal',
  'kosher',
  'no-processed-foods',
  'organic-only',
] as const

// Dietary preferences schema
export const dietaryPreferencesSchema = z.object({
  allergies: z.array(z.string()),
  diets: z.array(z.string()),
  restrictions: z.array(z.string()),
})

// Update dietary preferences schema (for forms)
export const updateDietaryPreferencesSchema = z.object({
  dietary_preferences: dietaryPreferencesSchema,
  dietary_notes: z.string().max(2000).optional().nullable(),
})

export type DietaryPreferences = z.infer<typeof dietaryPreferencesSchema>
export type UpdateDietaryPreferencesValues = z.infer<typeof updateDietaryPreferencesSchema>
