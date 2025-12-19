import { z } from 'zod'
import { MEAL_TYPES } from '@/types/meal-plan'

// Dietary requirements schema
export const dietaryRequirementsSchema = z.object({
  restrictions: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
}).nullable().optional()

// Meal plan form schema
export const mealPlanFormSchema = z.object({
  name: z.string().min(1, 'Meal plan name is required').max(200, 'Name is too long'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  dietary_requirements: dietaryRequirementsSchema,
}).refine((data) => {
  // Ensure end_date is after start_date
  const start = new Date(data.start_date)
  const end = new Date(data.end_date)
  return end >= start
}, {
  message: 'End date must be on or after start date',
  path: ['end_date'],
})

export type MealPlanFormValues = z.infer<typeof mealPlanFormSchema>

// Meal plan item schema
export const mealPlanItemSchema = z.object({
  user_id: z.string().uuid(),
  meal_plan_id: z.string().uuid().nullable().optional(),
  recipe_id: z.string().uuid().nullable().optional(),
  date: z.string().min(1, 'Date is required'),
  meal_type: z.enum(MEAL_TYPES, {
    message: 'Meal type is required',
  }),
  servings: z.number().int().min(1).max(100).default(1),
  notes: z.string().max(500, 'Notes are too long').optional(),
  position: z.number().int().min(0).default(0),
})

export type MealPlanItemFormValues = z.infer<typeof mealPlanItemSchema>

// Schema for adding a recipe to a meal slot (meal_plan_id is optional now)
export const addRecipeToMealSlotSchema = z.object({
  meal_plan_id: z.string().uuid().nullable().optional(),
  recipe_id: z.string().uuid(),
  date: z.string().min(1, 'Date is required'),
  meal_type: z.enum(MEAL_TYPES),
  servings: z.number().int().min(1).max(100).optional(),
  notes: z.string().max(500).optional(),
})

export type AddRecipeToMealSlotValues = z.infer<typeof addRecipeToMealSlotSchema>
