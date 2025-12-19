import { anthropic } from '@ai-sdk/anthropic'
import { streamText, convertToModelMessages, tool, stepCountIs } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getRecipes, createRecipe, importRecipeFromUrl } from '@/app/(dashboard)/recipes/actions'
import { updateDietaryPreferences, getUserProfile } from '@/app/(dashboard)/profile/actions'
import { createMealPlan, getMealPlans, addRecipeToMealSlot } from '@/app/(dashboard)/meal-plans/actions'
import { dietaryPreferencesSchema } from '@/lib/validations/dietary-preferences'
import { ingredientSchema } from '@/lib/validations/recipe'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages } = await req.json()

    // Get user profile to include dietary preferences in context
    const profileResult = await getUserProfile()
    const userProfile = profileResult.success ? profileResult.data : null

    const searchRecipesTool = tool({
      description: 'Search the user\'s recipe library. Use this when the user asks about recipes, meal ideas, or what they can cook.',
      inputSchema: z.object({
        search: z.string().optional().describe('Search query to filter recipes by title or description'),
        tags: z.array(z.string()).optional().describe('Filter recipes by tags (e.g., "vegetarian", "quick", "healthy")'),
      }),
      execute: async ({ search, tags }: { search?: string; tags?: string[] }) => {
        const result = await getRecipes({ search, tags })

        if (!result.success || !result.data) {
          return { error: 'Failed to fetch recipes' }
        }

        // Return simplified recipe data for the AI
        return {
          recipes: result.data.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            prepTime: recipe.prep_time_minutes,
            cookTime: recipe.cook_time_minutes,
            servings: recipe.servings,
            tags: recipe.tags,
            ingredientCount: Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0,
          })),
          count: result.data.length,
        }
      },
    })

    const fetchWebContentTool = tool({
      description: 'Fetch and read content from a specific URL provided by the user. ONLY use this when the user gives you a URL to read. DO NOT use this to search for recipes.',
      inputSchema: z.object({
        url: z.string().url().describe('The URL of the website to fetch'),
        purpose: z.string().describe('What you\'re looking for on this page (e.g., "dietary guidelines", "meal plan details")'),
      }),
      execute: async ({ url, purpose }: { url: string; purpose: string }) => {
        try {
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; CookbookCoach/1.0)',
            },
          })

          if (!response.ok) {
            return { error: `Failed to fetch URL: ${response.statusText}` }
          }

          const html = await response.text()

          // Simple HTML to text conversion (remove tags)
          const text = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 5000) // Limit to 5000 chars

          return {
            url,
            purpose,
            content: text,
            note: 'Content has been extracted and simplified. Use this information to help the user.'
          }
        } catch (error) {
          return { error: `Failed to fetch content: ${error instanceof Error ? error.message : 'Unknown error'}` }
        }
      },
    })

    const updateDietaryPreferencesTool = tool({
      description: 'Update the user\'s dietary preferences including allergies, diet types, restrictions, and additional notes. Use this when the user asks you to set or update their dietary preferences.',
      inputSchema: z.object({
        dietary_preferences: dietaryPreferencesSchema.describe('Structured dietary preferences'),
        dietary_notes: z.string().optional().describe('Free-form dietary guidelines and notes'),
      }),
      execute: async ({ dietary_preferences, dietary_notes }) => {
        const result = await updateDietaryPreferences({
          dietary_preferences,
          dietary_notes: dietary_notes || null,
        })

        if (result.success) {
          return {
            success: true,
            message: 'Dietary preferences updated successfully!',
            preferences: dietary_preferences,
          }
        } else {
          return { error: result.error || 'Failed to update preferences' }
        }
      },
    })

    const saveRecipeTool = tool({
      description: 'Save a recipe to the user\'s recipe library. IMPORTANT: You must ALWAYS ask the user for explicit permission before calling this tool. Never save recipes without asking first. Try to include an image_url when possible - search for relevant recipe images from Unsplash or similar sources.',
      inputSchema: z.object({
        title: z.string().describe('Recipe title'),
        description: z.string().optional().describe('Brief description of the recipe'),
        ingredients: z.array(ingredientSchema).describe('List of ingredients with item, amount, and optional unit'),
        instructions: z.array(z.string()).describe('Step-by-step cooking instructions'),
        prep_time_minutes: z.number().int().optional().describe('Preparation time in minutes'),
        cook_time_minutes: z.number().int().optional().describe('Cooking time in minutes'),
        servings: z.number().int().optional().describe('Number of servings'),
        tags: z.array(z.string()).optional().describe('Tags for the recipe (e.g., "dinner", "vegetarian", "quick")'),
        source_url: z.string().url().optional().describe('Source URL if recipe is from a website'),
        image_url: z.string().url().optional().describe('Image URL for the recipe - try to find a relevant image from Unsplash, Pexels, or the source website'),
      }),
      execute: async (recipeData) => {
        try {
          console.log('[saveRecipe] Starting save for:', recipeData.title)
          // Transform instructions to the format expected by createRecipe
          const formattedData = {
            ...recipeData,
            instructions: recipeData.instructions.map(instruction => ({ value: instruction })),
            tags: recipeData.tags || [],
            servings: recipeData.servings || 4,
            is_public: false,
          }

          const result = await createRecipe(formattedData as any)

          if (result.success) {
            console.log('[saveRecipe] Success! Recipe ID:', result.data?.id)
            return {
              success: true,
              message: `Recipe "${recipeData.title}" has been saved to your library!`,
              recipeId: result.data?.id,
            }
          } else {
            console.error('[saveRecipe] Failed:', result.error)
            return {
              success: false,
              error: result.error || 'Failed to save recipe'
            }
          }
        } catch (error) {
          console.error('[saveRecipe] Exception:', error)
          return {
            success: false,
            error: `Failed to save recipe: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }
      },
    })

    const importRecipeTool = tool({
      description: 'Import a recipe from a URL by extracting its data. Use this when the user provides a recipe URL or when you find a recipe URL that might interest them. This tool extracts recipe data but does NOT save it - you must ask permission and use saveRecipe separately.',
      inputSchema: z.object({
        url: z.string().url().describe('The URL of the recipe to import'),
      }),
      execute: async ({ url }: { url: string }) => {
        try {
          console.log('[importRecipe] Starting import from:', url)
          const result = await importRecipeFromUrl(url)

          if (!result.success || !result.data) {
            console.error('[importRecipe] Failed:', result.error)
            return {
              success: false,
              error: result.error || 'Failed to import recipe from URL'
            }
          }

          console.log('[importRecipe] Success:', result.data.title)
          // Return the extracted recipe data
          return {
            success: true,
            message: `Successfully imported recipe: ${result.data.title}`,
            recipe: {
              title: result.data.title,
              description: result.data.description,
              prep_time_minutes: result.data.prep_time_minutes,
              cook_time_minutes: result.data.cook_time_minutes,
              servings: result.data.servings,
              ingredients: result.data.ingredients,
              instructions: result.data.instructions,
              tags: result.data.tags,
              image_url: result.data.image_url,
              source_url: result.data.source_url,
            },
          }
        } catch (error) {
          console.error('[importRecipe] Exception:', error)
          return {
            success: false,
            error: `Error importing recipe: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }
      },
    })

    const getMealPlansTool = tool({
      description: 'Get the user\'s meal plans. Use this when the user asks about their existing meal plans or wants to see what meal plans they have.',
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const result = await getMealPlans()

          if (!result.success || !result.data) {
            return { error: result.error || 'Failed to fetch meal plans' }
          }

          return {
            mealPlans: result.data.map(plan => ({
              id: plan.id,
              name: plan.name,
              start_date: plan.start_date,
              end_date: plan.end_date,
              dietary_requirements: plan.dietary_requirements,
            })),
            count: result.data.length,
          }
        } catch (error) {
          return { error: `Failed to fetch meal plans: ${error instanceof Error ? error.message : 'Unknown error'}` }
        }
      },
    })

    const createMealPlanTool = tool({
      description: 'Create a new meal plan for the user. Use this when the user asks to create a meal plan for a specific time period (e.g., "create a meal plan for next week").',
      inputSchema: z.object({
        name: z.string().min(1).describe('Name for the meal plan (e.g., "Week of Jan 15")'),
        start_date: z.string().describe('Start date in YYYY-MM-DD format'),
        end_date: z.string().describe('End date in YYYY-MM-DD format'),
        dietary_requirements: z.object({
          restrictions: z.array(z.string()).optional().describe('Dietary restrictions'),
          preferences: z.array(z.string()).optional().describe('Dietary preferences'),
          goals: z.array(z.string()).optional().describe('Dietary goals'),
        }).optional().describe('Optional dietary requirements for this meal plan'),
      }),
      execute: async ({ name, start_date, end_date, dietary_requirements }) => {
        try {
          const result = await createMealPlan({
            name,
            start_date,
            end_date,
            dietary_requirements: dietary_requirements || null,
          })

          if (result.success) {
            return {
              success: true,
              message: `Meal plan "${name}" created successfully!`,
              mealPlanId: result.data?.id,
              mealPlan: {
                id: result.data?.id,
                name: result.data?.name,
                start_date: result.data?.start_date,
                end_date: result.data?.end_date,
              },
            }
          } else {
            return { error: result.error || 'Failed to create meal plan' }
          }
        } catch (error) {
          return {
            error: `Failed to create meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }
      },
    })

    const addRecipeToMealPlanTool = tool({
      description: 'Add a recipe to a specific day and meal type. Use this when the user asks to add a recipe to a specific date (e.g., "add this recipe to Tuesday dinner"). The meal_plan_id is optional - only provide it if the user is working with a specific saved meal plan.',
      inputSchema: z.object({
        meal_plan_id: z.string().uuid().optional().describe('Optional ID of a saved meal plan. Leave empty for regular calendar-based meal planning.'),
        recipe_id: z.string().uuid().describe('ID of the recipe to add'),
        date: z.string().describe('Date in YYYY-MM-DD format'),
        meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).describe('Type of meal (breakfast, lunch, dinner, or snack)'),
        servings: z.number().int().min(1).max(100).optional().describe('Number of servings (defaults to 1)'),
        notes: z.string().max(500).optional().describe('Optional notes for this meal'),
      }),
      execute: async ({ meal_plan_id, recipe_id, date, meal_type, servings, notes }) => {
        try {
          const result = await addRecipeToMealSlot({
            meal_plan_id: meal_plan_id || null,
            recipe_id,
            date,
            meal_type,
            servings,
            notes,
          })

          if (result.success) {
            return {
              success: true,
              message: `Recipe added to ${meal_type} on ${date}!`,
            }
          } else {
            return { error: result.error || 'Failed to add recipe' }
          }
        } catch (error) {
          return {
            error: `Failed to add recipe: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        }
      },
    })

    // Build system prompt with dietary preferences
    let systemPrompt = `You are a meal planning assistant. Help users plan meals, manage recipes, and respect dietary needs.

TOOLS:
- searchRecipes: Find recipes in user's library (use this to suggest recipes)
- saveRecipe: Save to library (ask permission first, include image_url)
- importRecipe: Extract from URL (doesn't save, use with saveRecipe)
- updateDietaryPreferences: Update diet settings
- fetchWebContent: Read URL provided by user (ONLY use when user gives you a URL)
- getMealPlans: View saved plans
- createMealPlan: Create saved plan with name/dates
- addRecipeToMealPlan: Add recipe to date (meal_plan_id optional, dates YYYY-MM-DD, meal_type: breakfast/lunch/dinner/snack)

WORKFLOWS:
Finding Recipes: Use searchRecipes to find recipes in the user's library. If no matches, suggest they add recipes or ask if they have a URL to import.

Meal Planning: Users add recipes directly to dates without creating plans upfront. Use addRecipeToMealPlan with recipe_id, date, meal_type.

Import from URL: If user says "save/import/add this recipe [URL]", call importRecipe then immediately call saveRecipe with the extracted data.

IMPORTANT: Always respond with text after tool calls explaining what happened.`

    // Add dietary preferences context if available
    if (userProfile?.dietary_preferences || userProfile?.dietary_notes) {
      systemPrompt += '\n\nThe user has the following dietary preferences:'

      const prefs = userProfile.dietary_preferences as any
      if (prefs?.allergies?.length > 0) {
        systemPrompt += `\n- Allergies: ${prefs.allergies.join(', ')}`
      }
      if (prefs?.diets?.length > 0) {
        systemPrompt += `\n- Diet types: ${prefs.diets.join(', ')}`
      }
      if (prefs?.restrictions?.length > 0) {
        systemPrompt += `\n- Restrictions: ${prefs.restrictions.join(', ')}`
      }
      if (userProfile.dietary_notes) {
        systemPrompt += `\n- Additional notes: ${userProfile.dietary_notes}`
      }

      systemPrompt += '\n\nAlways respect these dietary preferences when making recommendations.'
    }

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      messages: convertToModelMessages(messages),
      system: systemPrompt,
      temperature: 0.7,
      stopWhen: stepCountIs(10),
      tools: {
        searchRecipes: searchRecipesTool,
        fetchWebContent: fetchWebContentTool,
        updateDietaryPreferences: updateDietaryPreferencesTool,
        importRecipe: importRecipeTool,
        saveRecipe: saveRecipeTool,
        getMealPlans: getMealPlansTool,
        createMealPlan: createMealPlanTool,
        addRecipeToMealPlan: addRecipeToMealPlanTool,
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
