import { notFound } from 'next/navigation'
import { RecipeForm } from '@/components/recipes/recipe-form'
import { getRecipe } from '../../actions'
import type { RecipeWithParsedFields } from '@/types/recipe'

interface EditRecipePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params
  const result = await getRecipe(id)

  if (!result.success || !result.data) {
    notFound()
  }

  // Transform database recipe to RecipeWithParsedFields
  const recipe: RecipeWithParsedFields = {
    ...result.data,
    ingredients: result.data.ingredients as any,
    instructions: result.data.instructions as any,
    nutrition_info: result.data.nutrition_info as any,
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Recipe</h1>
        <p className="text-muted-foreground mt-2">
          Update your recipe details
        </p>
      </div>

      <RecipeForm recipe={recipe} mode="edit" />
    </div>
  )
}
