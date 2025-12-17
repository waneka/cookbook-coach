import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { getRecipes } from './actions'
import { RecipeCard } from '@/components/recipes/recipe-card'
import { RecipeSearch } from '@/components/recipes/recipe-search'
import type { RecipeWithParsedFields } from '@/types/recipe'

interface RecipesPageProps {
  searchParams: Promise<{
    search?: string
  }>
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const params = await searchParams
  const result = await getRecipes({ search: params.search })
  const recipes = result.data || []

  // Transform database recipes to RecipeWithParsedFields
  const parsedRecipes: RecipeWithParsedFields[] = recipes.map(recipe => ({
    ...recipe,
    ingredients: recipe.ingredients as any,
    instructions: recipe.instructions as any,
    nutrition_info: recipe.nutrition_info as any,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground">
            {recipes.length === 0
              ? 'Get started by adding your first recipe'
              : `${recipes.length} recipe${recipes.length === 1 ? '' : 's'} in your collection`}
          </p>
        </div>
        <Button asChild>
          <Link href="/recipes/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Link>
        </Button>
      </div>

      <RecipeSearch />

      {recipes.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No recipes yet</CardTitle>
            <CardDescription>
              Get started by adding your first recipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You can manually enter recipes or import them from recipe websites.
            </p>
            <Button asChild>
              <Link href="/recipes/new">Add Your First Recipe</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parsedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  )
}
