'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import {
  createShoppingListSchema,
  updateShoppingListSchema,
  addItemToListSchema,
  updateItemCheckedSchema,
} from '@/lib/validations/shopping-list'
import { revalidatePath } from 'next/cache'
import type {
  CreateShoppingListValues,
  UpdateShoppingListValues,
  AddItemToListValues,
  UpdateItemCheckedValues,
} from '@/lib/validations/shopping-list'
import type { ShoppingListWithParsedFields, ShoppingListItem, ItemCategory } from '@/types/shopping-list'
import type { Ingredient } from '@/types/recipe'

// Get current user's database ID
async function getUserId() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()

  if (!user) throw new Error('User not found')
  return user.id
}

// Helper function to normalize ingredient names for better consolidation
function normalizeIngredientName(ingredient: string): string {
  let normalized = ingredient.toLowerCase().trim()

  // Remove common preparation methods
  const preparationWords = [
    'chopped', 'minced', 'diced', 'sliced', 'crushed', 'grated', 'shredded',
    'julienned', 'cubed', 'halved', 'quartered', 'whole', 'ground', 'crumbled',
    'melted', 'softened', 'beaten', 'whisked', 'sifted', 'peeled', 'seeded',
    'trimmed', 'cleaned', 'rinsed', 'drained', 'thawed', 'cooked', 'uncooked',
    'raw', 'roasted', 'toasted', 'blanched'
  ]
  preparationWords.forEach(word => {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'gi'), '')
  })

  // Remove common qualifiers
  const qualifiers = [
    'fresh', 'freshly', 'dried', 'frozen', 'canned', 'jarred', 'bottled',
    'organic', 'kosher', 'sea', 'fine', 'coarse', 'extra virgin', 'virgin',
    'light', 'dark', 'heavy', 'regular', 'low-fat', 'non-fat', 'whole',
    'skim', 'reduced-fat', 'unsalted', 'salted', 'sweetened', 'unsweetened'
  ]
  qualifiers.forEach(word => {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, 'gi'), '')
  })

  // Standardize common ingredient variations
  const ingredientMap: Record<string, string> = {
    'garlic cloves': 'garlic',
    'cloves garlic': 'garlic',
    'clove garlic': 'garlic',
    'garlic clove': 'garlic',
    'clove': 'garlic',
    'cloves': 'garlic',
    'black pepper': 'pepper',
    'white pepper': 'pepper',
    'ground pepper': 'pepper',
    'parsley stems': 'parsley',
    'parsley sprigs': 'parsley',
    'parsley leaves': 'parsley',
    'sprig parsley': 'parsley',
    'sprigs parsley': 'parsley',
    'cilantro stems': 'cilantro',
    'cilantro leaves': 'cilantro',
    'basil leaves': 'basil',
    'bay leaves': 'bay leaf',
    'bay leaf': 'bay leaf',
    'onion': 'onion',
    'onions': 'onion',
    'tomato': 'tomato',
    'tomatoes': 'tomato',
    'celery stalks': 'celery',
    'celery stalk': 'celery',
    'stalk celery': 'celery',
    'stalks celery': 'celery',
  }

  // Clean up extra spaces and commas
  normalized = normalized.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()

  // Check if normalized version matches any mapping
  for (const [variant, standard] of Object.entries(ingredientMap)) {
    if (normalized.includes(variant)) {
      normalized = standard
      break
    }
  }

  return normalized
}

// Helper function to categorize ingredients
function categorizeIngredient(ingredient: string): ItemCategory {
  const lower = ingredient.toLowerCase()

  // Produce
  if (/(vegetable|fruit|lettuce|tomato|onion|garlic|pepper|carrot|potato|apple|banana|berry|greens|spinach|kale|celery|cucumber|zucchini|squash|broccoli|cauliflower|mushroom|herb|cilantro|parsley|basil)/i.test(lower)) {
    return 'produce'
  }

  // Meat
  if (/(chicken|beef|pork|turkey|fish|salmon|tuna|shrimp|meat|steak|bacon|sausage)/i.test(lower)) {
    return 'meat'
  }

  // Dairy
  if (/(milk|cheese|yogurt|butter|cream|sour cream|cottage cheese|parmesan|mozzarella|cheddar|egg)/i.test(lower)) {
    return 'dairy'
  }

  // Frozen
  if (/(frozen|ice cream)/i.test(lower)) {
    return 'frozen'
  }

  // Bakery
  if (/(bread|bun|roll|bagel|tortilla|pita|croissant)/i.test(lower)) {
    return 'bakery'
  }

  // Beverages
  if (/(juice|soda|coffee|tea|water|wine|beer|beverage|drink)/i.test(lower)) {
    return 'beverages'
  }

  // Default to pantry
  return 'pantry'
}

