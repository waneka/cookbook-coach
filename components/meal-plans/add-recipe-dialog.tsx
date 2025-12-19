'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { getRecipes } from '@/app/(dashboard)/recipes/actions'
import { addRecipeToMealSlot } from '@/app/(dashboard)/meal-plans/actions'
import type { Recipe } from '@/types/recipe'
import type { MealType } from '@/types/meal-plan'
import { Loader2, Search } from 'lucide-react'
import Image from 'next/image'

interface AddRecipeDialogProps {
  mealPlanId: string | null
  date: string
  mealType: MealType
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddRecipeDialog({
  mealPlanId,
  date,
  mealType,
  open,
  onOpenChange,
}: AddRecipeDialogProps) {
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (open) {
      loadRecipes()
    }
  }, [open])

  const loadRecipes = async () => {
    setLoading(true)
    const result = await getRecipes()
    if (result.success) {
      setRecipes(result.data)
    } else {
      toast.error('Failed to load recipes')
    }
    setLoading(false)
  }

  const handleAddRecipe = async (recipeId: string) => {
    setAdding(true)
    try {
      const result = await addRecipeToMealSlot({
        meal_plan_id: mealPlanId,
        recipe_id: recipeId,
        date,
        meal_type: mealType,
      })

      if (result.success) {
        toast.success('Recipe added')
        onOpenChange(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to add recipe')
      }
    } catch (error) {
      toast.error('Failed to add recipe')
    } finally {
      setAdding(false)
    }
  }

  const filteredRecipes = recipes.filter((recipe) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      recipe.title.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query) ||
      recipe.tags?.some((tag) => tag.toLowerCase().includes(query))
    )
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Recipe</DialogTitle>
          <DialogDescription>
            Choose a recipe for {mealType} on {formatDate(date)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No recipes found matching your search' : 'No recipes yet. Create one first!'}
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => handleAddRecipe(recipe.id)}
                    disabled={adding}
                    className="w-full flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-left disabled:opacity-50"
                  >
                    {recipe.image_url && (
                      <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={recipe.image_url}
                          alt={recipe.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{recipe.title}</h4>
                      {recipe.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {recipe.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {recipe.prep_time_minutes && (
                          <span className="text-xs text-muted-foreground">
                            Prep: {recipe.prep_time_minutes}m
                          </span>
                        )}
                        {recipe.cook_time_minutes && (
                          <span className="text-xs text-muted-foreground">
                            Cook: {recipe.cook_time_minutes}m
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
