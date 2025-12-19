'use client'

import { Card } from '@/components/ui/card'
import type { Recipe } from '@/types/recipe'

interface RecipeDragOverlayProps {
  recipe: Recipe
}

export function RecipeDragOverlay({ recipe }: RecipeDragOverlayProps) {
  return (
    <Card className="opacity-60 bg-primary/10 backdrop-blur-sm border-2 border-primary shadow-lg">
      <div className="px-2 py-1">
        <p className="text-xs font-medium truncate max-w-[150px]">
          {recipe.title}
        </p>
      </div>
    </Card>
  )
}
