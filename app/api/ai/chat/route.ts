import { anthropic } from '@ai-sdk/anthropic'
import { streamText, convertToModelMessages, tool, stepCountIs } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getRecipes, createRecipe } from '@/app/(dashboard)/recipes/actions'
import { updateDietaryPreferences, getUserProfile } from '@/app/(dashboard)/profile/actions'
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
      description: 'Fetch and read content from a website URL. Use this when the user asks you to check a website for dietary guidelines, recipes, or meal plans.',
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
            return {
              success: true,
              message: `Recipe "${recipeData.title}" has been saved to your library!`,
              recipeId: result.data?.id,
            }
          } else {
            return { error: result.error || 'Failed to save recipe' }
          }
        } catch (error) {
          return { error: `Failed to save recipe: ${error instanceof Error ? error.message : 'Unknown error'}` }
        }
      },
    })

    // Build system prompt with dietary preferences
    let systemPrompt = `You are a helpful meal planning and cooking assistant. You help users:
- Plan balanced, healthy meals
- Discover new recipes from their library
- Understand dietary needs and restrictions
- Organize their meal planning
- Get cooking tips and substitutions

You have access to several tools:
- searchRecipes: Search the user's recipe library
- fetchWebContent: Fetch content from websites when users ask you to check dietary guidelines or meal plans
- updateDietaryPreferences: Update the user's dietary preferences based on their requests
- saveRecipe: Save a recipe to the user's library

IMPORTANT RULES:
- When users ask you to check a website for dietary guidelines, use the fetchWebContent tool to read the site, then use updateDietaryPreferences to save the guidelines to their profile.
- When you create or find a recipe, you can offer to save it. BUT you must ALWAYS ask for explicit permission first. Say something like "Would you like me to save this recipe to your library?" and only call saveRecipe after they confirm.
- Never save recipes without asking for permission first, even if the user asked you to create one.
- When saving recipes, ALWAYS try to include an image_url. For AI-generated recipes, you can use Unsplash image URLs (e.g., https://images.unsplash.com/photo-[id]?w=800) for relevant food photos. For recipes from websites, try to extract the image URL from the source.

Be friendly, concise, and practical. Focus on actionable advice.
When discussing recipes, consider nutritional balance, variety, and the user's dietary preferences.`

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
      maxTokens: 2000,
      stopWhen: stepCountIs(5),
      tools: {
        searchRecipes: searchRecipesTool,
        fetchWebContent: fetchWebContentTool,
        updateDietaryPreferences: updateDietaryPreferencesTool,
        saveRecipe: saveRecipeTool,
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
