import { Database } from './supabase'

// Database types
export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update']

// Ingredient structure
export interface Ingredient {
  item: string
  amount: string
  unit?: string
  notes?: string
}

// Instruction is just a string
export type Instruction = string

// Nutrition info structure
export interface NutritionInfo {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
}

// Form data types (for creating/editing recipes)
export interface RecipeFormData {
  title: string
  description?: string
  source_url?: string
  prep_time_minutes?: number
  cook_time_minutes?: number
  servings?: number
  ingredients: Ingredient[]
  instructions: Instruction[]
  tags: string[]
  image_url?: string
  nutrition_info?: NutritionInfo
  is_public: boolean
}

// Recipe with parsed JSON fields
export interface RecipeWithParsedFields extends Omit<Recipe, 'ingredients' | 'instructions' | 'nutrition_info'> {
  ingredients: Ingredient[]
  instructions: Instruction[]
  nutrition_info?: NutritionInfo
}