// Aggregate ingredients from recipes
function aggregateIngredients(recipes: Array<{ ingredients: Ingredient[], id: string, date: string }>): ShoppingListItem[] {
  const itemsMap = new Map<string, ShoppingListItem>()

  recipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      // Use normalized name as the key for better consolidation
      const key = normalizeIngredientName(ingredient.item)
      const existing = itemsMap.get(key)

      if (existing) {
        // Add to recipe breakdown
        if (!existing.recipeBreakdown) {
          existing.recipeBreakdown = []
        }
        existing.recipeBreakdown.push({
          recipeId: recipe.id,
          amount: ingredient.amount,
          unit: ingredient.unit,
          date: recipe.date,
        })

        // Try to aggregate amounts intelligently
        if (ingredient.amount && existing.amount) {
          // Check if units match (or both have no unit)
          const unitsMatch = existing.unit === ingredient.unit

          if (unitsMatch) {
            // Try numeric addition
            const existingNum = parseFloat(existing.amount)
            const newNum = parseFloat(ingredient.amount)

            if (!isNaN(existingNum) && !isNaN(newNum)) {
              existing.amount = (existingNum + newNum).toString()
            } else {
              // Can't add numerically - show "Various amounts" instead of messy concatenation
              existing.amount = 'Various amounts'
              existing.unit = undefined
            }
          } else {
            // Different units or one has no unit - can't aggregate cleanly
            existing.amount = 'Various amounts'
            existing.unit = undefined
          }
        } else if (ingredient.amount && !existing.amount) {
          existing.amount = ingredient.amount
          existing.unit = ingredient.unit
        }

        // Track which recipes this ingredient comes from
        if (existing.recipeIds && !existing.recipeIds.includes(recipe.id)) {
          existing.recipeIds.push(recipe.id)
        }
      } else {
        // New ingredient - use normalized name for display
        const displayName = key.charAt(0).toUpperCase() + key.slice(1)
        itemsMap.set(key, {
          id: crypto.randomUUID(),
          ingredient: displayName,
          amount: ingredient.amount,
          unit: ingredient.unit,
          checked: false,
          category: categorizeIngredient(ingredient.item),
          recipeIds: [recipe.id],
          recipeBreakdown: [
            {
              recipeId: recipe.id,
              amount: ingredient.amount,
              unit: ingredient.unit,
              date: recipe.date,
            },
          ],
        })
      }
    })
  })

  return Array.from(itemsMap.values()).sort((a, b) => {
    // Sort by category, then by ingredient name
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category)
    }
    return a.ingredient.localeCompare(b.ingredient)
  })
}

export async function getShoppingLists() {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Get shopping lists error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch shopping lists',
      data: [],
    }
  }
}

export async function getShoppingList(id: string) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    if (!data) throw new Error('Shopping list not found')

    // Parse items from JSONB
    const items = (data.items as ShoppingListItem[]) || []

    // Collect all unique recipe IDs
    const recipeIds = new Set<string>()
    items.forEach((item) => {
      if (item.recipeIds) {
        item.recipeIds.forEach((id) => recipeIds.add(id))
      }
    })

    // Fetch recipe titles
    const recipeMap: Record<string, string> = {}
    if (recipeIds.size > 0) {
      const { data: recipes } = await supabase
        .from('recipes')
        .select('id, title')
        .in('id', Array.from(recipeIds))

      if (recipes) {
        recipes.forEach((recipe) => {
          recipeMap[recipe.id] = recipe.title
        })
      }
    }

    const parsed: ShoppingListWithParsedFields & { recipeMap: Record<string, string> } = {
      ...data,
      items,
      recipeMap,
    }

    return { success: true, data: parsed }
  } catch (error) {
    console.error('Get shopping list error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch shopping list',
    }
  }
}

export async function createShoppingList(data: CreateShoppingListValues) {
  try {
    const validated = createShoppingListSchema.parse(data)
    const userId = await getUserId()
    const supabase = await createClient()

    const { data: shoppingList, error } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: userId,
        meal_plan_id: validated.meal_plan_id || null,
        name: validated.name,
        items: validated.items as any,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/shopping-lists')
    return { success: true, data: shoppingList }
  } catch (error) {
    console.error('Create shopping list error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create shopping list',
    }
  }
}

