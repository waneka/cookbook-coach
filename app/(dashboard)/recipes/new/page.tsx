import { RecipeForm } from '@/components/recipes/recipe-form'

export default function NewRecipePage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Recipe</h1>
        <p className="text-muted-foreground mt-2">
          Add a new recipe to your collection
        </p>
      </div>

      <RecipeForm mode="create" />
    </div>
  )
}
