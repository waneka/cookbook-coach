'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { DraggableRecipeCard } from './draggable-recipe-card'
import { getRecipes } from '@/app/(dashboard)/recipes/actions'
import type { Recipe } from '@/types/recipe'
import { ScrollArea } from '@/components/ui/scroll-area'

interface RecipeLibraryPanelProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function RecipeLibraryPanel({ isCollapsed, onToggleCollapse }: RecipeLibraryPanelProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    setLoading(true)
    const result = await getRecipes()
    if (result.success) {
      setRecipes(result.data)
    }
    setLoading(false)
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

  return (
    <Card className="border-t-4 bg-background py-0">
      <CardHeader className={isCollapsed ? "py-2 px-4" : "pb-2 pt-4"}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recipe Library</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8"
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Expand
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-2 pt-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading recipes...
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No recipes found' : 'No recipes yet'}
            </div>
          ) : (
            <ScrollArea className="h-[35vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pr-4">
                {filteredRecipes.map((recipe) => (
                  <DraggableRecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      )}
    </Card>
  )
}