export async function generateShoppingListFromMealPlan(mealPlanId: string) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    // Get meal plan with items and recipes
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select(`
        *,
        items:meal_plan_items(
          *,
          recipe:recipes(
            id,
            title,
            ingredients
          )
        )
      `)
      .eq('id', mealPlanId)
      .eq('user_id', userId)
      .single()

    if (mealPlanError) throw mealPlanError
    if (!mealPlan) throw new Error('Meal plan not found')

    // Extract recipes with ingredients and dates
    const recipes = mealPlan.items
      .filter((item: any) => item.recipe && item.recipe.ingredients)
      .map((item: any) => ({
        id: item.recipe.id,
        ingredients: item.recipe.ingredients as Ingredient[],
        date: item.date,
      }))

    if (recipes.length === 0) {
      throw new Error('No recipes found in meal plan')
    }

    // Aggregate ingredients
    const aggregatedItems = aggregateIngredients(recipes)

    // Create shopping list
    const { data: shoppingList, error } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: userId,
        meal_plan_id: mealPlanId,
        name: `${mealPlan.name} - Shopping List`,
        items: aggregatedItems as any,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/shopping-lists')
    revalidatePath(`/meal-plans/${mealPlanId}`)
    return { success: true, data: shoppingList }
  } catch (error) {
    console.error('Generate shopping list error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate shopping list',
    }
  }
}

export async function updateShoppingList(id: string, data: UpdateShoppingListValues) {
  try {
    const validated = updateShoppingListSchema.parse(data)
    const userId = await getUserId()
    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('shopping_lists')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== userId) {
      throw new Error('Shopping list not found or unauthorized')
    }

    const updateData: any = {}
    if (validated.name) updateData.name = validated.name
    if (validated.items) updateData.items = validated.items
    if (validated.status) updateData.status = validated.status

    const { data: shoppingList, error } = await supabase
      .from('shopping_lists')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/shopping-lists')
    revalidatePath(`/shopping-lists/${id}`)
    return { success: true, data: shoppingList }
  } catch (error) {
    console.error('Update shopping list error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update shopping list',
    }
  }
}

export async function addItemToShoppingList(data: AddItemToListValues) {
  try {
    const validated = addItemToListSchema.parse(data)
    const userId = await getUserId()
    const supabase = await createClient()

    // Get current shopping list
    const { data: shoppingList } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('id', validated.shopping_list_id)
      .eq('user_id', userId)
      .single()

    if (!shoppingList) throw new Error('Shopping list not found')

    const currentItems = (shoppingList.items as ShoppingListItem[]) || []

    const newItem: ShoppingListItem = {
      id: crypto.randomUUID(),
      ingredient: validated.item.ingredient,
      amount: validated.item.amount,
      unit: validated.item.unit,
      checked: false,
      category: validated.item.category || categorizeIngredient(validated.item.ingredient),
    }

    const updatedItems = [...currentItems, newItem]

    const { data: updated, error } = await supabase
      .from('shopping_lists')
      .update({ items: updatedItems as any })
      .eq('id', validated.shopping_list_id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/shopping-lists')
    revalidatePath(`/shopping-lists/${validated.shopping_list_id}`)
    return { success: true, data: updated }
  } catch (error) {
    console.error('Add item error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add item',
    }
  }
}

export async function updateItemChecked(shoppingListId: string, data: UpdateItemCheckedValues) {
  try {
    const validated = updateItemCheckedSchema.parse(data)
    const userId = await getUserId()
    const supabase = await createClient()

    // Get current shopping list
    const { data: shoppingList } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('id', shoppingListId)
      .eq('user_id', userId)
      .single()

    if (!shoppingList) throw new Error('Shopping list not found')

    const currentItems = (shoppingList.items as ShoppingListItem[]) || []
    const updatedItems = currentItems.map((item) =>
      item.id === validated.itemId ? { ...item, checked: validated.checked } : item
    )

    const { data: updated, error } = await supabase
      .from('shopping_lists')
      .update({ items: updatedItems as any })
      .eq('id', shoppingListId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/shopping-lists')
    revalidatePath(`/shopping-lists/${shoppingListId}`)
    return { success: true, data: updated }
  } catch (error) {
    console.error('Update item checked error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update item',
    }
  }
}

export async function deleteShoppingList(id: string) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('shopping_lists')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== userId) {
      throw new Error('Shopping list not found or unauthorized')
    }

    const { error } = await supabase.from('shopping_lists').delete().eq('id', id)

    if (error) throw error

    revalidatePath('/shopping-lists')
    return { success: true }
  } catch (error) {
    console.error('Delete shopping list error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete shopping list',
    }
  }
}

export async function deleteItemFromShoppingList(shoppingListId: string, itemId: string) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    // Get current shopping list
    const { data: shoppingList } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('id', shoppingListId)
      .eq('user_id', userId)
      .single()

    if (!shoppingList) throw new Error('Shopping list not found')

    const currentItems = (shoppingList.items as ShoppingListItem[]) || []
    const updatedItems = currentItems.filter((item) => item.id !== itemId)

    const { data: updated, error } = await supabase
      .from('shopping_lists')
      .update({ items: updatedItems as any })
      .eq('id', shoppingListId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/shopping-lists')
    revalidatePath(`/shopping-lists/${shoppingListId}`)
    return { success: true, data: updated }
  } catch (error) {
    console.error('Delete item error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete item',
    }
  }
}
