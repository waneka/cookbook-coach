import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users } from 'lucide-react'
import type { RecipeWithParsedFields } from '@/types/recipe'

interface RecipeCardProps {
  recipe: RecipeWithParsedFields
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)

  return (
    <Link href={`/recipes/${recipe.id}`} className="h-full">
      <Card className="h-full flex flex-col overflow-hidden transition-colors hover:bg-accent cursor-pointer">
        {recipe.image_url && (
          <div className="relative w-full h-48 overflow-hidden shrink-0">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}

        <CardHeader className="pb-3">
          <CardTitle className="line-clamp-2">
            {recipe.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="pb-4 pt-0 mt-auto">
          {(totalTime > 0 || recipe.servings) && (
            <div className="flex flex-wrap gap-2 mb-3">
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
          )}

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
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
        </CardContent>
      </Card>
    </Link>
  )
}
