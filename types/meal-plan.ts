import { Database } from './supabase'

// Database types
export type MealPlan = Database['public']['Tables']['meal_plans']['Row']
export type MealPlanInsert = Database['public']['Tables']['meal_plans']['Insert']
export type MealPlanUpdate = Database['public']['Tables']['meal_plans']['Update']

export type MealPlanItem = Database['public']['Tables']['meal_plan_items']['Row']
export type MealPlanItemInsert = Database['public']['Tables']['meal_plan_items']['Insert']
export type MealPlanItemUpdate = Database['public']['Tables']['meal_plan_items']['Update']

// Meal type enum
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealType = typeof MEAL_TYPES[number]

// Dietary requirements structure
export interface DietaryRequirements {
  restrictions?: string[]  // e.g., ['vegan', 'gluten-free']
  preferences?: string[]   // e.g., ['low-carb', 'high-protein']
  goals?: string[]         // e.g., ['weight-loss', 'muscle-gain']
}

// Form data types (for creating/editing meal plans)
export interface MealPlanFormData {
  name: string
  start_date: string
  end_date: string
  dietary_requirements?: DietaryRequirements
}

// Meal plan with parsed JSON fields
export interface MealPlanWithParsedFields extends Omit<MealPlan, 'dietary_requirements'> {
  dietary_requirements?: DietaryRequirements
}

// Meal plan item with recipe details
export interface MealPlanItemWithRecipe extends MealPlanItem {
  recipe?: {
    id: string
    title: string
    image_url?: string
    prep_time_minutes?: number
    cook_time_minutes?: number
  } | null
}

// Meal plan with all items
export interface MealPlanWithItems extends MealPlanWithParsedFields {
  items: MealPlanItemWithRecipe[]
}

// Grouped meal plan items by date
export interface MealsByDate {
  [date: string]: {
    breakfast: MealPlanItemWithRecipe[]
    lunch: MealPlanItemWithRecipe[]
    dinner: MealPlanItemWithRecipe[]
    snack: MealPlanItemWithRecipe[]
  }
}
