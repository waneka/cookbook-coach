import { anthropic } from '@ai-sdk/anthropic'
import { streamText, convertToModelMessages, tool, stepCountIs } from 'ai'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getRecipes, createRecipe, importRecipeFromUrl } from '@/app/(dashboard)/recipes/actions'
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
- importRecipe: Import/extract recipe data from a URL (does NOT save automatically)
- saveRecipe: Save a recipe to the user's library

IMPORTANT RULES:
- When users ask you to check a website for dietary guidelines, use the fetchWebContent tool to read the site, then use updateDietaryPreferences to save the guidelines to their profile.

IMPORTING RECIPES FROM URLs - WORKFLOW:
- If the user EXPLICITLY asks to "save", "import", or "add" a recipe from a URL (e.g., "save this recipe: https://..."):
  1. Call importRecipe with the URL
  2. Wait for the result
  3. IMMEDIATELY call saveRecipe with the extracted recipe data (from importRecipe's output.recipe)
  4. Both steps happen in the SAME response - do not wait for user confirmation between steps
  5. This is a TWO-STEP process that you must complete automatically when the user explicitly asks to save

- If a recipe URL comes up ORGANICALLY in conversation (user casually mentions it, or you suggest one without them asking to save):
  1. Call importRecipe to extract and preview the recipe
  2. Show the preview and ask: "This looks great! Would you like me to save it to your library?"
  3. Only call saveRecipe if they confirm

- The importRecipe tool extracts recipe data but does NOT save it. The saveRecipe tool saves it to the library. When user explicitly asks to save from URL, you MUST call BOTH tools in sequence.

SAVING RECIPES:
- When you create or find a recipe, you can offer to save it. BUT you must ALWAYS ask for explicit permission first. Say something like "Would you like me to save this recipe to your library?" and only call saveRecipe after they confirm.
- Never save recipes without asking for permission first, even if the user asked you to create one.
- When saving recipes, ALWAYS try to include an image_url. For AI-generated recipes, you can use Unsplash image URLs (e.g., https://images.unsplash.com/photo-[id]?w=800) for relevant food photos. For recipes from websites, the importRecipe tool will provide the image URL.

CRITICAL - ALWAYS RESPOND WITH TEXT:
After calling ANY tool, you MUST IMMEDIATELY respond with a text message explaining what happened. This is MANDATORY:
- If importRecipe succeeds: "I've imported the recipe '[Recipe Name]'. Would you like me to save it to your library?"
- If saveRecipe succeeds: "✓ Successfully saved '[Recipe Name]' to your library!"
- If searchRecipes returns results: "I found [N] recipes: [list them]"
- If a tool fails: "Sorry, I encountered an error: [explain the issue]"
- DO NOT just call a tool and stop. ALWAYS follow up with a text explanation.
- Every tool call MUST be followed by a user-facing text response in the same turn.

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
      stopWhen: stepCountIs(10),
      tools: {
        searchRecipes: searchRecipesTool,
        fetchWebContent: fetchWebContentTool,
        updateDietaryPreferences: updateDietaryPreferencesTool,
        importRecipe: importRecipeTool,
        saveRecipe: saveRecipeTool,
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
