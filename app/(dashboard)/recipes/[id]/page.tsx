import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getRecipe } from '../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Edit, Clock, Users, ChefHat, ExternalLink } from 'lucide-react'
import type { RecipeWithParsedFields } from '@/types/recipe'
import { DeleteRecipeButton } from '@/components/recipes/delete-recipe-button'

interface RecipeDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
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

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{recipe.title}</h1>
          {recipe.description && (
            <p className="text-muted-foreground text-lg">{recipe.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/recipes/${recipe.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <DeleteRecipeButton recipeId={recipe.id} recipeName={recipe.title} />
        </div>
      </div>

      {/* Image */}
      {recipe.image_url && (
        <div className="relative w-full h-96 overflow-hidden rounded-lg">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}

      {/* Meta Info */}
      <div className="flex flex-wrap gap-4">
        {recipe.prep_time_minutes && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>Prep:</strong> {recipe.prep_time_minutes} min
            </span>
          </div>
        )}
        {recipe.cook_time_minutes && (
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>Cook:</strong> {recipe.cook_time_minutes} min
            </span>
          </div>
        )}
        {totalTime > 0 && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>Total:</strong> {totalTime} min
            </span>
          </div>
        )}
        {recipe.servings && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>Servings:</strong> {recipe.servings}
            </span>
          </div>
        )}
      </div>

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recipe.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Source Link */}
      {recipe.source_url && (
        <div>
          <Button asChild variant="link" className="px-0">
            <a href={recipe.source_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Original Recipe
            </a>
          </Button>
        </div>
      )}

      <Separator />

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
          <CardDescription>
            Everything you'll need for this recipe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>
                  {ingredient.amount && <strong>{ingredient.amount} </strong>}
                  {ingredient.unit && <span>{ingredient.unit} </span>}
                  <span>{ingredient.item}</span>
                  {ingredient.notes && (
                    <span className="text-muted-foreground"> ({ingredient.notes})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>
            Step-by-step directions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {recipe.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                  {index + 1}
                </span>
                <p className="flex-1 pt-1">{instruction}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Nutrition Info */}
      {recipe.nutrition_info && Object.keys(recipe.nutrition_info).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nutrition Information</CardTitle>
            <CardDescription>
              Per serving
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recipe.nutrition_info.calories && (
                <div className="text-center">
                  <p className="text-2xl font-bold">{recipe.nutrition_info.calories}</p>
                  <p className="text-sm text-muted-foreground">Calories</p>
                </div>
              )}
              {recipe.nutrition_info.protein && (
                <div className="text-center">
                  <p className="text-2xl font-bold">{recipe.nutrition_info.protein}g</p>
                  <p className="text-sm text-muted-foreground">Protein</p>
                </div>
              )}
              {recipe.nutrition_info.carbs && (
                <div className="text-center">
                  <p className="text-2xl font-bold">{recipe.nutrition_info.carbs}g</p>
                  <p className="text-sm text-muted-foreground">Carbs</p>
                </div>
              )}
              {recipe.nutrition_info.fat && (
                <div className="text-center">
                  <p className="text-2xl font-bold">{recipe.nutrition_info.fat}g</p>
                  <p className="text-sm text-muted-foreground">Fat</p>
                </div>
              )}
              {recipe.nutrition_info.fiber && (
                <div className="text-center">
                  <p className="text-2xl font-bold">{recipe.nutrition_info.fiber}g</p>
                  <p className="text-sm text-muted-foreground">Fiber</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
