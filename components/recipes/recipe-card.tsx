import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Users, Edit, Trash2 } from 'lucide-react'
import type { RecipeWithParsedFields } from '@/types/recipe'
import { DeleteRecipeButton } from './delete-recipe-button'

interface RecipeCardProps {
  recipe: RecipeWithParsedFields
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)

  return (
    <Card className="flex flex-col h-full">
      {recipe.image_url && (
        <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="object-cover w-full h-full"
          />
        </div>
      )}

      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2">
            <Link href={`/recipes/${recipe.id}`} className="hover:underline">
              {recipe.title}
            </Link>
          </CardTitle>
        </div>

        {recipe.description && (
          <CardDescription className="line-clamp-2">
            {recipe.description}
          </CardDescription>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {totalTime > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {totalTime} min
            </Badge>
          )}
          {recipe.servings && (
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {recipe.servings} servings
            </Badge>
          )}
        </div>

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {recipe.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{recipe.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardFooter className="flex gap-2 pt-0">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/recipes/${recipe.id}/edit`}>
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Link>
        </Button>
        <DeleteRecipeButton recipeId={recipe.id} recipeName={recipe.title} />
      </CardFooter>
    </Card>
  )
}
