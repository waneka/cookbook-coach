import type { Database } from './supabase'

export type ShoppingList = Database['public']['Tables']['shopping_lists']['Row']
export type ShoppingListInsert = Database['public']['Tables']['shopping_lists']['Insert']
export type ShoppingListUpdate = Database['public']['Tables']['shopping_lists']['Update']

export const SHOPPING_LIST_STATUSES = ['active', 'completed', 'archived'] as const
export type ShoppingListStatus = typeof SHOPPING_LIST_STATUSES[number]

export const ITEM_CATEGORIES = [
  'produce',
  'meat',
  'dairy',
  'pantry',
  'frozen',
  'bakery',
  'beverages',
  'other',
] as const
export type ItemCategory = typeof ITEM_CATEGORIES[number]

export interface ShoppingListItem {
  id: string
  ingredient: string
  amount?: string
  unit?: string
  checked: boolean
  category: ItemCategory
  recipeIds?: string[] // Track which recipes this ingredient comes from
  recipeBreakdown?: Array<{
    recipeId: string
    amount?: string
    unit?: string
    date?: string
  }>
}

export interface ShoppingListWithParsedFields extends Omit<ShoppingList, 'items'> {
  items: ShoppingListItem[]
}

// Helper type for creating new items
export interface NewShoppingListItem {
  ingredient: string
  amount?: string
  unit?: string
  category?: ItemCategory
}
