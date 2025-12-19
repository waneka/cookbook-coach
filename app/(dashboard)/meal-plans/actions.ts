'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { mealPlanFormSchema, mealPlanItemSchema, addRecipeToMealSlotSchema } from '@/lib/validations/meal-plan'
import { revalidatePath } from 'next/cache'
import type { MealPlanFormValues, MealPlanItemFormValues, AddRecipeToMealSlotValues } from '@/lib/validations/meal-plan'
import type { MealPlanWithItems, MealPlanItemWithRecipe } from '@/types/meal-plan'

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

export async function createMealPlan(data: MealPlanFormValues) {
  try {
    // Validate input
    const validated = mealPlanFormSchema.parse(data)
    const userId = await getUserId()

    const supabase = await createClient()

    const { data: mealPlan, error } = await supabase
      .from('meal_plans')
      .insert({
        user_id: userId,
        name: validated.name,
        start_date: validated.start_date,
        end_date: validated.end_date,
        dietary_requirements: validated.dietary_requirements as any,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/meal-plans')
    return { success: true, data: mealPlan }
  } catch (error) {
    console.error('Create meal plan error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create meal plan',
    }
  }
}

export async function updateMealPlan(id: string, data: MealPlanFormValues) {
  try {
    const validated = mealPlanFormSchema.parse(data)
    const userId = await getUserId()

    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('meal_plans')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== userId) {
      throw new Error('Meal plan not found or unauthorized')
    }

    const { data: mealPlan, error } = await supabase
      .from('meal_plans')
      .update({
        name: validated.name,
        start_date: validated.start_date,
        end_date: validated.end_date,
        dietary_requirements: validated.dietary_requirements as any,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/meal-plans')
    revalidatePath(`/meal-plans/${id}`)
    return { success: true, data: mealPlan }
  } catch (error) {
    console.error('Update meal plan error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update meal plan',
    }
  }
}

export async function deleteMealPlan(id: string) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('meal_plans')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== userId) {
      throw new Error('Meal plan not found or unauthorized')
    }

    const { error } = await supabase.from('meal_plans').delete().eq('id', id)

    if (error) throw error

    revalidatePath('/meal-plans')
    return { success: true }
  } catch (error) {
    console.error('Delete meal plan error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete meal plan',
    }
  }
}

export async function getMealPlans() {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Get meal plans error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch meal plans',
      data: [],
    }
  }
}

export async function getMealPlan(id: string) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    // Get meal plan
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (mealPlanError) throw mealPlanError

    // Get meal plan items with recipe details
    const { data: items, error: itemsError } = await supabase
      .from('meal_plan_items')
      .select(`
        *,
        recipe:recipes(id, title, image_url, prep_time_minutes, cook_time_minutes)
      `)
      .eq('meal_plan_id', id)
      .order('date', { ascending: true })
      .order('position', { ascending: true })

    if (itemsError) throw itemsError

    const mealPlanWithItems: MealPlanWithItems = {
      ...mealPlan,
      items: items as MealPlanItemWithRecipe[],
    }

    return { success: true, data: mealPlanWithItems }
  } catch (error) {
    console.error('Get meal plan error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Meal plan not found',
      data: null,
    }
  }
}

// Add a recipe to a meal slot
export async function addRecipeToMealSlot(data: AddRecipeToMealSlotValues) {
  try {
    const validated = addRecipeToMealSlotSchema.parse(data)
    const userId = await getUserId()

    const supabase = await createClient()

    // Verify meal plan ownership
    const { data: mealPlan } = await supabase
      .from('meal_plans')
      .select('user_id')
      .eq('id', validated.meal_plan_id)
      .single()

    if (!mealPlan || mealPlan.user_id !== userId) {
      throw new Error('Meal plan not found or unauthorized')
    }

    // Get the current max position for this meal slot
    const { data: existingItems } = await supabase
      .from('meal_plan_items')
      .select('position')
      .eq('meal_plan_id', validated.meal_plan_id)
      .eq('date', validated.date)
      .eq('meal_type', validated.meal_type)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = existingItems && existingItems.length > 0
      ? (existingItems[0].position || 0) + 1
      : 0

    const { data: mealPlanItem, error } = await supabase
      .from('meal_plan_items')
      .insert({
        meal_plan_id: validated.meal_plan_id,
        recipe_id: validated.recipe_id,
        date: validated.date,
        meal_type: validated.meal_type,
        servings: validated.servings || 1,
        notes: validated.notes || null,
        position: nextPosition,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/meal-plans/${validated.meal_plan_id}`)
    return { success: true, data: mealPlanItem }
  } catch (error) {
    console.error('Add recipe to meal slot error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add recipe to meal plan',
    }
  }
}

// Update a meal plan item
export async function updateMealPlanItem(itemId: string, data: Partial<MealPlanItemFormValues>) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    // Verify ownership through meal plan
    const { data: item } = await supabase
      .from('meal_plan_items')
      .select('meal_plan_id')
      .eq('id', itemId)
      .single()

    if (!item) throw new Error('Meal plan item not found')

    const { data: mealPlan } = await supabase
      .from('meal_plans')
      .select('user_id')
      .eq('id', item.meal_plan_id)
      .single()

    if (!mealPlan || mealPlan.user_id !== userId) {
      throw new Error('Unauthorized')
    }

    const { data: updatedItem, error } = await supabase
      .from('meal_plan_items')
      .update(data)
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/meal-plans/${item.meal_plan_id}`)
    return { success: true, data: updatedItem }
  } catch (error) {
    console.error('Update meal plan item error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update meal plan item',
    }
  }
}

// Remove a meal plan item
export async function removeMealPlanItem(itemId: string) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    // Verify ownership through meal plan
    const { data: item } = await supabase
      .from('meal_plan_items')
      .select('meal_plan_id')
      .eq('id', itemId)
      .single()

    if (!item) throw new Error('Meal plan item not found')

    const { data: mealPlan } = await supabase
      .from('meal_plans')
      .select('user_id')
      .eq('id', item.meal_plan_id)
      .single()

    if (!mealPlan || mealPlan.user_id !== userId) {
      throw new Error('Unauthorized')
    }

    const { error } = await supabase
      .from('meal_plan_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error

    revalidatePath(`/meal-plans/${item.meal_plan_id}`)
    return { success: true }
  } catch (error) {
    console.error('Remove meal plan item error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove meal plan item',
    }
  }
}
