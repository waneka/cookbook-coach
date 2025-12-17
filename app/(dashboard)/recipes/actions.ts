'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { recipeFormSchema } from '@/lib/validations/recipe'
import { revalidatePath } from 'next/cache'
import type { RecipeFormValues } from '@/lib/validations/recipe'

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

export async function createRecipe(data: RecipeFormValues) {
  try {
    // Validate input
    const validated = recipeFormSchema.parse(data)
    const userId = await getUserId()

    const supabase = await createClient()

    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert({
        user_id: userId,
        title: validated.title,
        description: validated.description || null,
        source_url: validated.source_url || null,
        prep_time_minutes: validated.prep_time_minutes || null,
        cook_time_minutes: validated.cook_time_minutes || null,
        servings: validated.servings || null,
        ingredients: validated.ingredients as any,
        instructions: validated.instructions.map(i => i.value) as any,
        tags: validated.tags,
        image_url: validated.image_url || null,
        nutrition_info: validated.nutrition_info as any,
        is_public: validated.is_public,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/recipes')
    return { success: true, data: recipe }
  } catch (error) {
    console.error('Create recipe error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create recipe',
    }
  }
}

export async function updateRecipe(id: string, data: RecipeFormValues) {
  try {
    const validated = recipeFormSchema.parse(data)
    const userId = await getUserId()

    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('recipes')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== userId) {
      throw new Error('Recipe not found or unauthorized')
    }

    const { data: recipe, error} = await supabase
      .from('recipes')
      .update({
        title: validated.title,
        description: validated.description || null,
        source_url: validated.source_url || null,
        prep_time_minutes: validated.prep_time_minutes || null,
        cook_time_minutes: validated.cook_time_minutes || null,
        servings: validated.servings || null,
        ingredients: validated.ingredients as any,
        instructions: validated.instructions.map(i => i.value) as any,
        tags: validated.tags,
        image_url: validated.image_url || null,
        nutrition_info: validated.nutrition_info as any,
        is_public: validated.is_public,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/recipes')
    revalidatePath(`/recipes/${id}`)
    return { success: true, data: recipe }
  } catch (error) {
    console.error('Update recipe error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update recipe',
    }
  }
}

export async function deleteRecipe(id: string) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('recipes')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== userId) {
      throw new Error('Recipe not found or unauthorized')
    }

    const { error } = await supabase.from('recipes').delete().eq('id', id)

    if (error) throw error

    revalidatePath('/recipes')
    return { success: true }
  } catch (error) {
    console.error('Delete recipe error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete recipe',
    }
  }
}

export async function getRecipes(filters?: {
  search?: string
  tags?: string[]
  limit?: number
}) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    let query = supabase
      .from('recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply search filter
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Apply tag filter
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    // Apply limit
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Get recipes error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recipes',
      data: [],
    }
  }
}

export async function getRecipe(id: string) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Get recipe error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Recipe not found',
      data: null,
    }
  }
}
