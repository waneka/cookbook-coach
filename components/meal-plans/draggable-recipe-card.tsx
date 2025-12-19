'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import type { Recipe } from '@/types/recipe'
import { Clock } from 'lucide-react'

interface DraggableRecipeCardProps {
  recipe: Recipe
}

export function DraggableRecipeCard({ recipe }: DraggableRecipeCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: recipe.id,
    data: { recipe },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  }

  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex gap-3 p-3">
          {recipe.image_url && (
            <div className="relative w-20 h-20 rounded overflow-hidden flex-shrink-0">
              <Image
                src={recipe.image_url}
                alt={recipe.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate text-sm">{recipe.title}</h4>
            {recipe.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {recipe.description}
              </p>
            )}
            {totalTime > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {totalTime}m
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
