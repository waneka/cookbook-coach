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

    // Apply tag filter (this can be done at DB level)
    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags)
    }

    const { data, error } = await query

    if (error) throw error

    // Apply search filter client-side to search in title, description, ingredients, and tags
    let filteredData = data || []
    if (filters?.search && filteredData.length > 0) {
      const searchLower = filters.search.toLowerCase()
      filteredData = filteredData.filter((recipe) => {
        // Search in title
        if (recipe.title?.toLowerCase().includes(searchLower)) return true

        // Search in description
        if (recipe.description?.toLowerCase().includes(searchLower)) return true

        // Search in ingredients
        if (Array.isArray(recipe.ingredients)) {
          const ingredientsMatch = recipe.ingredients.some((ingredient: any) => {
            return ingredient.item?.toLowerCase().includes(searchLower)
          })
          if (ingredientsMatch) return true
        }

        // Search in tags
        if (Array.isArray(recipe.tags)) {
          const tagsMatch = recipe.tags.some((tag: string) =>
            tag.toLowerCase().includes(searchLower)
          )
          if (tagsMatch) return true
        }

        return false
      })
    }

    // Apply limit after filtering
    if (filters?.limit && filteredData.length > filters.limit) {
      filteredData = filteredData.slice(0, filters.limit)
    }

    return { success: true, data: filteredData }
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

export async function getUserTags() {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('recipes')
      .select('tags')
      .eq('user_id', userId)

    if (error) throw error

    // Extract unique tags from all recipes
    const allTags = new Set<string>()
    data?.forEach((recipe) => {
      if (Array.isArray(recipe.tags)) {
        recipe.tags.forEach((tag) => allTags.add(tag))
      }
    })

    return { success: true, data: Array.from(allTags).sort() }
  } catch (error) {
    console.error('Get user tags error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch tags',
      data: [],
    }
  }
}

export async function detectRecipeTags(recipeData: {
  title?: string
  description?: string
  ingredients?: Array<{ item: string; amount: string; unit?: string }>
  instructions?: Array<{ value: string }>
}) {
  try {
    const prompt = `Analyze this recipe and suggest 3-5 relevant tags. Tags should be lowercase, single words or hyphenated phrases.

Recipe Title: ${recipeData.title || 'Untitled'}
Description: ${recipeData.description || 'No description'}
Ingredients: ${recipeData.ingredients?.map(i => i.item).join(', ') || 'None'}
Instructions: ${recipeData.instructions?.map(i => i.value).join(' ') || 'None'}

Consider these categories:
- Cuisine type (italian, mexican, asian, indian, french, etc.)
- Meal type (breakfast, lunch, dinner, snack, dessert, appetizer)
- Dietary (vegetarian, vegan, gluten-free, dairy-free, keto, paleo)
- Cooking method (baked, grilled, fried, roasted, instant-pot, slow-cooker, no-cook)
- Speed/effort (quick, easy, 30-min, weeknight, weekend)
- Main ingredient (chicken, beef, pork, fish, pasta, rice, salad)
- Occasion (holiday, party, comfort-food, healthy)

Return ONLY a JSON array of 3-5 tag strings, nothing else.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to detect tags')
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse JSON response
    const tags = JSON.parse(content.trim())

    return { success: true, data: tags }
  } catch (error) {
    console.error('Detect recipe tags error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to detect tags',
      data: [],
    }
  }
}
