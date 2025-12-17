import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default function RecipesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground">
            Manage your recipe collection
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/recipes/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Link>
        </Button>
      </div>

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
            <Link href="/dashboard/recipes/new">Add Your First Recipe</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
