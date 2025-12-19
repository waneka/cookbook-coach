import { z } from 'zod'
import { SHOPPING_LIST_STATUSES, ITEM_CATEGORIES } from '@/types/shopping-list'

// Shopping list item schema
export const shoppingListItemSchema = z.object({
  id: z.string(),
  ingredient: z.string().min(1, 'Ingredient name is required'),
  amount: z.string().optional(),
  unit: z.string().optional(),
  checked: z.boolean().default(false),
  category: z.enum(ITEM_CATEGORIES),
  recipeIds: z.array(z.string()).optional(),
})

export type ShoppingListItemValues = z.infer<typeof shoppingListItemSchema>

// New shopping list item (for adding manually)
export const newShoppingListItemSchema = z.object({
  ingredient: z.string().min(1, 'Ingredient name is required'),
  amount: z.string().optional(),
  unit: z.string().optional(),
  category: z.enum(ITEM_CATEGORIES).default('other').optional(),
})

export type NewShoppingListItemValues = z.input<typeof newShoppingListItemSchema>

// Shopping list creation schema
export const createShoppingListSchema = z.object({
  name: z.string().min(1, 'Shopping list name is required').max(200),
  meal_plan_id: z.string().uuid().optional(),
  items: z.array(shoppingListItemSchema).default([]),
})

export type CreateShoppingListValues = z.infer<typeof createShoppingListSchema>

// Shopping list update schema
export const updateShoppingListSchema = z.object({
  name: z.string().min(1, 'Shopping list name is required').max(200).optional(),
  items: z.array(shoppingListItemSchema).optional(),
  status: z.enum(SHOPPING_LIST_STATUSES).optional(),
})

export type UpdateShoppingListValues = z.infer<typeof updateShoppingListSchema>

// Update item checked status
export const updateItemCheckedSchema = z.object({
  itemId: z.string(),
  checked: z.boolean(),
})

export type UpdateItemCheckedValues = z.infer<typeof updateItemCheckedSchema>

// Add item to shopping list
export const addItemToListSchema = z.object({
  shopping_list_id: z.string().uuid(),
  item: newShoppingListItemSchema,
})

export type AddItemToListValues = z.infer<typeof addItemToListSchema>
